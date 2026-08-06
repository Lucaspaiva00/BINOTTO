export interface DashboardKpis {
  techniciansActive: number;
  workshopsActive: number;
  servicesMonth: number;
  inspectionsMonth: number;
  techniciansDelta: number;
  workshopsDelta: number;
  servicesDelta: number;
  inspectionsDelta: number;
}

export const kpis: DashboardKpis = {
  techniciansActive: 0,
  workshopsActive: 0,
  servicesMonth: 0,
  inspectionsMonth: 0,
  techniciansDelta: 0,
  workshopsDelta: 0,
  servicesDelta: 0,
  inspectionsDelta: 0,
};

export interface GrowthPoint {
  month: string;
  tecnicos: number;
  oficinas: number;
}

export const growthSeries: GrowthPoint[] = [
  { month: "Jan", tecnicos: 0, oficinas: 0 },
  { month: "Fev", tecnicos: 0, oficinas: 0 },
  { month: "Mar", tecnicos: 0, oficinas: 0 },
  { month: "Abr", tecnicos: 0, oficinas: 0 },
  { month: "Mai", tecnicos: 0, oficinas: 0 },
  { month: "Jun", tecnicos: 0, oficinas: 0 },
];

export interface ServiceByCountry {
  country: string;
  servicos: number;
}

export const servicesByCountry: ServiceByCountry[] = [
  { country: "BR", servicos: 0 },
  { country: "IT", servicos: 0 },
  { country: "FR", servicos: 0 },
  { country: "ES", servicos: 0 },
  { country: "CH", servicos: 0 },
  { country: "PT", servicos: 0 },
];

export type ActivityKind = "novo_tecnico" | "nova_oficina" | "servico_concluido" | "pericia_criada";

export interface Activity {
  id: string;
  kind: ActivityKind;
  name: string;
  country: string;
  timeAgo: string;
}

export const recentActivity: Activity[] = [];
