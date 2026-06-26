import { Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "./auth";

export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.userId },
      select: { rol: true },
    });

    if (!usuario) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    if (usuario.rol !== "ADMIN") {
      res.status(403).json({ message: "No tienes permisos de administrador" });
      return;
    }

    next();
  } catch {
    res.status(500).json({ message: "Error al validar permisos" });
  }
}
