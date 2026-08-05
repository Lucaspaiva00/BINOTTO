export function formatCurrency(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

export function parseCurrencyInput(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
