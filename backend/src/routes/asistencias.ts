import { Router } from "express";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/role";
import { ok, error } from "../lib/response";

const router = Router();
router.use(authMiddleware);

// GET /api/asistencias/entrada
// Admin: lista todas las marcas. Usuario estandar: lista solo sus marcas.
router.get("/entrada", async (req: any, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.userId },
      select: { rol: true, miembroId: true },
    });

    if (!usuario) {
      error(res, "Usuario no encontrado", 404);
      return;
    }

    if (usuario.rol !== "ADMIN" && !usuario.miembroId) {
      error(res, "Tu cuenta no esta vinculada a un miembro", 400);
      return;
    }

    const fecha = typeof req.query.fecha === "string" ? req.query.fecha : undefined;
    const from = fecha ? new Date(`${fecha}T00:00:00`) : undefined;
    const to = fecha ? new Date(`${fecha}T23:59:59.999`) : undefined;

    const asistencias = await prisma.asistencia.findMany({
      where: {
        ...(usuario.rol === "ADMIN" ? {} : { miembroId: usuario.miembroId! }),
        ...(from && to ? { fecha: { gte: from, lte: to } } : {}),
      },
      include: {
        miembro: {
          select: { id: true, nombre: true, apellido: true, dni: true, cargo: true, area: true, fotoUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: usuario.rol === "ADMIN" ? 100 : 20,
    });

    ok(res, asistencias);
  } catch (err) {
    console.error(err);
    error(res, "Error al obtener marcas de entrada", 500);
  }
});

// POST /api/asistencias/entrada
// Marca entrada del usuario autenticado vinculado a un miembro.
router.post("/entrada", async (req: any, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.userId },
      select: { miembroId: true },
    });

    if (!usuario?.miembroId) {
      error(res, "Tu cuenta no esta vinculada a un miembro", 400);
      return;
    }

    const fecha = new Date();
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);

    const existente = await prisma.asistencia.findFirst({
      where: {
        miembroId: usuario.miembroId,
        fecha: { gte: inicio, lte: fin },
        observacion: { contains: "Entrada" },
      },
    });

    if (existente) {
      error(res, "Ya marcaste entrada hoy", 409);
      return;
    }

    const asistencia = await prisma.asistencia.create({
      data: {
        miembroId: usuario.miembroId,
        fecha,
        tipo: "PRESENTE",
        observacion: req.body?.observacion || "Entrada marcada por usuario",
      },
      include: {
        miembro: {
          select: { id: true, nombre: true, apellido: true, dni: true, cargo: true, area: true, fotoUrl: true },
        },
      },
    });

    ok(res, asistencia, 201);
  } catch (err) {
    console.error(err);
    error(res, "Error al marcar entrada", 500);
  }
});

// POST /api/asistencias/bulk
// Registra asistencia para varios miembros a la vez sin requerir horario
router.post("/bulk", adminMiddleware, async (req, res) => {
  try {
    const { fecha, descripcion, registros } = req.body as {
      fecha: string;
      descripcion?: string;
      registros: { miembroId: string; tipo: string; observacion?: string }[];
    };

    if (!fecha || !registros?.length) {
      error(res, "Fecha y registros son requeridos", 400);
      return;
    }

    // Crear sesión sin horario
    const sesion = await prisma.sesion.create({
      data: {
        fecha: new Date(fecha),
        descripcion: descripcion || null,
        asistencias: {
          createMany: {
            data: registros.map((r) => ({
              miembroId: r.miembroId,
              fecha: new Date(fecha),
              tipo: r.tipo as any,
              observacion: r.observacion || null,
            })),
          },
        },
      },
      include: { _count: { select: { asistencias: true } } },
    });

    ok(res, sesion, 201);
  } catch (err) {
    console.error(err);
    error(res, "Error al registrar asistencia", 500);
  }
});

export default router;
