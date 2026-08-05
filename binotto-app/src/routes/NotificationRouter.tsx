import { navigationRef } from "@/navigation/NavigationRef";

type NotificationData = {
  type?: "SERVICE_CREATED" | "SERVICE_ACCEPTED" | "SERVICE_CANCELLED";
  target_role?: "TECHNICIAN" | "WORKSHOP";
  servico_id?: number;
};

export function handleNotificationNavigation(data: NotificationData) {
  const role = data?.target_role;
  const servicoId = data?.servico_id;

  if (role === "TECHNICIAN") {

    if ((data?.type === "SERVICE_CREATED" || data?.type === "SERVICE_CANCELLED") && servicoId) {
      navigationRef.navigate("PrivateStack", {
        screen: "TechnicianTabs",
        params: {
          screen: "ServiceDetail",
          params: { serviceId: servicoId },
        },
      });

      return;
    }

    // fallback tecnico
    navigationRef.navigate("PrivateStack", {
      screen: "TechnicianTabs",
      params: {
        screen: "Dashboard",
      },
    });
  }

  if (role === "WORKSHOP") {
    if (data?.type === "SERVICE_CREATED" && servicoId) {
      navigationRef.navigate("PrivateStack", {
        screen: "WorkshopTabs",
        params: {
          screen: "ServiceDetail",
          params: { serviceId: servicoId },
        },
      });

      return;
    }

    if (data?.type === "SERVICE_ACCEPTED" && servicoId) {
      navigationRef.navigate("PrivateStack", {
        screen: "WorkshopTabs",
        params: {
          screen: "ServiceDetail",
          params: { serviceId: servicoId },
        },
      });

      return;
    }

    // fallback oficina
    navigationRef.navigate("PrivateStack", {
      screen: "WorkshopTabs",
      params: {
        screen: "Dashboard",
      },
    });

    return;
  }

  // fallback global
  navigationRef.navigate("PublicStack", {
    screen: "Login",
  });
}