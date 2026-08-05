import { api, baseUrl } from "./Api";
import SecureStorageService from "./SecureStorageService";

const EmailService = {
    async sendEmailSupport(payload: { subject: string, message: string }) {
        try {
            const token = await SecureStorageService.getToken();

            const response = await api.post("/suporte/email",
                payload,
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
    }
};

export default EmailService;
