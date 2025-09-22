import { Router } from "express";
import { query } from "../db.js";
import { authRequired } from "../middleware/auth.js";
import { nextStatus } from "../utils/nextStatus.js";

const router = Router();

// POST /tasks
router.post("/", authRequired, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: "Título requerido" });

    const insert = await query(
      "INSERT INTO tasks(user_id,title,description) VALUES($1,$2,$3) RETURNING *",
      [req.user.id, title, description || null]
    );

    res.status(201).json(insert.rows[0]);
  } catch {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// GET /tasks/:userId
router.get("/:userId", authRequired, async (req, res) => {
  if (parseInt(req.params.userId) !== req.user.id)
    return res.status(403).json({ error: "No autorizado" });

  const list = await query("SELECT * FROM tasks WHERE user_id=$1 ORDER BY created_at DESC", [req.user.id]);
  res.json(list.rows);
});

// PUT /tasks/:id/status
router.put("/:id/status", authRequired, async (req, res) => {
  const { id } = req.params;
  const current = await query("SELECT * FROM tasks WHERE id=$1", [id]);

  if (current.rowCount === 0) return res.status(404).json({ error: "Tarea no encontrada" });
  if (current.rows[0].user_id !== req.user.id)
    return res.status(403).json({ error: "No autorizado" });

  const newStatus = nextStatus(current.rows[0].status);
  const upd = await query("UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *", [newStatus, id]);
  res.json(upd.rows[0]);
});

export default router;
