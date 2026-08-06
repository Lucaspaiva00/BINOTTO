import { DocumentType } from "@/types/documents";
import { api } from "./Api";
import SecureStorageService from "./SecureStorageService";

const TechnicianDocumentsService = {
  async getDocuments() {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get("/tecnico/documentos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getDocumentById(id: number) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.get(`/tecnico/documentos/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async uploadDocument(file: any, type: DocumentType) {
    try {
      const token = await SecureStorageService.getToken();

      const formData = new FormData();

      formData.append("tipo", type);

      formData.append("documento", {
        uri: file.uri,
        name: file.name ?? file.fileName ?? `document_${Date.now()}.jpg`,
        type: file.mimeType ?? file.type ?? "image/jpeg",
      } as any);

      const response = await api.post(
        "/tecnico/documentos/store",
        formData,
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

  async deleteDocument(id: number | string) {
    try {
      const token = await SecureStorageService.getToken();

      const response = await api.delete(
        `/tecnico/documentos/${id}`,
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

export default TechnicianDocumentsService;