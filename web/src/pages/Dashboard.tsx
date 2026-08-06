import type { ComponentType } from "react";
import {
  Wrench,
  Building2,
  ClipboardCheck,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  Store,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  kpis,
  growthSeries,
  servicesByCountry,
  recentActivity,
  type ActivityKind,
} from "@/data/dashboardMock";

interface KpiCardProps {
  label: string;
  value: number | string;
  delta: number;
  icon: ComponentType<{ className?: string }>;
}

function KpiCard({ label, value, delta, icon: Icon }: KpiCardProps) {
  const positive = delta >= 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-[hsl(var(--app-accent))]/15 text-[hsl(var(--app-accent))] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div
        className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${
          positive ? "text-emerald-500" : "text-red-500"
        }`}
      >
        {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        {Math.abs(delta).toFixed(1)}%
        <span className="text-muted-foreground font-normal ml-1">vs mês anterior</span>
      </div>
    </div>
  );
}

const activityMeta: Record<ActivityKind, { label: string; icon: ComponentType<{ className?: string }> }> = {
  novo_tecnico: { label: "Novo técnico cadastrado", icon: UserPlus },
  nova_oficina: { label: "Nova oficina cadastrada", icon: Store },
  servico_concluido: { label: "Serviço concluído", icon: ClipboardCheck },
  pericia_criada: { label: "Perícia criada", icon: Search },
};

export default function Dashboard() {
  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do aplicativo">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Técnicos ativos" value={kpis.techniciansActive} delta={kpis.techniciansDelta} icon={Wrench} />
        <KpiCard label="Oficinas ativas" value={kpis.workshopsActive} delta={kpis.workshopsDelta} icon={Building2} />
        <KpiCard label="Serviços no mês" value={kpis.servicesMonth} delta={kpis.servicesDelta} icon={ClipboardCheck} />
        <KpiCard label="Perícias no mês" value={kpis.inspectionsMonth} delta={kpis.inspectionsDelta} icon={Search} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground">Crescimento de usuários</h3>
          <p className="text-xs text-muted-foreground mb-4">Últimos 6 meses</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="tecnicos"
                  name="Técnicos"
                  stroke="hsl(var(--app-accent))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="oficinas"
                  name="Oficinas"
                  stroke="hsl(0 0% 80%)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground">Serviços por país</h3>
          <p className="text-xs text-muted-foreground mb-4">Mês atual</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servicesByCountry} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="country" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={40} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="servicos" fill="hsl(var(--app-accent))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-card border border-border rounded-2xl p-5 mt-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Atividade recente</h3>
        <ul className="divide-y divide-border">
          {recentActivity.map((activity) => {
            const meta = activityMeta[activity.kind];
            const Icon = meta.icon;
            return (
              <li key={activity.id} className="flex items-center gap-3 py-3">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-foreground shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{meta.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.name} · {activity.country}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.timeAgo}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </AppLayout>
  );
}
