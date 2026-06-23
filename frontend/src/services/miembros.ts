import api from "./api";
import type { Miembro, MiembroFormData, PaginatedResponse } from "../types";

export const miembrosService = {
  getAll: async (page = 1, limit = 10, search = "") => {
    const { data } = await api.get<PaginatedResponse<Miembro>>("/api/miembros", {
      params: { page, limit, search },
    });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<Miembro>(`/api/miembros/${id}`);
    return data;
  },

  create: async (formData: MiembroFormData, fotoFile?: File | null) => {
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== "foto") {
        form.append(key, String(value));
      }
    });
    if (fotoFile) form.append("foto", fotoFile);
    const { data } = await api.post<Miembro>("/api/miembros", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  update: async (id: string, formData: Partial<MiembroFormData>, fotoFile?: File | null) => {
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== "foto") {
        form.append(key, String(value));
      }
    });
    if (fotoFile) form.append("foto", fotoFile);
    const { data } = await api.put<Miembro>(`/api/miembros/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  delete: async (id: string) => {
    await api.delete(`/api/miembros/${id}`);
  },
};
