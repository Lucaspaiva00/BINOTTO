import { Badge } from "@/components/ui/badge";
import type { FinanceOrigin, FinanceStatus } from "@/types/finance";
import type { UserSelectionItem } from "@/types/user";

export const PAGE_SIZE = 8;

export const STATUS_LABEL: Record<FinanceStatus, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  em_aberto: "Em aberto",
  recebido: "Recebido",
  pago: "Pago",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

const STATUS_CLASS: Record<FinanceStatus, string> = {
  pendente: "bg-amber-500/15 text-amber-600 hover:bg-amber-500/15",
  em_aberto: "bg-amber-500/15 text-amber-600 hover:bg-amber-500/15",
  confirmado: "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15",
  pago: "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15",
  recebido: "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15",
  vencido: "bg-rose-500/15 text-rose-600 hover:bg-rose-500/15",
  cancelado: "bg-muted text-muted-foreground hover:bg-muted",
};

export function StatusBadge({ status }: { status: FinanceStatus }) {
  return (
    <Badge className={`border-transparent whitespace-nowrap ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</Badge>
  );
}

export function OriginBadge({ origin }: { origin: FinanceOrigin }) {
  return <Badge variant="outline">{origin === "avulsa" ? "Avulsa" : "Aplicativo"}</Badge>;
}

export const techName = (list: UserSelectionItem[], id?: number | null) =>
  list.find((t) => t.id === id)?.name ?? "-";
export const shopName = (list: UserSelectionItem[], id?: number | null) =>
  list.find((w) => w.id === id)?.name ?? "-";

export function exportCSV(rows: Record<string, string | number>[], filename: string) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
