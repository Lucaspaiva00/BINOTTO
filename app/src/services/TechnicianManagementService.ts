import { api } from "./Api";
import SecureStorageService from "./SecureStorageService";

const TechnicianManagementService = {
  async getServiceById(id: number) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get(`/tecnico/servicos/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // LISTA TODOS OS SERVIÇOS DO TÉCNICO E DISPONIVEIS
  async getTechnicianServices(
    page: number = 1,
    date?: string | null,
    status: string[] = [],
    hideRejected?: boolean
  ) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get("/tecnico/servicos", {
        params: {
          page,
          date: date || undefined,
          status: status.length ? status : undefined,
          hide_rejected: hideRejected ? 1 : undefined,
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


  // SERVIÇOS CONCLUÍDOS
  async getCompletedServices(page: number = 1, params: any = {}) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get(
        `/tecnico/servicos/concluidos?page=${page}`,
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
        `/tecnico/servicos/agenda?month=${month}&year=${year}`,
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

  //  ACEITAR SERVIÇO
  async acceptService(id: number, data_prevista_chegada: string, horario_previsto_chegada: string) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.patch(
        `/tecnico/servicos/${id}/aceitar`,
        {
          data_prevista_chegada,
          horario_previsto_chegada
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

  // RECUSAR SERVIÇO
  async refuseService(id: number) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.patch(
        `/tecnico/servicos/${id}/recusar`,
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

  // CANCELAR ACEITE DE SERVIÇO
  async cancelAcceptService(id: number, motivo?: string) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.patch(
        `/tecnico/servicos/${id}/cancelar-aceitacao`,
        motivo ? { motivo } : {},
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

  // INICIA CARRO COM PERÍCIA SIMPLES
  async startCar(payload: any) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.post(
        "/tecnico/servicos/iniciar",
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

  // INICIA CARRO VIA PERÍCIA COMPLETA
  async startServiceFromInspection(inspectionId: number, data?: Record<string, any>) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.post(
        `/tecnico/servicos/${inspectionId}/iniciar-via-pericia`,
        data ?? {},
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

  // SALVAR EXECUÇÃO
  async saveExecution(id: number, payload: any, finalizar: boolean) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.post(
        `/tecnico/servicos/${id}/salvar-execucao`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          params: {
            finalizar: finalizar ? 1 : 0,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async finishExecution(id: number) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.post(
        `/tecnico/servicos/${id}/finaliza-execucao`,
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

  // RESGATAR SERVIÇOS DO MESMO DIA
  async getSimultaneousServices(oficinaId: number) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get(`/tecnico/servicos/${oficinaId}/simultaneos`, {
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

export default TechnicianManagementService;