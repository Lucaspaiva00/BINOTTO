import { api } from "./Api";
import SecureStorageService from "./SecureStorageService";
import {
  PricingProfile,
  ServicePricesApiResponse,
  UpdatePricePayload,
  UpdateSuggestionPayload,
} from "@/types/pricing";

const ServicePricingService = {
  async getPrices(
    profile: PricingProfile,
    serviceId: number,
  ): Promise<ServicePricesApiResponse> {
    const token = await SecureStorageService.getToken();
    const role = profile === "TECNICO" ? "tecnico" : "oficina";
    const response = await api.get(`/` + `${role}/servicos/${serviceId}/precos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  async updatePrice(
    profile: PricingProfile,
    serviceId: number,
    payload: UpdatePricePayload,
  ): Promise<ServicePricesApiResponse> {
    const token = await SecureStorageService.getToken();
    const role = profile === "TECNICO" ? "tecnico" : "oficina";
    const response = await api.patch(
      `/${role}/servicos/${serviceId}/precos`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  },

  async updateSuggestion(
    serviceId: number,
    payload: Omit<UpdateSuggestionPayload, "campo">,
  ): Promise<ServicePricesApiResponse> {
    const token = await SecureStorageService.getToken();
    const response = await api.patch(
      `/tecnico/servicos/${serviceId}/precos`,
      { ...payload, campo: "sugestao" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  },
};

export default ServicePricingService;
