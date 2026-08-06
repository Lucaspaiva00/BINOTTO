
export const statusLabelMap: Record<string, string> = {
  concluido: "Concluído",
  finalizado: "Finalizado",
  aguardando: "Aguardando",
  aguardando_aprovacao: "Aguardando Aprovação",
  cancelado: "Cancelado",
  aceito: "Téc. Aceitou",
  em_breve: "Em breve",
  retrabalho: "Rilavorazione",
};

export const statusDotStyles = {
  concluido: {
    dotColor: "#34D399",
  },
  aguardando: {
    dotColor: "#FACC15",
  },
  disponivel: {
    dotColor: "#34D399",
  },
  aguardando_aprovacao: {
    dotColor: "#FACC15",
  },
  cancelado: {
    dotColor: "#F87171",
  },
  recusado: {
    dotColor: "#F87171",
  },
  aceito: {
    dotColor: "#60A5FA",
  },
  em_breve: {
    dotColor: "#C084F9",
  },
  em_execucao: {
    dotColor: "#faa615",
  },
  finalizado: {
    dotColor: "#F97316",
  },
  retrabalho: {
    dotColor: "#A78BFA",
  },
  default: {
    dotColor: "#999",
  },
};

export const renderStatus = (status: string, isTecnico: boolean = false) => {
  let label = statusLabelMap[status] ?? status;

  let color =
    statusDotStyles[status as keyof typeof statusDotStyles]?.dotColor ??
    "#999";

  if (isTecnico && status === "aguardando") {
    label = "Disponível";
    color = "#10B981";
  }

  return {
    label,
    color,
  };
};

export const getStatusLabelKey = (
  status: string, 
  isTecnico = false, 
): string => {
  const statusKeyMap: Record<string, string> = {
    concluido: "completed",
    finalizado: "finished",
    aguardando: "waiting",
    em_execucao: "inProgress",
    aguardando_aprovacao: "waitingApproval",
    cancelado: "canceled",
    aceito: "accepted",
    em_breve: "comingSoon",
    retrabalho: "rework",
    recusado: "refused"
  };

  if (isTecnico && status === "aguardando") {
    return "common.status.available";
  }

  if (isTecnico && status === "aceito") {
    return "common.status.acceptedTech";
  }

  const key = statusKeyMap[status];

  return key ? `common.status.${key}` : status;
};