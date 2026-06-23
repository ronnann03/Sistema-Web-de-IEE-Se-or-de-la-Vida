import api from "./api";
import type { Horario, ReporteMiembro } from "../types";

export const horariosService = {
  getAll: async (): Promise<Horario[]> => {
    const { data } = await api.get<Horario[]>("/api/horarios");
    return data;
  },

  getById: async (id: string): Promise<Horario> => {
    const { data } = await api.get<Horario>(`/api/horarios/${id}`);
    return data;
  },

  create: async (payload: { nombre: string; descripcion?: string; diasSemana: number[]; hora: string }): Promise<Horario> => {
    const { data } = await api.post<Horario>("/api/horarios", payload);
    return data;
  },

  update: async (id: string, payload: { nombre: string; descripcion?: string; diasSemana: number[]; hora: string }): Promise<Horario> => {
    const { data } = await api.put<Horario>(`/api/horarios/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/horarios/${id}`);
  },

  addMiembro: async (horarioId: string, miembroId: string): Promise<void> => {
    await api.post(`/api/horarios/${horarioId}/miembros`, { miembroId });
  },

  removeMiembro: async (horarioId: string, miembroId: string): Promise<void> => {
    await api.delete(`/api/horarios/${horarioId}/miembros/${miembroId}`);
  },

  pasarSesion: async (
    horarioId: string,
    payload: { fecha: string; descripcion?: string; registros: { miembroId: string; tipo: string; observacion?: string }[] }
  ) => {
    const { data } = await api.post(`/api/horarios/${horarioId}/sesion`, payload);
    return data;
  },

  getReporte: async (params: { desde: string; hasta: string; horarioId?: string; area?: string }) => {
    const { data } = await api.get<{ desde: string; hasta: string; miembros: ReporteMiembro[]; areas: string[] }>(
      "/api/horarios/reporte/asistencias",
      { params }
    );
    return data;
  },
};
