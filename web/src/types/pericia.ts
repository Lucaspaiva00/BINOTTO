export type PericiaStatus = "aberta" | "em_execucao" | "concluida";

export type PericiaTipo = "simples" | "completa";

export interface PericiaRepair {
  part: string | null;
  repairType: string;
  dentCount: number;
  impactsOver25: number;
  impactsUnder25: number;
  notes: string;
  photos: string[];
}

export interface Pericia {
  id: number;
  status: PericiaStatus | null;
  statusLabel: string | null;
  tipo: PericiaTipo | null;
  licensePlate: string | null;
  model: string | null;
  workshop: string | null;
  technician: string | null;
  serviceId: number | null;
  currency: string | null;
  suggestedPrice: number | null;
  inspectionValue: number | null;
  createdAt: string;
  chassis?: string | null;
  photos?: Record<string, string>;
  completePhotos?: Record<string, string>;
  repairs?: PericiaRepair[];
}
