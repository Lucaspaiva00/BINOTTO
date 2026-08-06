import { SocialRegisterResponse } from "@/types/social";
import { api, baseUrl } from "./Api";

const UserService = {
    async registerTecnico(payload: any): Promise<any> {
        try {
            const response = await api.post(
                `${baseUrl}/auth/register/tecnico`,
                payload
            );

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async registerOficina(payload: any): Promise<any> {
        try {
            const response = await api.post(
                `${baseUrl}/auth/register/oficina`,
                payload
            );

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async registerSocial(payload: any): Promise<SocialRegisterResponse> {
        try {
            const response = await api.post(
                `${baseUrl}/auth/register/social`,
                payload
            );

            return response.data;
        } catch (error) {
            throw error;
        }
    },

};

export default UserService;