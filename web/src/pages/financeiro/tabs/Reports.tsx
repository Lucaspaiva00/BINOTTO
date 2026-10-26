import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import type { Receivable, Payable } from "@/types/finance";
import { formatCurrency } from "@/utils/currency";
import { endOfMonth, startOfMonth } from "@/utils/date";
import { exportCSV } from "./shared";

export function Reports({ receivables, payables, complete }: { receivables: Receivable[]; payables: Payable[]; complete: boolean }) {
  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState(endOfMonth());

  const received = useMemo(() => receivables.filter(e => {
    const date = (e.issueDate || e.launchDate || e.createdAt).slice(0,10);
    return date >= from && date <= to && e.status !== "cancelado";
  }), [receivables, from, to]);
  const expenses = useMemo(() => payables.filter(e => {
    const date = (e.issueDate || e.launchDate || e.createdAt).slice(0,10);
    return date >= from && date <= to && e.status !== "cancelado";
  }), [payables, from, to]);
  const totalServices = received.reduce((sum,e) => sum + Number(e.serviceAmount || 0), 0);
  const netRevenue = received.filter(e => e.status === "confirmado" || e.status === "recebido").reduce((sum,e) => sum + Number(e.platformAmount || 0), 0);
  const totalExpenses = expenses.filter(e => e.status === "confirmado" || e.status === "pago").reduce((sum,e) => sum + Number(e.amountPaid || 0), 0);
  const profit = netRevenue - totalExpenses;

  const summary = [
    { resumo: "Total de serviços realizados", valor: totalServices },
    { resumo: "Receita líquida da plataforma", valor: netRevenue },
    { resumo: "Total de despesas pagas", valor: totalExpenses },
    { resumo: "Lucro líquido", valor: profit },
  ];

  return (
    <div className="space-y-4">
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
          <Button variant="outline" disabled={!complete} onClick={() => exportCSV(summary, `relatorio-financeiro-${from}-${to}.csv`)}>
            <Download className="w-4 h-4 mr-1" /> Exportar Excel/CSV
          </Button>
        </div>
      </div>

      {!complete && <p role="alert" className="text-sm text-amber-600">Existem mais lançamentos do que os carregados. Totais parciais: exportação desativada para evitar relatório incompleto.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">Total de serviços realizados</p>
          <p className="text-2xl font-semibold mt-1">{formatCurrency(totalServices)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">Receita líquida da plataforma</p>
          <p className="text-2xl font-semibold mt-1 text-emerald-600">{formatCurrency(netRevenue)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">Total de despesas pagas</p>
          <p className="text-2xl font-semibold mt-1 text-rose-600">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground">Lucro líquido</p>
          <p className={`text-2xl font-semibold mt-1 ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(profit)}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <p className="text-sm text-muted-foreground">
          Visão consolidada de {from} a {to}, com base em {received.length + expenses.length} lançamento(s) do período. Use o botão
          acima para exportar o resumo.
        </p>
      </div>
    </div>
  );
}
