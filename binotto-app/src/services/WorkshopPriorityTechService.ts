import { api } from "./Api";
import SecureStorageService from "./SecureStorageService";

const BASE_URL = "/oficina/tecnicos-preferidos";

const WorkshopPriorityTechService = {
  // Lista os tecnicos preferidos
  async getPriorityTechnicians() {
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

  // adiciona tecnico ja cadastrado aos preferidos
  async addPriorityTechnician(whatsapp: string) {
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

  // remove da lista
  async removePriorityTechnician(id: string) {
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

  // Pre-cadastro
  async preRegisterTechnician(payload: any) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.post(
        `${BASE_URL}/pre-registro`,
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
  },

  // Verifica a existencia do tecnico selecionado
  async checkTechnician(whatsapp: string) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.post(
        "/oficina/tecnicos-preferidos/verificar",
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
  }
};

export default WorkshopPriorityTechService;
