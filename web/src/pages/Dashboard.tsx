import { useEffect, useState } from "react";
import { Wrench, Building2, ClipboardCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/services/api/client";
import { formatCurrency } from "@/utils/currency";
import { toast } from "sonner";
import { kpis } from "@/data/dashboardMock";

const cards = [
  { label: "Técnicos ativos", value: kpis.techniciansActive, icon: Wrench },
  { label: "Oficinas ativas", value: kpis.workshopsActive, icon: Building2 },
  { label: "Serviços no mês", value: kpis.servicesMonth, icon: ClipboardCheck },
];

export default function Dashboard() {
  const [billing, setBilling] = useState<{year: number; billedAmount: number} | null>(null);
  useEffect(() => { api.get("/dashboard/faturamento").then(({data}) => setBilling(data)).catch(() => toast.error("Não foi possível carregar o faturamento anual.")); }, []);

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do painel administrativo">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon }, index) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">{index === 0 ? `Faturado em ${billing?.year ?? new Date().getFullYear()}` : label}</p><p className="mt-2 text-3xl font-bold">{index === 0 ? (billing ? formatCurrency(billing.billedAmount) : "—") : value}</p></div><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--app-accent))]/15"><Icon className="h-5 w-5" /></div></div>
          </div>
        ))}
      </div>


    </AppLayout>
  );
}
