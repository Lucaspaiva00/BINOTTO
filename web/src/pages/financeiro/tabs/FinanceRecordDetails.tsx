import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Payable, Receivable } from "@/types/finance";
import type { UserSelectionItem } from "@/types/user";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { OriginBadge, StatusBadge, shopName, techName } from "./shared";

type Record = Payable | Receivable;

function reference(record: Record) {
  return record.vehicleReferenceType === "chassi"
    ? record.chassis
    : record.vehicleReference || record.plate || record.chassis;
}

export function FinanceVehicleSummary({ record }: { record: Record }) {
  return <div className="min-w-40 max-w-72">
    <p className="font-medium break-words">{[record.brand, record.vehicleModel].filter(Boolean).join(" ") || record.description || `Lançamento #${record.id}`}</p>
    {reference(record) && <p className="text-xs text-muted-foreground break-all">{reference(record)}</p>}
  </div>;
}

function Field({ label, children }: { label: string; children?: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium">{children || "—"}</dd>
  </div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl border border-border p-4">
    <h3 className="mb-4 font-semibold">{title}</h3>
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</dl>
  </section>;
}

type Props = {
  kind: "pagar" | "receber";
  record: Record | null;
  workshops: UserSelectionItem[];
  technicians?: UserSelectionItem[];
  onClose: () => void;
  onEdit: () => void;
};

export function FinanceRecordDetails({ kind, record, workshops, technicians = [], onClose, onEdit }: Props) {
  const payable = record && "amountDue" in record ? record : null;
  const receivable = record && "serviceAmount" in record ? record : null;
  const workshop = record?.workshop || shopName(workshops, record?.workshopId);
  const technician = record?.technician || (payable?.supplier ?? techName(technicians, record?.technicianId));

  return <Dialog open={Boolean(record)} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Detalhes da Conta a {kind === "pagar" ? "Pagar" : "Receber"}{record ? ` #${record.id}` : ""}</DialogTitle>
        <DialogDescription>Consulte os dados completos do lançamento. Para alterar, clique em Editar.</DialogDescription>
      </DialogHeader>
      {record && <>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/40 p-4">
          <div><p className="text-xs text-muted-foreground">{payable ? "Valor a pagar" : "Valor a receber"}</p>
            <p className="mt-1 text-2xl font-semibold">{formatCurrency(payable?.amountDue ?? receivable?.serviceAmount ?? 0)}</p></div>
          <div className="flex gap-2"><OriginBadge origin={record.origin} /><StatusBadge status={record.status} /></div>
        </div>
        <Section title="Identificação">
          <Field label="Descrição">{record.description}</Field>
          {record.origin === "aplicativo" && <>
          <Field label="Serviço">{record.serviceId ? <Link className="text-primary underline" to={`/servicos/${record.serviceId}`}>Serviço #{record.serviceId}</Link> : null}</Field>
          <Field label="Data do serviço">{formatDate(record.serviceDate)}</Field>
          <Field label="Marca">{record.brand}</Field>
          <Field label="Modelo">{record.vehicleModel}</Field>
          <Field label="Referência do veículo">{reference(record)}</Field>
          <Field label="Placa">{record.plate}</Field>
          <Field label="Chassi">{record.chassis}</Field>
          <Field label="Oficina">{workshop}</Field>
          <Field label="Técnico">{technician}</Field>
          </>}
          {record.origin === "avulsa" && <Field label={payable ? "Fornecedor" : "Cliente"}>{payable?.supplier ?? receivable?.client}</Field>}
        </Section>
        <Section title="Valores e datas">
          {payable && <><Field label="Comissão (% / €)">{payable.commission}</Field>
            <Field label="Valor do técnico / Valor a pagar">{formatCurrency(payable.amountDue)}</Field>
            <Field label="Valor pago">{formatCurrency(payable.amountPaid)}</Field>
            <Field label="Data do pagamento">{formatDate(payable.paymentDate ?? payable.settleDate)}</Field></>}
          {receivable && <><Field label="Valor do serviço">{formatCurrency(receivable.serviceAmount)}</Field>
            <Field label="Valor da plataforma">{formatCurrency(receivable.platformAmount)}</Field>
            <Field label="Quem pagou">{receivable.paidBy}</Field>
            <Field label="Data de recebimento">{formatDate(receivable.receivedDate)}</Field></>}
          <Field label="Data do lançamento">{formatDate(record.launchDate)}</Field>
          <Field label="Data de emissão">{formatDate(record.issueDate)}</Field>
          <Field label="Vencimento">{formatDate(record.dueDate)}</Field>
          <Field label="Forma de pagamento">{record.paymentMethod}</Field>
          <Field label="Categoria">{record.category}</Field>
        </Section>
        <Section title={payable ? "Fatura do técnico" : "Fatura da oficina"}>
          <Field label="Fatura">{record.invoice}</Field>
          <Field label="Número da fatura">{record.invoiceNumber}</Field>
          {receivable && <Field label="Status da fatura">{receivable.invoiceStatus}</Field>}
        </Section>
        {record.notes && <Section title="Observações"><Field label="Observações">{record.notes}</Field></Section>}
      </>}
      <DialogFooter><Button variant="outline" onClick={onClose}>Fechar</Button>
        <Button onClick={onEdit}><Pencil className="mr-2 h-4 w-4" />Editar</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
