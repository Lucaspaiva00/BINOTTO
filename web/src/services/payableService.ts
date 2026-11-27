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
  numero_fatura?: string;
  fatura?: string;
  valor_de?: number;
  valor_ate?: number;
  iva?: number;
  contabilidade?: string;
  cidade?: string;
  pais?: string;
  page?: number;
  per_page?: number;
}

export interface PayableSummary {
  overdue: number;
  next_month: number;
  total_to_pay: number;
}

export type PayablesResponse = PaginatedResponse<Payable> & { summary: PayableSummary };

export const payableService = {
  async list(params?: ListPayablesParams): Promise<PayablesResponse> {
    const { data } = await api.get<PayablesResponse>(BASE_URL, { params });
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

  async remove(id: number | string, deleteService = false): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`${BASE_URL}/${id}`, { params: { excluir_servico: deleteService ? 1 : 0 } });
    return data;
  },
};
