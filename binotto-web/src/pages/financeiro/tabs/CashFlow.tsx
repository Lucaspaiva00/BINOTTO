import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cashFlowService } from "@/services/cashFlowService";
import type { FinanceStatus, Payable, Receivable } from "@/types/finance";
import { formatCurrency } from "@/utils/currency";
import { formatDate, startOfMonth, todayISO } from "@/utils/date";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { STATUS_LABEL, StatusBadge, exportCSV } from "./shared";

interface CashFlowRow {
  date: string;
  description: string;
  type: "Entrada" | "Saída";
  value: number;
  status: FinanceStatus;
  [key: string]: string | number;
}

function toRows(contasReceber: Receivable[], contasPagar: Payable[]): CashFlowRow[] {
  const entradas: CashFlowRow[] = contasReceber.map((r) => ({
    date: r.dueDate,
    description: r.description,
    type: "Entrada",
    value: r.serviceAmount,
    status: r.status,
  }));

  const saidas: CashFlowRow[] = contasPagar.map((p) => ({
    date: p.dueDate,
    description: p.description,
    type: "Saída",
    value: p.amountDue,
    status: p.status,
  }));

  return [...entradas, ...saidas].sort((a, b) => a.date.localeCompare(b.date));
}

function toExportRows(rows: CashFlowRow[]) {
  return rows.map((r) => ({
    Data: formatDate(r.date),
    Descrição: r.description,
    Tipo: r.type,
    "Valor (€)": formatCurrency(r.value),
    Status: STATUS_LABEL[r.status],
  }));
}

export function CashFlow() {
  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState(todayISO());
  const [rows, setRows] = useState<CashFlowRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      setLoading(true);

      try {
        const response = await cashFlowService.get({
          data_de: from || undefined,
          data_ate: to || undefined,
        });
        if (cancelled) return;

        setRows(toRows(response.contasReceber, response.contasPagar));
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRows();

    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const totalIn = rows.filter((r) => r.type === "Entrada").reduce((acc, r) => acc + r.value, 0);
  const totalOut = rows.filter((r) => r.type === "Saída").reduce((acc, r) => acc + r.value, 0);
  const balance = totalIn - totalOut;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">Total de entradas</p>
          <p className="text-2xl font-semibold mt-1 text-emerald-600">{formatCurrency(totalIn)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">Total de saídas</p>
          <p className="text-2xl font-semibold mt-1 text-rose-600">{formatCurrency(totalOut)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">Saldo do período</p>
          <p className={`text-2xl font-semibold mt-1 ${balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">De</Label>
          <DateInput value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <DateInput value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px]" />
        </div>
        <div className="ml-auto">
          <Button variant="outline" onClick={() => exportCSV(toExportRows(rows), `fluxo-caixa-${from}-${to}.csv`)}>
            <Download className="w-4 h-4 mr-1" /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <Spinner className="w-6 h-6 mx-auto" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Nenhuma transação no período.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{formatDate(r.date)}</TableCell>
                  <TableCell className="font-medium">{r.description}</TableCell>
                  <TableCell>
                    {r.type === "Entrada" ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 border-transparent">
                        Entrada
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-500/15 text-rose-600 hover:bg-rose-500/15 border-transparent">
                        Saída
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(r.value)}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
