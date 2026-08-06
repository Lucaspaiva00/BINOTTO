import { api } from "./Api";
import SecureStorageService from "./SecureStorageService";

const TechnicianInspectionService = {
    // Resgata dados da pericia
    async getInspectionById(id: number) {
        try {
            const token = await SecureStorageService.getToken();

            const response = await api.get(`/tecnico/pericias/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getInspectionsByPlate(placa: string) {
        try {
            const token = await SecureStorageService.getToken();

            const response = await api.get(
                `/tecnico/pericias/placa/${placa}`,
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

    // Lista todas as pericias
    async getTechnicianInspection(
        page: number = 1,
        status?: "aberta" | "em_execucao" | "concluida" | "custom" | null,
        filters?: {
            oficina_placa?: string;
            data_inicial?: string | null;
            data_final?: string | null;
        },
    ) {
    try {
        const token = await SecureStorageService.getToken();

        const response = await api.get("/tecnico/pericias", {
            params: {
                page,
                status: status || undefined,
                oficina_placa: filters?.oficina_placa,
                data_inicial: filters?.data_inicial,
                data_final: filters?.data_final,
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    } catch (error) {
        throw error;
    }
},

    // Cria Perícia Completa
    async createCompleteInspection(payload: any) {
        try {
            const token = await SecureStorageService.getToken();

            const response = await api.post(
            "/tecnico/pericias",
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            }
            );

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Cria Perícia Simples
    async createBasicInspection(payload: any) {
        try {
            const token = await SecureStorageService.getToken();

            const response = await api.post(
            "/tecnico/pericias/simples",
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            }
            );

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateInspection(id: number, payload: any) {
        try {
            const token = await SecureStorageService.getToken();

            const response = await api.post(
            `/tecnico/pericias/${id}`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            }
            );

            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Baixa/Gera PDF da perícia
    async getInspectionPdf(id: number) {
        try {
            const token = await SecureStorageService.getToken();

            const response = await api.get(
                `/tecnico/pericias/${id}/pdf`,
                {
                    responseType: "arraybuffer",
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
};

export default TechnicianInspectionService;