import { Router } from "express";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/role";
import { ok, error } from "../lib/response";

const router = Router();
router.use(authMiddleware);
router.use(adminMiddleware);

// ─── HORARIOS CRUD ───────────────────────────────────────────────────────────

// GET /api/horarios
router.get("/", async (req, res) => {
  try {
    const horarios = await prisma.horario.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { miembros: true } } },
    });
    ok(res, horarios);
  } catch {
    error(res, "Error al obtener horarios", 500);
  }
});

// GET /api/horarios/:id
router.get("/:id", async (req, res) => {
  try {
    const horario = await prisma.horario.findUnique({
      where: { id: req.params.id as string },
      include: {
        miembros: {
          include: { miembro: { select: { id: true, nombre: true, apellido: true, cargo: true, area: true, fotoUrl: true, estado: true } } },
        },
        _count: { select: { miembros: true, sesiones: true } },
      },
    });
    if (!horario) { error(res, "Horario no encontrado", 404); return; }
    ok(res, horario);
  } catch {
    error(res, "Error al obtener horario", 500);
  }
});

// POST /api/horarios
router.post("/", async (req, res) => {
  try {
    const { nombre, descripcion, diasSemana, hora } = req.body;
    const horario = await prisma.horario.create({
      data: { nombre, descripcion: descripcion || null, diasSemana: diasSemana.map(Number), hora },
    });
    ok(res, horario, 201);
  } catch {
    error(res, "Error al crear horario", 500);
  }
});

// PUT /api/horarios/:id
router.put("/:id", async (req, res) => {
  try {
    const { nombre, descripcion, diasSemana, hora } = req.body;
    const horario = await prisma.horario.update({
      where: { id: req.params.id as string },
      data: { nombre, descripcion: descripcion || null, diasSemana: diasSemana.map(Number), hora },
    });
    ok(res, horario);
  } catch (err: any) {
    if (err.code === "P2025") { error(res, "Horario no encontrado", 404); return; }
    error(res, "Error al actualizar horario", 500);
  }
});

// DELETE /api/horarios/:id
router.delete("/:id", async (req, res) => {
  try {
    await prisma.horario.delete({ where: { id: req.params.id as string } });
    ok(res, { message: "Horario eliminado" });
  } catch (err: any) {
    if (err.code === "P2025") { error(res, "Horario no encontrado", 404); return; }
    error(res, "Error al eliminar horario", 500);
  }
});

// ─── MIEMBROS DEL HORARIO ────────────────────────────────────────────────────

// POST /api/horarios/:id/miembros  — agregar miembro
router.post("/:id/miembros", async (req, res) => {
  try {
    const horarioId = req.params.id as string;
    const { miembroId } = req.body;
    await prisma.horarioMiembro.create({ data: { horarioId, miembroId } });
    ok(res, { message: "Miembro agregado al horario" }, 201);
  } catch (err: any) {
    if (err.code === "P2002") { error(res, "El miembro ya pertenece a este horario", 400); return; }
    error(res, "Error al agregar miembro", 500);
  }
});

// DELETE /api/horarios/:id/miembros/:miembroId
router.delete("/:id/miembros/:miembroId", async (req, res) => {
  try {
    await prisma.horarioMiembro.delete({
      where: { horarioId_miembroId: { horarioId: req.params.id as string, miembroId: req.params.miembroId as string } },
    });
    ok(res, { message: "Miembro removido del horario" });
  } catch {
    error(res, "Error al remover miembro", 500);
  }
});

// ─── PASAR ASISTENCIA MASIVA ─────────────────────────────────────────────────

// POST /api/horarios/:id/sesion
// Body: { fecha, descripcion?, registros: [{ miembroId, tipo, observacion? }] }
router.post("/:id/sesion", async (req, res) => {
  try {
    const horarioId = req.params.id as string;
    const { fecha, descripcion, registros } = req.body as {
      fecha: string;
      descripcion?: string;
      registros: { miembroId: string; tipo: string; observacion?: string }[];
    };

    const sesion = await prisma.sesion.create({
      data: {
        horarioId,
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
      include: { asistencias: true },
    });

    ok(res, sesion, 201);
  } catch (err) {
    console.error(err);
    error(res, "Error al registrar sesión de asistencia", 500);
  }
});

// ─── REPORTE ─────────────────────────────────────────────────────────────────

// GET /api/horarios/reporte/asistencias?desde=&hasta=&horarioId=&area=
router.get("/reporte/asistencias", async (req, res) => {
  try {
    const desde = req.query.desde ? new Date(req.query.desde as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const hasta = req.query.hasta ? new Date(req.query.hasta as string) : new Date();
    hasta.setHours(23, 59, 59, 999);

    const horarioId = req.query.horarioId as string | undefined;
    const area = req.query.area as string | undefined;

    const miembroWhere: any = {};
    if (area) miembroWhere.area = area;
    if (horarioId) miembroWhere.horarios = { some: { horarioId } };

    const miembros = await prisma.miembro.findMany({
      where: { ...miembroWhere, estado: "ACTIVO" },
      select: {
        id: true, nombre: true, apellido: true, cargo: true, area: true, dni: true, fotoUrl: true,
        asistencias: {
          where: { fecha: { gte: desde, lte: hasta } },
          select: { tipo: true, fecha: true, sesionId: true },
        },
      },
      orderBy: [{ area: "asc" }, { apellido: "asc" }],
    });

    const reporte = miembros.map((m) => {
      const resumen = { PRESENTE: 0, AUSENTE: 0, TARDANZA: 0, PERMISO: 0, total: m.asistencias.length };
      for (const a of m.asistencias) resumen[a.tipo as keyof typeof resumen]++;
      const pct = resumen.total > 0 ? Math.round((resumen.PRESENTE / resumen.total) * 100) : null;
      return { id: m.id, nombre: m.nombre, apellido: m.apellido, cargo: m.cargo, area: m.area, dni: m.dni, fotoUrl: m.fotoUrl, resumen, pctAsistencia: pct };
    });

    const areas = await prisma.miembro.groupBy({ by: ["area"], _count: { _all: true } });

    ok(res, {
      desde: desde.toISOString(),
      hasta: hasta.toISOString(),
      miembros: reporte,
      areas: areas.map((a) => a.area),
    });
  } catch (err) {
    console.error(err);
    error(res, "Error al generar reporte", 500);
  }
});

export default router;
