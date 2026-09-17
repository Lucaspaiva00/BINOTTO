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

export interface CreateServiceRequestPayload {
  oficina_id: number;
  data_inicio: string;
  data_fim?: string;
  quantidade_tipo: "carros" | "dias";
  quantidade: number;
  observacoes?: string;
}

export interface AdminServicePayload {
  oficina_id: number;
  tecnico_id?: number | null;
  status: ServiceStatus;
  data_inicio?: string | null;
  data_fim?: string | null;
  placa?: string | null;
  chassi?: string | null;
  marca_modelo?: string | null;
  valor_total?: number | null;
  remuneracao_tipo?: "valor" | "porcentagem" | null;
  remuneracao_tecnico?: number | null;
  observacoes?: string | null;
}

export type UpdateServicePayload = Partial<AdminServicePayload>;

export const serviceService = {
  async list(params?: ListServicesParams): Promise<PaginatedResponse<Service>> {
    const { data } = await api.get<PaginatedResponse<Service>>(BASE_URL, { params });
    return data;
  },

  async show(id: number | string): Promise<Service> {
    const { data } = await api.get<{ data: Service }>(`${BASE_URL}/${id}`);
    return data.data;
  },

  async createRequest(payload: CreateServiceRequestPayload): Promise<Service> {
    const { data } = await api.post<{ data: Service }>(BASE_URL, payload);
    return data.data;
  },

  // Compatibilidade com chamadas já existentes no painel.
  async create(payload: CreateServiceRequestPayload): Promise<Service> {
    return this.createRequest(payload);
  },

  async createDirect(payload: AdminServicePayload): Promise<Service> {
    const { data } = await api.post<{ data: Service }>(`${BASE_URL}/direto`, payload);
    return data.data;
  },

  async update(id: number | string, payload: UpdateServicePayload): Promise<Service> {
    const { data } = await api.put<{ data: Service }>(`${BASE_URL}/${id}`, payload);
    return data.data;
  },
};
