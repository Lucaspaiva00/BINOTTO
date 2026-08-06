import { api } from "./api/client";
import type { PaginatedResponse } from "@/types/api";
import type { Service, ServiceStatus } from "@/types/service";

const BASE_URL = "/servicos";

export interface ListServicesParams {
  page?: number;
  per_page?: number;
  status?: ServiceStatus;
  pais?: string;
  busca?: string;
}

export const serviceService = {
  async list(params?: ListServicesParams): Promise<PaginatedResponse<Service>> {
    const { data } = await api.get<PaginatedResponse<Service>>(BASE_URL, { params });
    return data;
  },

  async show(id: number | string): Promise<Service> {
    const { data } = await api.get<{ data: Service }>(`${BASE_URL}/${id}`);
    return data.data;
  },
};
