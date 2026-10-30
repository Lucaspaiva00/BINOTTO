import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarRange, TrendingUp, Wallet } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/services/api/client";
import { receivableService } from "@/services/receivableService";
import { formatCurrency } from "@/utils/currency";
import type { Receivable } from "@/types/finance";

const MAX_PAGES = 100;
const PAGE_SIZE = 100;
type Billing = { year: number; billedAmount: number };

export default function Dashboard() {
  const year = new Date().getFullYear();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [entries, setEntries] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [incomplete, setIncomplete] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [annual, first] = await Promise.all([
          api.get<Billing>("/dashboard/faturamento"),
          receivableService.list({ page: 1, per_page: PAGE_SIZE }),
        ]);
        const all = [...first.data];
        const pages = first.meta.last_page;
        for (let page = 2; page <= Math.min(pages, MAX_PAGES); page++) {
          const result = await receivableService.list({ page, per_page: PAGE_SIZE });
          all.push(...result.data);
        }
        if (!cancelled) {
          setBilling(annual.data);
          setEntries(all);
          setIncomplete(pages > MAX_PAGES);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const yearTotals = new Map<number, number>();
    let month = 0;
    let week = 0;
    for (const item of entries) {
      if (!["emitida", "enviada", "paga"].includes(item.invoiceStatus ?? "") || item.status === "cancelado") continue;
      const raw = item.issueDate;
      if (!raw) continue;
      const issued = new Date(raw.slice(0, 10) + "T12:00:00");
      if (Number.isNaN(issued.getTime()) || issued > now) continue;
      const amount = Number(item.serviceAmount) || 0;
      const y = issued.getFullYear();
      yearTotals.set(y, (yearTotals.get(y) || 0) + amount);
      if (y === now.getFullYear() && issued.getMonth() === now.getMonth()) month += amount;
      if (issued >= weekStart) week += amount;
    }
    return { month, week, yearTotals };
  }, [entries]);

  const years = [year - 2, year - 1, year];
  const values = years.map(y => y === billing?.year ? billing.billedAmount : (stats.yearTotals.get(y) ?? 0));
  const maxValue = Math.max(...values, 1);
  return (
    <AppLayout title="Dashboard" subtitle="Faturamento real da plataforma">
      {error && <p role="alert" className="mb-4 text-sm text-destructive">Não foi possível consultar o faturamento. Nenhum valor estimado foi exibido.</p>}
      {incomplete && <p role="alert" className="mb-4 text-sm text-amber-600">Existem lançamentos adicionais. Os valores semanal, mensal e os anos anteriores podem estar incompletos.</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Faturamento anual", value: billing?.billedAmount, icon: Wallet },
          { label: "Faturamento do mês", value: stats.month, icon: CalendarRange },
          { label: "Faturamento da semana", value: stats.week, icon: CalendarDays },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{label}</p><Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-semibold">{loading || error ? "—" : formatCurrency(value ?? 0)}</p>
          </div>
        ))}
      </div>
      <section className="mt-5 rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-semibold"><TrendingUp className="h-5 w-5" /> Comparativo de faturamento anual</h2>
        <p className="mt-1 text-xs text-muted-foreground">Faturas emitidas, enviadas ou pagas, por data de emissão. Ano atual: total oficial da API.</p>
        <div className="mt-6 grid grid-cols-3 gap-4 items-end">
          {years.map((y, i) => (
            <div key={y} className="flex flex-col items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-center break-words">{loading || error ? "—" : formatCurrency(values[i])}</span>
              <div className="w-full max-w-32 h-44 flex items-end rounded-lg bg-muted/40 overflow-hidden">
                <div className="w-full rounded-t-lg bg-[hsl(var(--app-accent))]" style={{ height: loading || error ? "0%" : `${Math.max(0, values[i] / maxValue * 100)}%` }} />
              </div>
              <span className="text-sm font-semibold">{y}</span>
            </div>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
