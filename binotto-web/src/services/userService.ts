import { api } from "./api/client";
import type { PaginatedResponse } from "@/types/api";
import type { AppUser, ListUsersParams, UpdateUserPayload, UserSelectionItem, UserType } from "@/types/user";

const BASE_URL = "/usuarios";

export const userService = {
  async list(params?: ListUsersParams): Promise<PaginatedResponse<AppUser>> {
    const { data } = await api.get<PaginatedResponse<AppUser>>(BASE_URL, { params });
    return data;
  },

  async listForSelection(tipo: UserType): Promise<UserSelectionItem[]> {
    const { data } = await api.get<{ data: UserSelectionItem[] }>(`${BASE_URL}/selecao`, { params: { tipo } });
    return data.data;
  },

  async show(id: number | string): Promise<AppUser> {
    const { data } = await api.get<{ data: AppUser }>(`${BASE_URL}/${id}`);
    return data.data;
  },

  async update(id: number | string, payload: UpdateUserPayload): Promise<AppUser> {
    const { data } = await api.put<{ message: string; data: AppUser }>(`${BASE_URL}/${id}`, payload);
    return data.data;
  },

  async toggleStatus(id: number | string): Promise<{ message: string; data: AppUser }> {
    const { data } = await api.patch<{ message: string; data: AppUser }>(`${BASE_URL}/${id}/status`);
    return data;
  },
};
