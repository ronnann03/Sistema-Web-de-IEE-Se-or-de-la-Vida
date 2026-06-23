import { Response } from "express";

export const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json(data);

export const error = (res: Response, message: string, status = 500) =>
  res.status(status).json({ message });
