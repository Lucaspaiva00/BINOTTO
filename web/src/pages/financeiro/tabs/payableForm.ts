import type { Payable, PayablePayload, FinanceOrigin, FinanceStatus } from "@/types/finance";
import { todayISO } from "@/utils/date";

export interface PayableForm {
  id?: number;
  origin: FinanceOrigin;
  serviceId: number | null;
  serviceDate: string;
  brand: string;
  vehicleModel: string;
  plate: string;
  chassis: string;
  vehicleReferenceType: "placa" | "chassi";
  commission: string;
  invoice: string;
  invoiceNumber: string;
  technicianId: string;
  workshopId: string;
  description: string;
  amountDue: number;
  amountPaid: number;
  supplier: string;
  category: string;
  paymentMethod: string;
  settleDate: string;
  notes: string;
  entryDate: string;
  emissionDate: string;
  dueDate: string;
  status: FinanceStatus;
}

export function emptyForm(): PayableForm {
  return {
    origin: "aplicativo",
    serviceId: null,
    serviceDate: "", brand: "", vehicleModel: "", plate: "", chassis: "", vehicleReferenceType: "placa", commission: "", invoice: "", invoiceNumber: "",
    technicianId: "",
    workshopId: "",
    description: "",
    amountDue: 0,
    amountPaid: 0,
    supplier: "",
    category: "",
    paymentMethod: "",
    settleDate: "",
    notes: "",
    entryDate: todayISO(),
    emissionDate: "",
    dueDate: todayISO(),
    status: "pendente",
  };
}

export function toForm(p: Payable): PayableForm {
  return {
    id: p.id,
    origin: p.origin,
    serviceId: p.serviceId,
    serviceDate: p.serviceDate ?? "",
    brand: p.brand ?? "", vehicleModel: p.vehicleModel ?? "", plate: p.plate ?? "", chassis: p.chassis ?? "",
    vehicleReferenceType: p.vehicleReferenceType ?? (p.plate ? "placa" : "chassi"),
    commission: p.commission ?? "", invoice: p.invoice ?? "", invoiceNumber: p.invoiceNumber ?? "",
    technicianId: p.technicianId != null ? String(p.technicianId) : "",
    workshopId: p.workshopId != null ? String(p.workshopId) : "",
    description: p.description,
    amountDue: p.amountDue,
    amountPaid: p.amountPaid,
    supplier: p.supplier ?? "",
    category: p.category ?? "",
    paymentMethod: p.paymentMethod ?? "",
    settleDate: p.paymentDate ?? p.settleDate ?? "",
    notes: p.notes ?? "",
    entryDate: p.launchDate ?? todayISO(),
    emissionDate: p.issueDate ?? "",
    dueDate: p.dueDate,
    status: p.status,
  };
}

export function toPayload(form: PayableForm): PayablePayload {
  const base = {
    origem: form.origin,
    servico_id: form.serviceId,
    referencia_veiculo_tipo: form.vehicleReferenceType,
    descricao: form.description,
    data_vencimento: form.dueDate,
    comissao: form.commission || null,
    fatura: form.invoice || null,
    numero_fatura: form.invoiceNumber || null,
    data_pagamento: form.settleDate || null,
    status: form.status,
  };

  if (form.origin === "avulsa") {
    return {
      ...base,
      valor_a_pagar: form.amountDue,
      valor_pago: form.amountDue,
      fornecedor: form.supplier || null,
      categoria: form.category || null,
      forma_pagamento: form.paymentMethod || null,
      data_emissao: form.emissionDate || null,
      data_pagamento: form.settleDate || null,
      observacoes: form.notes || null,
    };
  }

  return {
    ...base,
    tecnico_id: form.technicianId ? Number(form.technicianId) : null,
    oficina_id: form.workshopId ? Number(form.workshopId) : null,
    valor_a_pagar: form.amountDue,
    valor_pago: form.amountPaid,
    data_lancamento: form.entryDate,
  };
}

