import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, Building2, ClipboardCheck, Search, ArrowRight, ScanSearch } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { periciaService } from "@/services/periciaService";
import { PERICIA_STATUS_CLASS, PERICIA_STATUS_LABEL } from "@/utils/periciaStatus";
import { formatDateTime } from "@/utils/date";
import type { Pericia } from "@/types/pericia";
import { kpis } from "@/data/dashboardMock";

const cards = [
  { label: "Técnicos ativos", value: kpis.techniciansActive, icon: Wrench },
  { label: "Oficinas ativas", value: kpis.workshopsActive, icon: Building2 },
  { label: "Serviços no mês", value: kpis.servicesMonth, icon: ClipboardCheck },
  { label: "Perícias no mês", value: kpis.inspectionsMonth, icon: Search },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [pericias, setPericias] = useState<Pericia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    periciaService.list({ per_page: 6, page: 1 })
      .then((response) => { if (!cancelled) setPericias(response.data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do painel administrativo">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--app-accent))]/15"><Icon className="h-5 w-5" /></div></div>
          </div>
        ))}
      </div>

      <section className="mt-5 rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border p-5">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent"><ScanSearch className="h-5 w-5" /></div><div><h2 className="font-semibold">Perícias</h2><p className="text-sm text-muted-foreground">Acompanhamento rápido das perícias mais recentes.</p></div></div>
          <Button variant="outline" onClick={() => navigate("/pericias")}>Ver todas <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
        {loading ? <div className="p-10"><Spinner className="mx-auto h-6 w-6" /></div> : pericias.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma perícia cadastrada.</p> : (
          <div className="divide-y divide-border">
            {pericias.map((p) => (
              <button key={p.id} onClick={() => navigate(`/pericias/${p.id}`)} className="flex w-full items-center gap-4 p-4 text-left hover:bg-accent/50">
                <div className="min-w-20 font-semibold">{p.publicNumber || `#${p.id}`}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.workshop ?? "Oficina não informada"}</p><p className="truncate text-xs text-muted-foreground">{p.licensePlate ?? "Sem placa"} · {p.model ?? "Sem modelo"}</p></div>
                {p.status && <Badge variant="outline" className={PERICIA_STATUS_CLASS[p.status]}>{PERICIA_STATUS_LABEL[p.status]}</Badge>}
                <span className="hidden text-xs text-muted-foreground md:block">{formatDateTime(p.createdAt)}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}
