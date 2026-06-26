import api from "./api";

export const consultasService = {
  consultarDNI: async (numero: string) => {
    const { data } = await api.get(`/api/consultas/dni/${numero}`);
    return data;
  },
  consultarRUC: async (numero: string) => {
    const { data } = await api.get(`/api/consultas/ruc/${numero}`);
    return data;
  }
};
