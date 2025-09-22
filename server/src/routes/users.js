import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db.js";

const router = Router();

// POST /users/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Todos los campos son requeridos" });

    const existing = await query("SELECT id FROM users WHERE email=$1", [email]);
    if (existing.rowCount > 0)
      return res.status(409).json({ error: "Email ya registrado" });

    const hash = await bcrypt.hash(password, 10);
    const insert = await query(
      "INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING id,name,email",
      [name, email, hash]
    );

    res.status(201).json(insert.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// POST /users/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query("SELECT * FROM users WHERE email=$1", [email]);

    if (result.rowCount === 0) return res.status(401).json({ error: "Credenciales inválidas" });

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

export default router;
