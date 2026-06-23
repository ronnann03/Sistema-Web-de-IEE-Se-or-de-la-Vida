import api from "./api";
import type { Asistencia, TipoAsistencia } from "../types";

export const asistenciasService = {
  getByMiembro: async (miembroId: string): Promise<Asistencia[]> => {
    const { data } = await api.get<Asistencia[]>(`/api/miembros/${miembroId}/asistencias`);
    return data;
  },

  create: async (miembroId: string, payload: { fecha: string; tipo: TipoAsistencia; observacion?: string }): Promise<Asistencia> => {
    const { data } = await api.post<Asistencia>(`/api/miembros/${miembroId}/asistencias`, payload);
    return data;
  },

  delete: async (miembroId: string, asistenciaId: string): Promise<void> => {
    await api.delete(`/api/miembros/${miembroId}/asistencias/${asistenciaId}`);
  },
};
