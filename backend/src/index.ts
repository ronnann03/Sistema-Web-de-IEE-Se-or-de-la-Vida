import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import authRoutes from "./routes/auth";
import miembrosRoutes from "./routes/miembros";
import statsRoutes from "./routes/stats";
import horariosRoutes from "./routes/horarios";
import asistenciasRoutes from "./routes/asistencias";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : [/^http:\/\/localhost:\d+$/];
      if (!origin || allowed.some((p) => (p instanceof RegExp ? p.test(origin) : p === origin))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS bloqueado: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Servir archivos estáticos (uploads)
const uploadDir = path.join(__dirname, "..", process.env.UPLOAD_DIR || "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/miembros", miembrosRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/horarios", horariosRoutes);
app.use("/api/asistencias", asistenciasRoutes);

// Ruta base
app.get("/", (req, res) => {
  res.send("API IEE Señor de la Vida funcionando");
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
