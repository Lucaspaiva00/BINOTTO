import { api } from "./Api";
import SecureStorageService from "./SecureStorageService";

const WorkshopManagementService = {
  // Show Item
  async getServiceById(id: number) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get(`/oficina/servicos/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // CREATE
  async createWorkshopService(payload: any) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.post(
        "/oficina/servicos",
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

  // UPDATE
  async updateWorkshopService(id: number, payload: any) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.post(
        `/oficina/servicos/${id}`,
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

  // CONFIRM
  async confirmWorkshopService(id: number, payload: any) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.patch(
        `/oficina/servicos/${id}/confirmar`,
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

  // REJECT
  async rejectWorkshopService(id: number) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.patch(
        `/oficina/servicos/${id}/rejeitar`,
        {},
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

  // CANCEL
  async cancelWorkshopService(id: number) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.patch(
        `/oficina/servicos/${id}/cancelar`,
        {},
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

  // LIST ALL (INDEX)
  async getWorkshopServices(page: number = 1, date?: string) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get("/oficina/servicos", {
        params: {
          page,
          date: date || undefined,
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

  // PENDENTES
  async getPendingServices(page = 1) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get(
        `/oficina/servicos/pendentes?page=${page}`,
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

  async getWorkshopInspections(
    page: number = 1,
    status: string | null = null,
    params: {
      data_inicial?: string | null;
      data_final?: string | null;
      oficina_placa?: string;
    } = {}
  ) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get("/oficina/pericias", {
        params: {
          page,
          status: status || undefined,
          data_inicial: params.data_inicial || undefined,
          data_final: params.data_final || undefined,
          oficina_placa: params.oficina_placa || undefined,
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
  // HISTÓRICO
  async getServiceHistory(page: number = 1, params: any = {}) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get(
        `/oficina/servicos/historico?page=${page}`,
        {
          params,
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

  // AGENDA CALENDAR
  async getAgendaCalendar(month: number, year: number) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get(
        `/oficina/servicos/agenda?month=${month}&year=${year}`,
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

  async getInspectionServiceById(id: number) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get(`/oficina/pericias/${id}`, {
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
        "/oficina/pericias",
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
        "/oficina/pericias/simples",
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
      const response = await api.post(`/oficina/pericias/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default WorkshopManagementService;