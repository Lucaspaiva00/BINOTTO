export type ServiceStatus =
  | "aguardando"
  | "aguardando_aprovacao"
  | "aceito"
  | "em_execucao"
  | "em_breve"
  | "retrabalho"
  | "concluido"
  | "finalizado"
  | "cancelado";

export interface ServiceLog {
  id: number;
  type: string | null;
  description: string | null;
  reason: string | null;
  workshop: string | null;
  technician: string | null;
  periciaId: number | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface ServiceInspectionSummary {
  id: number;
  status: string | null;
  statusLabel: string | null;
  tipo: string | null;
  licensePlate: string | null;
}

export interface Service {
  id: number;
  status: ServiceStatus | null;
  statusLabel: string | null;
  workshop: string | null;
  workshopCity: string | null;
  workshopCountry: string | null;
  technician: string | null;
  createdBy: string | null;
  licensePlate: string | null;
  model: string | null;
  startDate: string | null;
  endDate: string | null;
  quantityType: string | null;
  quantity: number | null;
  currency: string | null;
  totalAmount: number;
  rating: number | null;
  expectedArrivalDate: string | null;
  expectedArrivalTime: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  logs?: ServiceLog[];
  inspections?: ServiceInspectionSummary[];
}
