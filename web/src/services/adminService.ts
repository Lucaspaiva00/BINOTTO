import { api } from "./api/client";
import type { PaginatedResponse } from "@/types/api";
import type {
  Administrator,
  CreateAdministratorPayload,
  UpdateAdministratorPayload,
} from "@/types/admin";

const BASE_URL = "/administradores";

export interface ListAdministratorsParams {
  page?: number;
  per_page?: number;
}

export const adminService = {
  async list(params?: ListAdministratorsParams): Promise<PaginatedResponse<Administrator>> {
    const { data } = await api.get<PaginatedResponse<Administrator>>(BASE_URL, { params });
    return data;
  },

  async show(id: number | string): Promise<Administrator> {
    const { data } = await api.get<{ data: Administrator }>(`${BASE_URL}/${id}`);
    return data.data;
  },

  async create(payload: CreateAdministratorPayload): Promise<Administrator> {
    const { data } = await api.post<{ message: string; data: Administrator }>(BASE_URL, payload);
    return data.data;
  },

  async update(id: number | string, payload: UpdateAdministratorPayload): Promise<Administrator> {
    const { data } = await api.put<{ message: string; data: Administrator }>(`${BASE_URL}/${id}`, payload);
    return data.data;
  },
};
