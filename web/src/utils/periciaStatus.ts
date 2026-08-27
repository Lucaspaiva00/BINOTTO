import type { PericiaStatus } from "@/types/pericia";

export const PERICIA_STATUS_LABEL: Record<PericiaStatus, string> = {
  aberta: "Aberta",
  em_execucao: "Em execução",
  concluida: "Concluída",
};

export const PERICIA_STATUS_CLASS: Record<PericiaStatus, string> = {
  aberta: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  em_execucao: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  concluida: "bg-blue-500/15 text-blue-600 border-blue-500/30",
};

export const PERICIA_TIPO_LABEL = {
  simples: "Básica",
  completa: "Completa",
} as const;
