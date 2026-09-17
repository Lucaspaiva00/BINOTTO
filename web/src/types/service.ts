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
  publicNumber: string;
  status: string | null;
  statusLabel: string | null;
  licensePlate: string | null;
}

export interface ServiceVehicleRepair {
  peca?: string;
  tipoReparo?: string;
  quantidadeAmassados?: number;
  quantidadeImpactosMaior25?: number;
  quantidadeImpactosMenor25?: number;
  observacoes?: string;
  fotos?: string[];
}

export interface Service {
  id: number;
  status: ServiceStatus | null;
  statusLabel: string | null;
  workshopId: number | null;
  workshop: string | null;
  workshopCity: string | null;
  workshopCountry: string | null;
  technicianId: number | null;
  technician: string | null;
  createdBy: string | null;
  vehicleId: number | null;
  licensePlate: string | null;
  chassis: string | null;
  model: string | null;
  vehicleRepairs: ServiceVehicleRepair[];
  vehiclePrice: number;
  startDate: string | null;
  endDate: string | null;
  quantityType: string | null;
  quantity: number | null;
  currency: string | null;
  totalAmount: number;
  technicianAmount: number | null;
  technicianPercentage: number | null;
  rating: number | null;
  expectedArrivalDate: string | null;
  expectedArrivalTime: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  logs?: ServiceLog[];
  inspections?: ServiceInspectionSummary[];
}
