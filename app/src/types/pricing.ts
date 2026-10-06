export type PricingProfile = "TECNICO" | "OFICINA";
export type PricingItem = "carro" | "desmontagem";
export type PriceType = "valor" | "porcentagem";

export type PriceEntry = {
  tipo: PriceType;
  valor: number;
  visivel_app?: boolean;
  habilitado_preenchimento_app?: boolean;
};

export type DetailedPrices = {
  oficina_carro: PriceEntry | null;
  tecnico_carro: PriceEntry | null;
  oficina_desmontagem: PriceEntry | null;
  tecnico_desmontagem: PriceEntry | null;
  tecnico_sugestao_carro?: PriceEntry | null;
  tecnico_sugestao_desmontagem?: PriceEntry | null;
};

export type CalculatedPrice = {
  oficina: number | null;
  tecnico: number | null;
};

export type CalculatedPrices = {
  carro: CalculatedPrice;
  desmontagem: CalculatedPrice;
};

export type TotalPrices = {
  oficina: number | null;
  tecnico: number | null;
};

export type ServicePricesResponse = {
  servico_id: number;
  moeda: string;
  precos_detalhados: DetailedPrices;
  precos_calculados: CalculatedPrices;
  precos_totais: TotalPrices;
};

export type ServicePricesApiResponse = {
  success: boolean;
  data: ServicePricesResponse;
  message?: string;
};

export type UpdatePricePayload = {
  item: PricingItem;
  tipo: PriceType;
  valor: number;
};

export type UpdateSuggestionPayload = {
  item: PricingItem;
  campo: "sugestao";
  valor: number;
};
