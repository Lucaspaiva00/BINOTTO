import { api } from "./Api";
import SecureStorageService from "./SecureStorageService";

const WorkshopService = {
  async getWorkshops() {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get("/tecnico/oficinas", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default WorkshopService;