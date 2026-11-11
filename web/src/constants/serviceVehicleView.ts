export type ServiceVehicleView = "2d" | "3d";

const STORAGE_KEY = "binotto-service-vehicle-view";

export function getServiceVehicleView(): ServiceVehicleView {
  return localStorage.getItem(STORAGE_KEY) === "3d" ? "3d" : "2d";
}

export function saveServiceVehicleView(view: ServiceVehicleView) {
  localStorage.setItem(STORAGE_KEY, view);
}
