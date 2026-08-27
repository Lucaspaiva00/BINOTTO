import { api } from "./api/client";
import type { PaginatedResponse } from "@/types/api";
import type { Pericia, PericiaStatus, PericiaTipo } from "@/types/pericia";

const BASE_URL = "/pericias";

export interface ListPericiasParams {
  page?: number;
  per_page?: number;
  status?: PericiaStatus;
  tipo?: PericiaTipo;
  data_inicial?: string;
  data_final?: string;
  busca?: string;
}

export const periciaService = {
  async list(params?: ListPericiasParams): Promise<PaginatedResponse<Pericia>> {
    const { data } = await api.get<PaginatedResponse<Pericia>>(BASE_URL, { params });
    return data;
  },

  async show(id: number | string): Promise<Pericia> {
    const { data } = await api.get<{ data: Pericia }>(`${BASE_URL}/${id}`);
    return data.data;
  },

  async downloadPdf(id: number | string): Promise<{ blob: Blob; filename: string }> {
    const response = await api.get<Blob>(`${BASE_URL}/${id}/pdf`, {
      responseType: "blob",
    });

    const disposition = response.headers["content-disposition"] as string | undefined;
    const match = disposition?.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] ?? `pericia-${id}.pdf`;

    return { blob: response.data, filename };
  },
};
