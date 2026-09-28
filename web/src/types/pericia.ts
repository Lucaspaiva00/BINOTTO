export type PericiaStatus = "aberta" | "em_execucao" | "concluida" | "cancelada";

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
  publicNumber: string;
  status: PericiaStatus | null;
  statusLabel: string | null;
  deadline: string | null;
  tipo: PericiaTipo | null;
  licensePlate: string | null;
  model: string | null;
  brand?: string | null;
  vehicleModel?: string | null;
  inspectorName?: string | null;
  disassemblyValue?: number | null;
  totalValue?: number | null;
  technicianSuggestedValue?: number | null;
  appliedCoefficient?: number | null;
  priceVisibility?: {carro: boolean; desmontagem: boolean; total: boolean; sugerido: boolean} | null;
  workshopId?: number | null;
  workshop: string | null;
  technicianId?: number | null;
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
