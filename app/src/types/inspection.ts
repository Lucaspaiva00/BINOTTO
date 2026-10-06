export interface InspectionData {
  placa: string;
  chassi: string;
  marca_modelo: string;
  marca?: string | null;
  modelo?: string | null;
  moeda: "BRL" | "EUR";
  precoTotal: string;
  valorPericia: string;
  inserirValor: boolean;
}

export interface ExecutionData {
  placa: string;
  chassi: string;
  marcaModelo: string;
  precoTotal: string;
}

export interface MobileInspection {
  id: number;
  numero_publico?: string | null;
  prazo?: string | null;
  marca?: string | null;
  modelo?: string | null;
  marca_modelo?: string | null;
  valor_pericia?: number | string | null;
  valor_desmontagem?: number | string | null;
  valor_total?: number | string | null;
  valor_sugerido_tecnico?: number | string | null;
  preco_sugerido?: number | string | null;
  visibilidade_valores?: Record<string, boolean> | null;
}