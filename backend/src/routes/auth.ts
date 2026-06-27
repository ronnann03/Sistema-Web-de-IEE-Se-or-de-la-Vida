import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { ok, error } from "../lib/response";

const router = Router();

const toAuthUser = (usuario: {
  id: string;
  nombre: string;
  email: string;
  rol: "ADMIN" | "ESTANDAR";
  miembroId: string | null;
}) => ({
  id: usuario.id,
  nombre: usuario.nombre,
  email: usuario.email,
  rol: usuario.rol,
  miembroId: usuario.miembroId,
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    error(res, "Email y contraseña requeridos", 400);
    return;
  }
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true, nombre: true, email: true, password: true, rol: true, miembroId: true },
  });
  if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
    error(res, "Credenciales incorrectas", 401);
    return;
  }
  const token = jwt.sign({ userId: usuario.id }, process.env.JWT_SECRET!, { expiresIn: "8h" });
  ok(res, { token, user: toAuthUser(usuario) });
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.userId },
    select: { id: true, nombre: true, email: true, rol: true, miembroId: true },
  });
  if (!usuario) { error(res, "Usuario no encontrado", 404); return; }
  ok(res, toAuthUser(usuario));
});

export default router;
