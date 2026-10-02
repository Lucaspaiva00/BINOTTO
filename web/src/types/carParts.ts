export type RepairType =
  | "PDR"
  | "PINTURA"
  | "TROCA"
  | "ALUMINIO_PDR"
  | "ALUMINIO_PINTURA"
  | "SEM_DANO";

export type PartPhoto = File | string;

export interface PartInspection {
  assessed?: boolean;
  repairType: RepairType;
  dentCount: number;
  impactsOver25: number;
  impactsUnder25: number;
  dentsUpTo2?: number;
  dentsUpTo5?: number;
  dentsOver5?: number;
  notes: string;
  photos: PartPhoto[];
}

export interface CarPart {
  id: string;
  label: string;
}

export interface CarPartLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: {
    tl?: number;
    tr?: number;
    bl?: number;
    br?: number;
  };
}

export interface CreatePericiaPayload {
  workshopId: number;
  technicianId?: number | null;
  licensePlate: string;
  chassis: string;
  model: string;
  brand?: string;
  vehicleModel?: string;
  inspectorName?: string;
  disassemblyValue?: number;
  technicianSuggestedValue?: number | null;
  priceVisibility?: {carro: boolean; desmontagem: boolean; total: boolean; sugerido: boolean};
  tipo: "simples" | "completa";
  includeValue: boolean;
  suggestedPrice?: number | null;
  inspectionValue?: number | null;
  photos: Record<string, File | null>;
  completePhotos: Record<string, File | null>;
  partsState: Record<string, PartInspection>;
}
