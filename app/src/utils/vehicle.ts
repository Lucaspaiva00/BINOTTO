export function getVehicleName(vehicle: any, service?: any): string {
  const marcaModelo = [vehicle?.marca, vehicle?.modelo].filter(Boolean).join(" ");
  return (
    marcaModelo ||
    vehicle?.marca_modelo ||
    [service?.marca, service?.modelo].filter(Boolean).join(" ") ||
    service?.marca_modelo ||
    "--"
  );
}

export function resolveMediaUrl(path: string | null | undefined, storage: string) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${storage}/${path}`;
}
