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
  serviceId: number | null;
  description: string;
  serviceAmount: number;
  platformAmount: number;
  paidBy: string | null;
  client: string | null;
  category: string | null;
  paymentMethod: string | null;
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
  descricao: string;
  valor_servico: number;
  valor_plataforma: number;
  quem_pagou?: string | null;
  cliente?: string | null;
  categoria?: string | null;
  forma_pagamento?: string | null;
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
  technicianId: number | null;
  workshopId: number | null;
  description: string;
  amountDue: number;
  amountPaid: number;
  supplier: string | null;
  category: string | null;
  paymentMethod: string | null;
  settleDate: string | null;
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
  tecnico_id?: number | null;
  oficina_id?: number | null;
  descricao: string;
  valor_a_pagar: number;
  valor_pago?: number | null;
  fornecedor?: string | null;
  categoria?: string | null;
  forma_pagamento?: string | null;
  data_emissao?: string | null;
  data_pagamento?: string | null;
  observacoes?: string | null;
  data_lancamento?: string | null;
  data_vencimento: string;
  status: FinanceStatus;
}
