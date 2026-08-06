import { colors } from "@/theme/colors";
import { t } from "i18next";

export function colorStatus(status: string, isTecnico: boolean = false, isCalendar: boolean = false): string | undefined {

  if (status === "finalizado") {
    return "#faa615";
  }
  if (isTecnico && status === "aguardando") {
    return "#34D399";
  }

  if (!isTecnico && status === "aguardando") {
    return "#FACC15";
  }

  if (status === t("technicianDashboardScreen.filterServices.availableServices")) {
    return "#34D399";
  } else if (status === "disponivel") {
    return "#34D399";
  } else if (status === t("technicianDashboardScreen.filterServices.acceptedServices")) {
    return "#60A5FA";
  } else if (status === t("technicianDashboardScreen.filterServices.inProgressServices")) {
    return "#FACC15";
  } else if (status === t("technicianDashboardScreen.filterServices.awaitingApprovalServices")) {
    return "#FACC15";
  } else if (status === "em_execucao") {
    return "#faa615";
  } else if (status === "aceito") {
    return "#60A5FA";
  } else if (status === "aguardando_aprovacao") {
    return "#FACC15";
  } else if (status === "concluido") {
    return "#34D399";
  } else if (status === "finalizado") {
    return "#34D399";
  } else if (status === "aguardando") {
    return colors.warning;
  } else if (status === "cancelado") {
    return "#EF4444";
  } else if (status === "recusado") {
    return "#EF4444";
  } else if (status === "em_breve") {
    return "#A78BFA";
  } else if (status === "retrabalho") {
    return "#F97316";
  }

  return undefined;
}