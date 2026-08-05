import { api } from "./Api";
import SecureStorageService from "./SecureStorageService";

const BASE_URL = "/oficina/tecnicos-bloqueados";

const WorkshopBlockedTechService = {
  // Lista os tecnicos bloqueados
  async getBlockedTechnicians() {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get(BASE_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // adiciona tecnico ja cadastrado aos bloqueados
  async addBlockedTechnician(whatsapp: string) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.post(
        `${BASE_URL}/adicionar`,
        {
          whatsapp: whatsapp,
        },
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

  // remove da lista de bloqueados
  async removeBlockedTechnician(id: string) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.delete(`${BASE_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verifica a existencia do tecnico selecionado
  async checkTechnician(whatsapp: string) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.post(
        `${BASE_URL}/verificar`,
        {
          whatsapp,
        },
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
};

export default WorkshopBlockedTechService;
