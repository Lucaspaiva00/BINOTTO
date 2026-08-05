import { api } from "./Api";
import SecureStorageService from "./SecureStorageService";

const WorkshopProfileService = {
  async getProfile() {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get("/oficina/perfil", {
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

      const response = await api.get(`/oficina/perfil/${id}`, {
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
        "/oficina/perfil/update",
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

export default WorkshopProfileService;