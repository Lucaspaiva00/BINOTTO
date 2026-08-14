import { api } from "./api/client";
import type { PaginatedResponse } from "@/types/api";
import type {
  AppUser,
  CreateUserPayload,
  ListUsersParams,
  OficinaDocument,
  SupportTicket,
  SupportMessage,
  UpdateUserPayload,
  UserSelectionItem,
  UserType,
} from "@/types/user";

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

  async create(payload: CreateUserPayload): Promise<AppUser> {
    const { data } = await api.post<{ message: string; data: AppUser }>(BASE_URL, payload);
    return data.data;
  },

  async update(id: number | string, payload: UpdateUserPayload): Promise<AppUser> {
    const { data } = await api.put<{ message: string; data: AppUser }>(`${BASE_URL}/${id}`, payload);
    return data.data;
  },

  async toggleStatus(
    id: number | string,
    senha?: string,
  ): Promise<{ message: string; data: AppUser }> {
    const { data } = await api.patch<{ message: string; data: AppUser }>(
      `${BASE_URL}/${id}/status`,
      senha ? { senha } : undefined,
    );
    return data;
  },

  async updatePassword(
    id: number | string,
    payload: { senha: string; confirmar_senha: string },
  ): Promise<{ message: string }> {
    const { data } = await api.put<{ message: string }>(`${BASE_URL}/${id}/senha`, payload);
    return data;
  },

  async delete(id: number | string, senha: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`${BASE_URL}/${id}`, {
      data: { senha },
    });
    return data;
  },

  async listDocuments(id: number | string): Promise<OficinaDocument[]> {
    const { data } = await api.get<{ documents: OficinaDocument[] }>(`${BASE_URL}/${id}/documentos`);
    return data.documents;
  },

  async uploadDocument(
    id: number | string,
    file: File,
    tipo = "doc_empresa",
  ): Promise<OficinaDocument> {
    const formData = new FormData();
    formData.append("documento", file);
    formData.append("tipo", tipo);

    const { data } = await api.post<{ message: string; document: OficinaDocument }>(
      `${BASE_URL}/${id}/documentos`,
      formData,
      { headers: { "Content-Type": undefined } },
    );
    return data.document;
  },

  async deleteDocument(id: number | string, documentId: number): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`${BASE_URL}/${id}/documentos/${documentId}`);
    return data;
  },

  async listSupportTickets(id: number | string): Promise<SupportTicket[]> {
    const { data } = await api.get<{ data: SupportTicket[] }>(`${BASE_URL}/${id}/suporte`);
    return data.data;
  },

  async createSupportTicket(
    id: number | string,
    payload: { assunto: string; mensagem: string },
  ): Promise<SupportTicket> {
    const { data } = await api.post<{ message: string; data: SupportTicket }>(
      `${BASE_URL}/${id}/suporte`,
      payload,
    );
    return data.data;
  },

  async replySupportTicket(
    id: number | string,
    ticketId: number,
    mensagem: string,
  ): Promise<SupportMessage> {
    const { data } = await api.post<{ message: string; data: SupportMessage }>(
      `${BASE_URL}/${id}/suporte/${ticketId}/respostas`,
      { mensagem },
    );
    return data.data;
  },

  async closeSupportTicket(id: number | string, ticketId: number): Promise<SupportTicket> {
    const { data } = await api.patch<{ message: string; data: SupportTicket }>(
      `${BASE_URL}/${id}/suporte/${ticketId}/fechar`,
    );
    return data.data;
  },
};
