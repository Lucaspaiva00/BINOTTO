type ServiceAvailability = {
  status: "aguardando" | "em_breve" | string;
  tecnico_id?: number;
  disponivel_para_todos?: boolean;
  tecnicos_preferidos_notificados?: number[];
};

export function isServiceAvailableForTechnician(service: ServiceAvailability, technicianId?: number): boolean {
  if (!technicianId) {
    return false;
  }

  if (!service) {
    return false; 
  }

  // por enquanto
  if (service.status === "em_breve") {
    return false;
  } 
  //------
  
  if (service.status === "aguardando") {
    return true;
  }

  if (service.status !== "em_breve") {
    return false;
  }

  if (service.disponivel_para_todos) {
    return true;
  }

  return (service.tecnicos_preferidos_notificados ?? []).includes(technicianId);
}