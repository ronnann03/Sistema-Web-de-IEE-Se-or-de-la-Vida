import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { ok, error } from "../lib/response";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    error(res, "Email y contraseña requeridos", 400);
    return;
  }
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
    error(res, "Credenciales incorrectas", 401);
    return;
  }
  const token = jwt.sign({ userId: usuario.id }, process.env.JWT_SECRET!, { expiresIn: "8h" });
  ok(res, { token, user: { id: usuario.id, nombre: usuario.nombre, email: usuario.email } });
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.userId },
    select: { id: true, nombre: true, email: true },
  });
  if (!usuario) { error(res, "Usuario no encontrado", 404); return; }
  ok(res, usuario);
});

export default router;
