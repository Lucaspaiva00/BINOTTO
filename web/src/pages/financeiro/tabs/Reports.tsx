import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import type { FinanceEntry } from "@/data/financeMock";
import { formatCurrency } from "@/utils/currency";
import { endOfMonth, startOfMonth } from "@/utils/date";
import { exportCSV } from "./shared";

export function Reports({ entries }: { entries: FinanceEntry[] }) {
  const [from, setFrom] = useState(startOfMonth());
  const [to, setTo] = useState(endOfMonth());

  const scope = useMemo(() => entries.filter((e) => e.entryDate >= from && e.entryDate <= to), [entries, from, to]);
  const totalServices = scope
    .filter((e) => e.kind === "receber")
    .reduce((acc, e) => acc + (e.serviceValue ?? 0), 0);
  const netRevenue = scope
    .filter((e) => e.kind === "receber" && e.status === "confirmado")
    .reduce((acc, e) => acc + (e.platformValue ?? 0), 0);
  const totalExpenses = scope
    .filter((e) => e.kind === "pagar" && e.status === "confirmado")
    .reduce((acc, e) => acc + (e.paidValue ?? 0), 0);
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
          <Button variant="outline" onClick={() => exportCSV(summary, `relatorio-financeiro-${from}-${to}.csv`)}>
            <Download className="w-4 h-4 mr-1" /> Exportar Excel/CSV
          </Button>
        </div>
      </div>

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
          Visão consolidada de {from} a {to}, com base em {scope.length} transação(ões) do período. Use o botão
          acima para exportar o resumo.
        </p>
      </div>
    </div>
  );
}
