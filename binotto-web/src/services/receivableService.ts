import { api } from "./api/client";
import type { PaginatedResponse } from "@/types/api";
import type { FinanceOrigin, FinanceStatus, Receivable, ReceivablePayload } from "@/types/finance";

const BASE_URL = "/contas-receber";

export interface ListReceivablesParams {
  data_de?: string;
  data_ate?: string;
  status?: FinanceStatus;
  origem?: FinanceOrigin;
  busca?: string;
  oficina_id?: number;
  page?: number;
  per_page?: number;
}

export const receivableService = {
  async list(params?: ListReceivablesParams): Promise<PaginatedResponse<Receivable>> {
    const { data } = await api.get<PaginatedResponse<Receivable>>(BASE_URL, { params });
    return data;
  },

  async show(id: number | string): Promise<Receivable> {
    const { data } = await api.get<{ data: Receivable }>(`${BASE_URL}/${id}`);
    return data.data;
  },

  async create(payload: ReceivablePayload): Promise<Receivable> {
    const { data } = await api.post<{ message: string; data: Receivable }>(BASE_URL, payload);
    return data.data;
  },

  async update(id: number | string, payload: ReceivablePayload): Promise<Receivable> {
    const { data } = await api.put<{ message: string; data: Receivable }>(`${BASE_URL}/${id}`, payload);
    return data.data;
  },

  async remove(id: number | string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`${BASE_URL}/${id}`);
    return data;
  },
};
