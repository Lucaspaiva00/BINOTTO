export type AdministratorStatus = "ativo" | "desativado";

export interface Administrator {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  status: AdministratorStatus;
}

export interface CreateAdministratorPayload {
  nome: string;
  email: string;
  senha: string;
  confirmar_senha: string;
}

export interface UpdateAdministratorPayload {
  nome: string;
  email: string;
  senha?: string | null;
  confirmar_senha?: string | null;
  status: boolean;
}
