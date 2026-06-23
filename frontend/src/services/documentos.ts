import api from "./api";
import type { Documento } from "../types";

export const documentosService = {
  getByMiembro: async (miembroId: string): Promise<Documento[]> => {
    const { data } = await api.get<Documento[]>(`/api/miembros/${miembroId}/documentos`);
    return data;
  },

  upload: async (miembroId: string, archivo: File, nombre: string, tipoDoc: string): Promise<Documento> => {
    const form = new FormData();
    form.append("archivo", archivo);
    form.append("nombre", nombre);
    form.append("tipoDoc", tipoDoc);
    const { data } = await api.post<Documento>(`/api/miembros/${miembroId}/documentos`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  delete: async (miembroId: string, documentoId: string): Promise<void> => {
    await api.delete(`/api/miembros/${miembroId}/documentos/${documentoId}`);
  },
};
