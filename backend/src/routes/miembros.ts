import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { ok, error } from "../lib/response";

const router = Router();

const uploadDir = path.join(__dirname, "..", "..", process.env.UPLOAD_DIR || "uploads");

// Multer para fotos de perfil
const fotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const suffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `foto-${suffix}${path.extname(file.originalname)}`);
  },
});
const uploadFoto = multer({
  storage: fotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se aceptan imágenes JPG, PNG o WEBP"));
  },
});

// Multer para documentos (CV, contratos, etc.)
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const suffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `doc-${suffix}${path.extname(file.originalname)}`);
  },
});
const uploadDoc = multer({
  storage: docStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const valid = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (valid.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se aceptan archivos PDF o Word"));
  },
});

router.use(authMiddleware);

// ─── MIEMBROS ────────────────────────────────────────────────────────────────

// GET /api/miembros
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 10);
    const search = ((req.query.search as string) || "").trim();
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { nombre: { contains: search, mode: "insensitive" as const } },
        { apellido: { contains: search, mode: "insensitive" as const } },
        { dni: { contains: search } },
        { cargo: { contains: search, mode: "insensitive" as const } },
      ],
    } : {};

    const [data, total] = await Promise.all([
      prisma.miembro.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.miembro.count({ where }),
    ]);

    ok(res, { data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch {
    error(res, "Error al obtener miembros", 500);
  }
});

// GET /api/miembros/:id
router.get("/:id", async (req, res) => {
  try {
    const miembro = await prisma.miembro.findUnique({ where: { id: req.params.id as string } });
    if (!miembro) { error(res, "Miembro no encontrado", 404); return; }
    ok(res, miembro);
  } catch {
    error(res, "Error al obtener miembro", 500);
  }
});

// POST /api/miembros
router.post("/", uploadFoto.single("foto"), async (req, res) => {
  try {
    const d = req.body;
    const nuevoMiembro = await prisma.miembro.create({
      data: {
        nombre: d.nombre,
        apellido: d.apellido,
        dni: d.dni,
        fechaNacimiento: new Date(d.fechaNacimiento),
        genero: d.genero,
        telefono: d.telefono,
        direccion: d.direccion,
        cargo: d.cargo,
        area: d.area,
        fechaIngreso: new Date(d.fechaIngreso),
        tipoContrato: d.tipoContrato,
        sueldo: parseFloat(d.sueldo),
        estado: d.estado || "ACTIVO",
        fotoUrl: req.file ? `/uploads/${req.file.filename}` : null,
      },
    });
    ok(res, nuevoMiembro, 201);
  } catch (err: any) {
    console.error(err);
    if (err.code === "P2002") { error(res, "El DNI ya está registrado", 400); return; }
    error(res, "Error al crear miembro", 500);
  }
});

// PUT /api/miembros/:id
router.put("/:id", uploadFoto.single("foto"), async (req, res) => {
  try {
    const id = req.params.id as string;
    const d = req.body;
    const updateData: any = { ...d };

    if (d.fechaNacimiento) updateData.fechaNacimiento = new Date(d.fechaNacimiento);
    if (d.fechaIngreso) updateData.fechaIngreso = new Date(d.fechaIngreso);
    if (d.sueldo) updateData.sueldo = parseFloat(d.sueldo);

    if (req.file) {
      updateData.fotoUrl = `/uploads/${req.file.filename}`;
      const actual = await prisma.miembro.findUnique({ where: { id }, select: { fotoUrl: true } });
      if (actual?.fotoUrl) {
        const old = path.join(__dirname, "..", "..", actual.fotoUrl);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
    }

    const miembro = await prisma.miembro.update({ where: { id }, data: updateData });
    ok(res, miembro);
  } catch (err: any) {
    if (err.code === "P2025") { error(res, "Miembro no encontrado", 404); return; }
    if (err.code === "P2002") { error(res, "El DNI ya está registrado", 400); return; }
    error(res, "Error al actualizar miembro", 500);
  }
});

// DELETE /api/miembros/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const miembro = await prisma.miembro.findUnique({ where: { id } });
    if (!miembro) { error(res, "Miembro no encontrado", 404); return; }

    if (miembro.fotoUrl) {
      const p = path.join(__dirname, "..", "..", miembro.fotoUrl);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    // Eliminar archivos de documentos del miembro
    const docs = await prisma.documento.findMany({ where: { miembroId: id } });
    for (const doc of docs) {
      const p = path.join(__dirname, "..", "..", doc.url);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }

    await prisma.miembro.delete({ where: { id } });
    ok(res, { message: "Miembro eliminado" });
  } catch {
    error(res, "Error al eliminar miembro", 500);
  }
});

