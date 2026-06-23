import api from "./api";
import type { AuthUser, LoginCredentials } from "../types";

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await api.post<{ token: string; user: AuthUser }>(
      "/api/auth/login",
      credentials
    );
    localStorage.setItem("token", data.token);
    return data.user;
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  me: async () => {
    const { data } = await api.get<AuthUser>("/api/auth/me");
    return data;
  },
};
