export type UserStatus = "ativo" | "desativado";
export type PaymentTerms = "semanal" | "quinzenal" | "mensal" | "personalizado";

export type UserType = "TECNICO" | "OFICINA";

export interface AppUser {
  id: number;
  profile: UserType;
  name: string | null;
  nickname: string | null;
  responsible: string | null;
  document: string | null;
  email: string;
  phoneCountryCode: string | null;
  phoneCountryIso: string | null;
  phoneNumber: string | null;
  secondaryPhoneCountryCode?: string | null;
  secondaryPhoneCountryIso?: string | null;
  secondaryPhoneNumber?: string | null;
  secondaryEmail?: string | null;
  tradeName?: string | null;
  companyName?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  city: string | null;
  state?: string | null;
  zip?: string | null;
  country: string | null;
  paymentTerm: string | null;
  profileCompletionPercent?: number | null;
  status: UserStatus;
  createdAt: string;
}

export interface ListUsersParams {
  perfil?: UserType;
  status?: UserStatus;
  pais?: string;
  cidade?: string;
  busca?: string;
  page?: number;
  per_page?: number;
}

export interface UserSelectionItem {
  id: number;
  userId: number;
  name: string;
}

export interface UpdateUserPayload {
  nome_completo?: string | null;
  apelido?: string | null;
  nome_fantasia?: string | null;
  nome_responsavel?: string | null;
  razao_social?: string | null;
  documento?: string | null;
  email: string;
  email_secundario?: string | null;
  codigo_pais_telefone: string;
  numero_telefone: string;
  iso_pais_telefone?: string | null;
  telefone_secundario?: string | null;
  codigo_pais_telefone_secundario?: string | null;
  iso_pais_telefone_secundario?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  cidade: string;
  estado?: string | null;
  cep?: string | null;
  pais: string;
  status: boolean;
  prazo_pagamento?: string | null;
}

export interface OficinaDocument {
  id: number;
  oficina_id?: number;
  tecnico_id?: number;
  nome: string;
  arquivo: string;
  url: string;
  mime_type: string | null;
  tamanho: number | null;
  tipo: string;
  arquivo_url?: string | null;
  tamanho_formatado?: string | null;
  created_at?: string;
}

export type SupportTicketStatus = "aberto" | "fechado";

export interface SupportMessage {
  id: number;
  ticketId: number;
  authorType: "admin" | "usuario";
  authorId: number | null;
  body: string;
  createdAt: string;
}

export interface SupportTicket {
  id: number;
  userId: number;
  subject: string;
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  messages?: SupportMessage[];
}