// ─── ASISTENCIAS ─────────────────────────────────────────────────────────────

// GET /api/miembros/:id/asistencias
router.get("/:id/asistencias", async (req, res) => {
  try {
    const asistencias = await prisma.asistencia.findMany({
      where: { miembroId: req.params.id as string },
      orderBy: { fecha: "desc" },
    });
    ok(res, asistencias);
  } catch {
    error(res, "Error al obtener asistencias", 500);
  }
});

// POST /api/miembros/:id/asistencias
router.post("/:id/asistencias", async (req, res) => {
  try {
    const miembroId = req.params.id as string;
    const { fecha, tipo, observacion } = req.body;

    const miembro = await prisma.miembro.findUnique({ where: { id: miembroId } });
    if (!miembro) { error(res, "Miembro no encontrado", 404); return; }

    const asistencia = await prisma.asistencia.create({
      data: { miembroId, fecha: new Date(fecha), tipo, observacion: observacion || null },
    });
    ok(res, asistencia, 201);
  } catch {
    error(res, "Error al registrar asistencia", 500);
  }
});

// DELETE /api/miembros/:id/asistencias/:asistenciaId
router.delete("/:id/asistencias/:asistenciaId", async (req, res) => {
  try {
    await prisma.asistencia.delete({ where: { id: req.params.asistenciaId as string } });
    ok(res, { message: "Asistencia eliminada" });
  } catch (err: any) {
    if (err.code === "P2025") { error(res, "Asistencia no encontrada", 404); return; }
    error(res, "Error al eliminar asistencia", 500);
  }
});

// ─── DOCUMENTOS ──────────────────────────────────────────────────────────────

// GET /api/miembros/:id/documentos
router.get("/:id/documentos", async (req, res) => {
  try {
    const documentos = await prisma.documento.findMany({
      where: { miembroId: req.params.id as string },
      orderBy: { createdAt: "desc" },
    });
    ok(res, documentos);
  } catch {
    error(res, "Error al obtener documentos", 500);
  }
});

// POST /api/miembros/:id/documentos
router.post("/:id/documentos", uploadDoc.single("archivo"), async (req, res) => {
  try {
    const miembroId = req.params.id as string;
    if (!req.file) { error(res, "No se recibió ningún archivo", 400); return; }

    const miembro = await prisma.miembro.findUnique({ where: { id: miembroId } });
    if (!miembro) { error(res, "Miembro no encontrado", 404); return; }

    const documento = await prisma.documento.create({
      data: {
        miembroId,
        nombre: req.body.nombre || req.file.originalname,
        tipoDoc: req.body.tipoDoc || "CV",
        url: `/uploads/${req.file.filename}`,
        tamano: req.file.size,
      },
    });
    ok(res, documento, 201);
  } catch {
    error(res, "Error al subir documento", 500);
  }
});

// DELETE /api/miembros/:id/documentos/:documentoId
router.delete("/:id/documentos/:documentoId", async (req, res) => {
  try {
    const doc = await prisma.documento.findUnique({ where: { id: req.params.documentoId as string } });
    if (!doc) { error(res, "Documento no encontrado", 404); return; }

    const filePath = path.join(__dirname, "..", "..", doc.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.documento.delete({ where: { id: doc.id } });
    ok(res, { message: "Documento eliminado" });
  } catch {
    error(res, "Error al eliminar documento", 500);
  }
});

export default router;
