// server/src/db.js
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

/** Named export: query */
export const query = (text, params) => pool.query(text, params);

/** (opcional) también exporta el pool por si lo necesitas */
export { pool };
