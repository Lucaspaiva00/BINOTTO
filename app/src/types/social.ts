import { User } from "./auth";

export type SocialRegisterResponse = {
  status?: string;
  message?: string;
  user: UserRegisterResponse
};

export type UserRegisterResponse = {
  id: number;
  email: string | null;
  perfil: 'TECNICO' | 'OFICINA';
  tecnico: {
    nome_completo: string;
  } | null;
  oficina: {
    nome_fantasia: string;
    nome_responsavel: string;
  } | null;
};

export type SocialLoginRequest = {
  tipo: string,
  id: string,
  idioma: string,
  push_token: string | null,
  plataforma: string | null,
  idToken?: string | null
}

export type PreRegistrationSocialResponse = {
  status: "PRE_REGISTRATION_SOCIAL";
  user: {
    id: number;
    email: string | null;
    perfil: "TECNICO" | "OFICINA";

    tecnico: {
      nome_completo: string;
    } | null;

    oficina: {
      nome_fantasia: string;
      nome_responsavel: string;
    } | null;
  };
};

export type AuthenticatedResponse = {
  status: "AUTHENTICATED";
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: User
};

export type SocialLoginResponse =
  | AuthenticatedResponse
  | PreRegistrationSocialResponse;