import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import usersRouter from "./routes/users.js";
import tasksRouter from "./routes/tasks.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;


app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());


app.use("/users", usersRouter);
app.use("/tasks", tasksRouter);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "../../public");
app.use(express.static(publicDir));

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
