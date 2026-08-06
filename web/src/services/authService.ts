import { api } from "./api/client";
import type { LoginCredentials, LoginResponse } from "@/types/auth";

const BASE_URL = "/auth";

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>(`${BASE_URL}/login`, credentials);
    return data;
  },
};
