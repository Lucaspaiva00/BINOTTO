export const SERVICE_COLUMNS = {
  date: "Data", workshop: "Oficina", technician: "Técnico", city: "Cidade", country: "País",
  billed: "Preço faturado", status: "Status", brand: "Marca", model: "Modelo", plate: "Placa",
  chassis: "Chassi", technicianPrice: "Preço técnico", disassembly: "Desmontagem",
  technicianPercentage: "Porcentagem técnico", commission: "Comissão empresa", notes: "Observação",
} as const;
export type ServiceColumn = keyof typeof SERVICE_COLUMNS;
export type ColumnPreference = { id: ServiceColumn; visible: boolean };
export type VehicleReference = "placa" | "chassi" | "ambos";
const COLUMN_KEY = "binotto-service-columns";
const REFERENCE_KEY = "binotto-service-reference";
const ids = Object.keys(SERVICE_COLUMNS) as ServiceColumn[];

export function getServiceColumns(): ColumnPreference[] {
  const defaults = ids.map((id, index) => ({ id, visible: index < 7 }));
  try {
    const saved = JSON.parse(localStorage.getItem(COLUMN_KEY) ?? "null");
    if (!Array.isArray(saved)) return defaults;
    const seen = new Set<ServiceColumn>();
    const result: ColumnPreference[] = [];
    for (const column of saved) {
      if (!column || !ids.includes(column.id) || seen.has(column.id) || typeof column.visible !== "boolean") continue;
      seen.add(column.id);
      result.push({ id: column.id, visible: column.visible });
    }
    return [...result, ...defaults.filter(column => !seen.has(column.id))];
  } catch {
    return defaults;
  }
}

export function saveServiceColumns(columns: ColumnPreference[]) {
  localStorage.setItem(COLUMN_KEY, JSON.stringify(columns));
}

export function getVehicleReference(): VehicleReference {
  const saved = localStorage.getItem(REFERENCE_KEY);
  return saved === "placa" || saved === "chassi" || saved === "ambos" ? saved : "placa";
}

export function saveVehicleReference(reference: VehicleReference) {
  localStorage.setItem(REFERENCE_KEY, reference);
}

export function normalizeVehicleReference(value: string): string {
  return value.replace(/\s/g, "").toUpperCase();
}
