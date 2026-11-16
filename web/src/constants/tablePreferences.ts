export const PERICIA_COLUMNS = { date: "Data", workshop: "Oficina", inspector: "Perito", city: "Cidade", country: "País", value: "Preço", brand: "Marca", model: "Modelo", plate: "Placa", chassis: "Chassi", technicianPrice: "Preço técnico", disassembly: "Desmontagem", notes: "Observação", status: "Status" };
export const FINANCE_COLUMNS = { date: "Data", number: "Número", workshop: "Cliente", city: "Cidade", country: "País", value: "Valor", vat: "IVA", accounting: "Contabilidade" };

export const PAYABLE_COLUMNS = { ...FINANCE_COLUMNS, workshop: "Técnico" };

export function getTableColumns<T extends string>(key: string, labels: Record<T, string>) {
  const defaults = Object.keys(labels) as T[];
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    return Array.isArray(saved) ? [...new Set(saved.filter((id): id is T => defaults.includes(id)))] : defaults;
  } catch {
    return defaults;
  }
}
