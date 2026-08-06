export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export function endOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export function formatDate(isoDate?: string | null): string {
  if (!isoDate) return "-";

  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-BR");
}
