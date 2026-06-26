import { Router } from "express";
import { ok, error } from "../lib/response";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Protegemos la ruta para que solo usuarios autenticados puedan hacer consultas
router.use(authMiddleware);

router.get("/dni/:numero", async (req, res) => {
  try {
    const { numero } = req.params;
    if (!numero || numero.length !== 8) {
      error(res, "DNI inválido", 400);
      return;
    }

    const token = process.env.API_CONSULTAS_TOKEN;
    const baseUrl = process.env.API_CONSULTAS_BASE_URL;

    const response = await fetch(`${baseUrl}/api/v1/dni/${numero}?token=${token}`);
    if (!response.ok) {
      error(res, "Error en la API externa", response.status);
      return;
    }

    const data = await response.json();
    ok(res, data);
  } catch (err) {
    error(res, "Error al consultar DNI", 500);
  }
});

router.get("/ruc/:numero", async (req, res) => {
  try {
    const { numero } = req.params;
    if (!numero || numero.length !== 11) {
      error(res, "RUC inválido", 400);
      return;
    }

    const token = process.env.API_CONSULTAS_TOKEN;
    const baseUrl = process.env.API_CONSULTAS_BASE_URL;

    const response = await fetch(`${baseUrl}/api/v1/ruc/${numero}?token=${token}`);
    if (!response.ok) {
      error(res, "Error en la API externa", response.status);
      return;
    }

    const data = await response.json();
    ok(res, data);
  } catch (err) {
    error(res, "Error al consultar RUC", 500);
  }
});

export default router;
