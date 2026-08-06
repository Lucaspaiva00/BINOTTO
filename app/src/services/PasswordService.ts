import { api, baseUrl } from "./Api";
import SecureStorageService from "./SecureStorageService";

const PasswordService = {
    // Trocar senha estando logado
    async changePassword(payload: {
        senha_atual: string;
        nova_senha: string;
        nova_senha_confirmacao: string;
    }): Promise<any> {
        try {
            const token = await SecureStorageService.getToken();

            const response = await api.post(
                `${baseUrl}/password/trocar-senha`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Recuperação - Enviar Código
    async sendRecoveryCode(login: string): Promise<any> {
        try {
            console.log("Enviando código de recuperação para:", login);
            const response = await api.post(`${baseUrl}/auth/password/recuperacao`, {
                login:login
            });

            console.log("Resposta do envio de código de recuperação:", response.data);
            return response.data;
        } catch (error: any) {

        let errorMessage = "";
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
    
        throw new Error(errorMessage);
    }
    },

    // Recuperação - Validar Código
    async confirmRecoveryCode(codigo: string): Promise<any> {
        try {

            const response = await api.post(`${baseUrl}/auth/password/confirmar-codigo`, {
                codigo
            });

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Recuperação - Resetar Senha
    async resetPassword(
        usuario_id: number,
        senha: string,
        senha_confirmacao: string
    ): Promise<any> {
        try {
            const response = await api.post(`${baseUrl}/auth/password/resetar`, {
                usuario_id,
                senha,
                senha_confirmacao
            });

            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default PasswordService;
