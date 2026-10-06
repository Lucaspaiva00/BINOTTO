export type FinanceStatus =
  | "pendente"
  | "confirmado"
  | "em_aberto"
  | "recebido"
  | "pago"
  | "vencido"
  | "cancelado";

export type FinanceOrigin = "aplicativo" | "avulsa";

export interface Receivable {
  id: number;
  origin: FinanceOrigin;
  workshopId: number | null;
  workshop?: string | null;
  technicianId?: number | null;
  technician?: string | null;
  serviceId: number | null;
  serviceDate?: string | null;
  brand?: string | null;
  vehicleModel?: string | null;
  plate?: string | null;
  chassis?: string | null;
  vehicleReferenceType?: "placa" | "chassi" | null;
  vehicleReference?: string | null;
  description: string;
  serviceAmount: number;
  platformAmount: number;
  paidBy: string | null;
  client: string | null;
  category: string | null;
  paymentMethod: string | null;
  invoice?: string | null;
  invoiceNumber?: string | null;
  invoiceStatus?: string | null;
  receivedDate: string | null;
  notes: string | null;
  launchDate: string | null;
  issueDate: string | null;
  dueDate: string;
  status: FinanceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReceivablePayload {
  origem: FinanceOrigin;
  oficina_id?: number | null;
  servico_id?: number | null;
  referencia_veiculo_tipo?: "placa" | "chassi" | null;
  descricao: string;
  valor_servico: number;
  valor_plataforma: number;
  quem_pagou?: string | null;
  cliente?: string | null;
  categoria?: string | null;
  forma_pagamento?: string | null;
  fatura?: string | null;
  numero_fatura?: string | null;
  status_fatura?: string | null;
  data_emissao?: string | null;
  data_recebimento?: string | null;
  observacoes?: string | null;
  data_lancamento?: string | null;
  data_vencimento: string;
  status: FinanceStatus;
}

export interface Payable {
  id: number;
  origin: FinanceOrigin;
  serviceId: number | null;
  serviceDate?: string | null;
  brand?: string | null;
  vehicleModel?: string | null;
  plate?: string | null;
  chassis?: string | null;
  vehicleReferenceType?: "placa" | "chassi" | null;
  vehicleReference?: string | null;
  technicianId: number | null;
  workshopId: number | null;
  description: string;
  amountDue: number;
  amountPaid: number;
  commission?: string | null;
  supplier: string | null;
  category: string | null;
  paymentMethod: string | null;
  invoice?: string | null;
  invoiceNumber?: string | null;
  settleDate: string | null;
  paymentDate?: string | null;
  notes: string | null;
  // "Data do lançamento" — só existe no modo aplicativo.
  launchDate: string | null;
  // "Data de emissão" — só existe no modo avulsa.
  issueDate: string | null;
  dueDate: string;
  status: FinanceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PayablePayload {
  origem: FinanceOrigin;
  servico_id?: number | null;
  referencia_veiculo_tipo?: "placa" | "chassi" | null;
  tecnico_id?: number | null;
  oficina_id?: number | null;
  descricao: string;
  valor_a_pagar: number;
  valor_pago?: number | null;
  comissao?: string | null;
  fornecedor?: string | null;
  categoria?: string | null;
  forma_pagamento?: string | null;
  fatura?: string | null;
  numero_fatura?: string | null;
  data_emissao?: string | null;
  data_pagamento?: string | null;
  observacoes?: string | null;
  data_lancamento?: string | null;
  data_vencimento: string;
  status: FinanceStatus;
}
