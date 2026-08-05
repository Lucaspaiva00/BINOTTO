import { api } from "./Api";
import SecureStorageService from "./SecureStorageService";

const TechnicianProfileService = {
  async getProfile() {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get("/tecnico/perfil", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  async getProfileById(id: number) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get(`/tecnico/perfil/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateProfile(payload: any) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.put(
        "/tecnico/perfil/update",
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
};

export default TechnicianProfileService;