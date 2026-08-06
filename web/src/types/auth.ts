export type UserProfile = "ADMIN";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  profile: UserProfile;
  active: boolean;
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface LoginResponse {
  status: "AUTHENTICATED";
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}
