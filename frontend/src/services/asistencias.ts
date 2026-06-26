import api from "./api";
import type { Asistencia, Miembro, TipoAsistencia } from "../types";

export interface EntradaRegistro extends Asistencia {
  miembro?: Pick<Miembro, "id" | "nombre" | "apellido" | "dni" | "cargo" | "area" | "fotoUrl">;
}

export const asistenciasService = {
  getEntradas: async (fecha?: string): Promise<EntradaRegistro[]> => {
    const { data } = await api.get<EntradaRegistro[]>("/api/asistencias/entrada", {
      params: fecha ? { fecha } : undefined,
    });
    return data;
  },

  marcarEntrada: async (): Promise<EntradaRegistro> => {
    const { data } = await api.post<EntradaRegistro>("/api/asistencias/entrada");
    return data;
  },

  bulk: async (payload: {
    fecha: string;
    descripcion?: string;
    registros: { miembroId: string; tipo: TipoAsistencia; observacion?: string }[];
  }) => {
    const { data } = await api.post("/api/asistencias/bulk", payload);
    return data;
  },

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
