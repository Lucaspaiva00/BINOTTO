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
  techniciansActive: 47,
  workshopsActive: 24,
  servicesMonth: 312,
  inspectionsMonth: 96,
  techniciansDelta: 12.5,
  workshopsDelta: 8.3,
  servicesDelta: 18.7,
  inspectionsDelta: -4.2,
};

export interface GrowthPoint {
  month: string;
  tecnicos: number;
  oficinas: number;
}

export const growthSeries: GrowthPoint[] = [
  { month: "Jan", tecnicos: 18, oficinas: 12 },
  { month: "Fev", tecnicos: 22, oficinas: 14 },
  { month: "Mar", tecnicos: 28, oficinas: 16 },
  { month: "Abr", tecnicos: 34, oficinas: 18 },
  { month: "Mai", tecnicos: 41, oficinas: 21 },
  { month: "Jun", tecnicos: 47, oficinas: 24 },
];

export interface ServiceByCountry {
  country: string;
  servicos: number;
}

export const servicesByCountry: ServiceByCountry[] = [
  { country: "BR", servicos: 118 },
  { country: "IT", servicos: 94 },
  { country: "FR", servicos: 52 },
  { country: "ES", servicos: 24 },
  { country: "CH", servicos: 15 },
  { country: "PT", servicos: 9 },
];

export type ActivityKind = "novo_tecnico" | "nova_oficina" | "servico_concluido" | "pericia_criada";

export interface Activity {
  id: string;
  kind: ActivityKind;
  name: string;
  country: string;
  timeAgo: string;
}

export const recentActivity: Activity[] = [
  { id: "a1", kind: "novo_tecnico", name: "Giulia Russo", country: "IT", timeAgo: "há 12 min" },
  { id: "a2", kind: "servico_concluido", name: "Marco Rossi · Milano", country: "IT", timeAgo: "há 38 min" },
  { id: "a3", kind: "nova_oficina", name: "Auto RJ Service", country: "BR", timeAgo: "há 1 h" },
  { id: "a4", kind: "pericia_criada", name: "João Pereira", country: "BR", timeAgo: "há 2 h" },
  { id: "a5", kind: "servico_concluido", name: "Sophie Martin · Paris", country: "FR", timeAgo: "há 3 h" },
  { id: "a6", kind: "novo_tecnico", name: "Hans Müller", country: "CH", timeAgo: "há 5 h" },
];
