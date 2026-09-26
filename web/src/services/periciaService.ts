import { api } from "./api/client";

export type VehiclePhotoField = "placa" | "chassi" | "marca" | "modelo";
export type PriceVisibility = { carro: boolean; desmontagem: boolean; total: boolean; sugerido: boolean };
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
  async getSettings(): Promise<{coeficiente_eur: number}> {
    const { data } = await api.get<{data: {coeficiente_eur: number}}>("/configuracoes/pericias");
    return data.data;
  },
  async saveSettings(coeficiente: number): Promise<{coeficiente_eur: number}> {
    const { data } = await api.put<{data: {coeficiente_eur: number}}>("/configuracoes/pericias", {coeficiente_eur: coeficiente});
    return data.data;
  },
  async recognizePhoto(campo: VehiclePhotoField, imagem: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("campo", campo);
    formData.append("imagem", imagem);
    const { data } = await api.post<{data: {valor: string | null}}>("/pericias/reconhecer", formData, {headers: {"Content-Type": undefined}});
    return data.data?.valor ?? null;
  },
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

  async update(id: number | string, payload: { senha: string; oficina_id: number; tecnico_id?: number | null; placa: string; chassi: string; marca_modelo: string; marca?: string; modelo?: string; perito_nome?: string; valor_pericia?: number | null; valor_desmontagem?: number | null; valor_sugerido_tecnico?: number | null; visibilidade_valores?: PriceVisibility }): Promise<Pericia> {
    const { data } = await api.put<{ data: Pericia }>(`${BASE_URL}/${id}`, payload);
    return data.data;
  },

  async startRepairs(id: number | string): Promise<Pericia> {
    const { data } = await api.patch<{ data: Pericia }>(`${BASE_URL}/${id}/iniciar-reparacoes`);
    return data.data;
  },

  async create(formData: FormData): Promise<Pericia> {
    const { data } = await api.post<{ data: Pericia }>(BASE_URL, formData, {
      headers: { "Content-Type": undefined },
    });
    return data.data;
  },
};
