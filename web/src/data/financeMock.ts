export type FinanceStatus = "pendente" | "confirmado";
export type FinanceKind = "receber" | "pagar";

export interface FinanceEntry {
  id: string;
  kind: FinanceKind;
  description: string;
  technicianId?: string;
  workshopId?: string;
  beneficiary?: string;
  payer?: string;
  receiver?: string;
  serviceValue?: number;
  platformValue?: number;
  payValue?: number;
  paidValue?: number;
  entryDate: string;
  dueDate: string;
  status: FinanceStatus;
}

export const financeEntries: FinanceEntry[] = [];
