export type UserStatus = "ativo" | "desativado";
export type PaymentTerms = "semanal" | "quinzenal" | "mensal" | "personalizado";

export type UserType = "TECNICO" | "OFICINA";

export interface AppUser {
  id: number;
  profile: UserType;
  name: string | null;
  document: string | null;
  email: string;
  phoneCountryCode: string | null;
  phoneCountryIso: string | null;
  phoneNumber: string | null;
  secondaryPhoneCountryCode?: string | null;
  secondaryPhoneCountryIso?: string | null;
  secondaryPhoneNumber?: string | null;
  city: string | null;
  country: string | null;
  paymentTerm: string | null;
  status: UserStatus;
  createdAt: string;
}

export interface ListUsersParams {
  perfil?: UserType;
  status?: UserStatus;
  pais?: string;
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
  nome_completo: string;
  documento?: string | null;
  email: string;
  codigo_pais_telefone: string;
  numero_telefone: string;
  iso_pais_telefone?: string | null;
  telefone_secundario?: string | null;
  codigo_pais_telefone_secundario?: string | null;
  iso_pais_telefone_secundario?: string | null;
  cidade: string;
  pais: string;
  status: boolean;
  prazo_pagamento?: string | null;
}
