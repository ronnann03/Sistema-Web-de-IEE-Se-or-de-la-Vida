import { Router } from "express";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { ok, error } from "../lib/response";

const router = Router();
router.use(authMiddleware);

// POST /api/asistencias/bulk
// Registra asistencia para varios miembros a la vez sin requerir horario
router.post("/bulk", async (req, res) => {
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
