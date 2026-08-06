import type { ServiceStatus } from "@/types/service";

export const SERVICE_STATUS_LABEL: Record<ServiceStatus, string> = {
  aguardando: "Aberto",
  aguardando_aprovacao: "Aguardando aprovação",
  aceito: "Aceito",
  em_execucao: "Em execução",
  em_breve: "Em breve",
  retrabalho: "Retrabalho",
  concluido: "Concluído",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

export const SERVICE_STATUS_CLASS: Record<ServiceStatus, string> = {
  aguardando: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  aguardando_aprovacao: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  aceito: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  em_execucao: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  em_breve: "bg-violet-500/15 text-violet-600 border-violet-500/30",
  retrabalho: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  concluido: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  finalizado: "bg-teal-500/15 text-teal-600 border-teal-500/30",
  cancelado: "bg-red-500/15 text-red-600 border-red-500/30",
};
