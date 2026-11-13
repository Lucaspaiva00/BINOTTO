export const PERICIA_COLUMNS = { date: "Data", workshop: "Oficina", plate: "Placa", model: "Modelo", value: "Valor", status: "Status" };
export const FINANCE_COLUMNS = { date: "Data", number: "Número", workshop: "Oficina/Cliente", city: "Cidade", country: "País", value: "Valor", vat: "IVA", accounting: "Contabilidade" };

export function getTableColumns<T extends string>(key: string, labels: Record<T, string>) {
  const defaults = Object.keys(labels) as T[];
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    return Array.isArray(saved) ? defaults.filter(id => saved.includes(id)) : defaults;
  } catch {
    return defaults;
  }
}
