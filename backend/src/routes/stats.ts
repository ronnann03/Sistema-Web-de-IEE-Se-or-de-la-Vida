import { Router } from "express";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { ok, error } from "../lib/response";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);

    const [
      totalMiembros,
      activosMiembros,
      nuevosEsteMes,
      nuevosMesAnterior,
      miembrosPorArea,
      miembrosPorContrato,
      miembrosPorGenero,
      ultimosMiembros,
      asistenciasEsteMes,
      asistenciasPorTipo,
      totalDocumentos,
    ] = await Promise.all([
      prisma.miembro.count(),
      prisma.miembro.count({ where: { estado: "ACTIVO" } }),
      prisma.miembro.count({ where: { createdAt: { gte: inicioMes } } }),
      prisma.miembro.count({ where: { createdAt: { gte: inicioMesAnterior, lte: finMesAnterior } } }),
      prisma.miembro.groupBy({ by: ["area"], _count: { _all: true }, orderBy: { _count: { area: "desc" } } }),
      prisma.miembro.groupBy({ by: ["tipoContrato"], _count: { _all: true } }),
      prisma.miembro.groupBy({ by: ["genero"], _count: { _all: true } }),
      prisma.miembro.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, nombre: true, apellido: true, cargo: true, area: true, fotoUrl: true, createdAt: true } }),
      prisma.asistencia.count({ where: { fecha: { gte: inicioMes } } }),
      prisma.asistencia.groupBy({ by: ["tipo"], _count: { _all: true }, where: { fecha: { gte: inicioMes } } }),
      prisma.documento.count(),
    ]);

    ok(res, {
      miembros: {
        total: totalMiembros,
        activos: activosMiembros,
        inactivos: totalMiembros - activosMiembros,
        nuevosEsteMes,
        nuevosMesAnterior,
        porArea: miembrosPorArea.map((r) => ({ area: r.area, total: r._count._all })),
        porContrato: miembrosPorContrato.map((r) => ({ tipo: r.tipoContrato, total: r._count._all })),
        porGenero: miembrosPorGenero.map((r) => ({ genero: r.genero, total: r._count._all })),
        ultimos: ultimosMiembros,
      },
      asistencias: {
        totalEsteMes: asistenciasEsteMes,
        porTipo: asistenciasPorTipo.map((r) => ({ tipo: r.tipo, total: r._count._all })),
      },
      documentos: {
        total: totalDocumentos,
      },
    });
  } catch (err) {
    console.error(err);
    error(res, "Error al obtener estadísticas", 500);
  }
});

export default router;
