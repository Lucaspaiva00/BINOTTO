import { AuthResponse } from "@/types/auth";
import { api, baseUrl } from "./Api";
import SecureStorageService from "./SecureStorageService";
import { SocialLoginResponse } from "@/types/social";


const AuthService = {
    // Login
    async signIn(login: string, senha: string, idioma: string, pushToken: string | null, platform: string): Promise<AuthResponse> {
        try {
            const response = await api.post(`${baseUrl}/auth/login`, {
                login,
                senha,
                idioma,
                push_token: pushToken,
                plataforma: platform,
            });

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async signInSocial(payload: any): Promise<SocialLoginResponse> {
        try {

            const response = await api.post(`${baseUrl}/auth/login/social`, payload);
            return response.data;
        } catch (error) {
            console.log(error);
            throw error;
        }
    },

    async completeRegistrationAndLogin(data: {
        usuario_id: number;
        nome: string;
        apelido: string | null;
        email: string;
        senha: string;
        senha_confirmacao: string;
        codigo_pais_telefone: string | null,
        numero_telefone: string | null,
        codigo_pais_telefone_secundario: string | null,
        telefone_secundario: string | null,
    }): Promise<AuthResponse> {
        try {
            const response = await api.post(`${baseUrl}/auth/register/finalizar`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async completeRegistrationSocialAndLogin(payload: any): Promise<AuthResponse> {
        try {
            const response = await api.post(
                `${baseUrl}/auth/register/finalizar-social`,
                payload
            );

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Dados do usuário logado
    async me(): Promise<any> {
        try {
            const token = await SecureStorageService.getToken();

            const response = await api.get(`${baseUrl}/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Logout
    async logout(): Promise<any> {
        try {
            const token = await SecureStorageService.getToken();

            const response = await api.post(`${baseUrl}/logout`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            await SecureStorageService.clear();

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Muda idioma
    async changeLanguage(idioma: string): Promise<any> {
        try {
            const token = await SecureStorageService.getToken();

            const response = await api.put(
                `${baseUrl}/mudar-idioma`,
                { idioma },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Excluir conta
    async deleteAccount(): Promise<any> {
        try {
            const token = await SecureStorageService.getToken();

            const response = await api.delete(`${baseUrl}/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default AuthService;

