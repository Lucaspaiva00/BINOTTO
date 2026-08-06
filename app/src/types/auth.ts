export type AccountType = "TECHNICIAN" | "WORKSHOP";

export type RecoverMethod = "EMAIL" | "WHATSAPP";

export type User = {
  id: number;
  name: string;
  email: string;
  whatsapp?: string;
  countryCode?: string;
  countryIso?: string;
  phoneNumber?: string;
  profile: string;
  profileId: number;
  active: boolean;
  canRequestTechnician: boolean;
};

export type AuthResponse =
  | {
      status: "AUTHENTICATED";
      access_token: string;
      token_type: "bearer";
      expires_in: number;
      user: User;
    }
  | {
      status: "PRE_REGISTRATION";
      user: {
        id: number;
        whatsapp: string;
        workshopName: string;
      };
    };