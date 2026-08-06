import { api } from "./api/client";
import type { Payable, Receivable } from "@/types/finance";

const BASE_URL = "/fluxo-caixa";

export interface CashFlowParams {
  data_de?: string;
  data_ate?: string;
}

export interface CashFlowResponse {
  contasReceber: Receivable[];
  contasPagar: Payable[];
}

export const cashFlowService = {
  async get(params?: CashFlowParams): Promise<CashFlowResponse> {
    const { data } = await api.get<{ data: CashFlowResponse }>(BASE_URL, { params });
    return data.data;
  },
};
