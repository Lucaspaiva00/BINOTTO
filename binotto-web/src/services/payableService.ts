import { api } from "./api/client";
import type { PaginatedResponse } from "@/types/api";
import type { FinanceOrigin, FinanceStatus, Payable, PayablePayload } from "@/types/finance";

const BASE_URL = "/contas-pagar";

export interface ListPayablesParams {
  data_de?: string;
  data_ate?: string;
  status?: FinanceStatus;
  origem?: FinanceOrigin;
  busca?: string;
  tecnico_id?: number;
  oficina_id?: number;
  page?: number;
  per_page?: number;
}

export const payableService = {
  async list(params?: ListPayablesParams): Promise<PaginatedResponse<Payable>> {
    const { data } = await api.get<PaginatedResponse<Payable>>(BASE_URL, { params });
    return data;
  },

  async show(id: number | string): Promise<Payable> {
    const { data } = await api.get<{ data: Payable }>(`${BASE_URL}/${id}`);
    return data.data;
  },

  async create(payload: PayablePayload): Promise<Payable> {
    const { data } = await api.post<{ message: string; data: Payable }>(BASE_URL, payload);
    return data.data;
  },

  async update(id: number | string, payload: PayablePayload): Promise<Payable> {
    const { data } = await api.put<{ message: string; data: Payable }>(`${BASE_URL}/${id}`, payload);
    return data.data;
  },

  async remove(id: number | string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`${BASE_URL}/${id}`);
    return data;
  },
};
