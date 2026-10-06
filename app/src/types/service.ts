import { DetailedPrices, CalculatedPrices, TotalPrices } from "./pricing";

export type ServiceVehicle = {
  placa?: string | null;
  chassi?: string | null;
  marca?: string | null;
  modelo?: string | null;
  marca_modelo?: string | null;
  fotos_veiculo_urls?: Record<string, string> | null;
  reparos_execucao_urls?: Array<Record<string, unknown>> | null;
  reparos_execucao?: Array<Record<string, unknown>> | null;
  preco_total?: number | string | null;
  finalizado_em?: string | null;
};

export type ServiceInspection = {
  id: number;
  numero_publico?: string | null;
  prazo?: string | null;
  status?: string | null;
  marca?: string | null;
  modelo?: string | null;
  marca_modelo?: string | null;
  valor_desmontagem?: number | string | null;
  valor_total?: number | string | null;
  valor_sugerido_tecnico?: number | string | null;
  visibilidade_valores?: Record<string, boolean> | null;
};

export type MobileService = {
  id: number;
  status?: string | null;
  moeda?: string | null;
  valor_total?: number | string | null;
  preco_tecnico?: number | string | null;
  precos_detalhados?: DetailedPrices | null;
  precos_calculados?: CalculatedPrices | null;
  precos_totais?: TotalPrices | null;
  marca?: string | null;
  modelo?: string | null;
  marca_modelo?: string | null;
  primeiro_veiculo?: ServiceVehicle | null;
  pericias?: ServiceInspection[];
};
