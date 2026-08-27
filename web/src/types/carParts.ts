export type RepairType =
  | "PDR"
  | "PINTURA"
  | "TROCA"
  | "ALUMINIO_PDR"
  | "ALUMINIO_PINTURA"
  | "SEM_DANO";

export interface PartInspection {
  repairType: RepairType;
  dentCount: number;
  impactsOver25: number;
  impactsUnder25: number;
  notes: string;
  photos: string[];
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
