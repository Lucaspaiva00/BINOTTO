import type { ServiceLog } from "@/types/service";

interface LogField {
  label: string;
  value: string;
}

function formatBoolean(value: unknown): string {
  return value ? "Sim" : "Não";
}

function formatPayloadDate(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatPayloadAmount(value: unknown, moeda: unknown): string | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;

  const currency = typeof moeda === "string" && moeda ? moeda : "EUR";
  return numeric.toLocaleString("pt-BR", { style: "currency", currency });
}

function humanizeLabel(key: string): string {
  const label = key.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatPayloadValue(key: string, value: unknown, payload: Record<string, unknown>): string {
  if (typeof value === "boolean") return formatBoolean(value);

  if (key.toLowerCase().includes("data")) {
    const date = formatPayloadDate(value);
    if (date) return date;
  }

  if (key.toLowerCase().startsWith("valor") || key.toLowerCase().startsWith("preco")) {
    const amount = formatPayloadAmount(value, payload.moeda);
    if (amount) return amount;
  }

  if (Array.isArray(value)) {
    if (key.toLowerCase() === "tecnicos_preferidos_notificados") {
      return value.length > 0 ? String(value.length) : "Nenhum";
    }
    return value.length > 0 ? value.join(", ") : "Nenhum";
  }

  return String(value);
}

function extractCityField(payload: Record<string, unknown>): { field: LogField | null; usedKeys: Set<string> } {
  const usedKeys = new Set<string>();

  const cityKey = Object.keys(payload).find((k) => k.toLowerCase().startsWith("cidade"));
  const cityValue = cityKey ? payload[cityKey] : null;
  if (!cityKey || typeof cityValue !== "string" || !cityValue) return { field: null, usedKeys };

  usedKeys.add(cityKey);

  const countryKey = Object.keys(payload).find(
    (k) => k.toLowerCase() === cityKey.toLowerCase().replace("cidade", "pais"),
  );
  const countryValue = countryKey ? payload[countryKey] : null;

  let value = cityValue;
  if (countryKey && typeof countryValue === "string" && countryValue) {
    usedKeys.add(countryKey);
    value = `${cityValue} (${countryValue})`;
  }

  return { field: { label: "Cidade", value }, usedKeys };
}

function extractPeriodField(payload: Record<string, unknown>): { field: LogField | null; usedKeys: Set<string> } {
  const usedKeys = new Set<string>();

  const start = "data_inicio" in payload ? formatPayloadDate(payload.data_inicio) : null;
  if (!start) return { field: null, usedKeys };

  usedKeys.add("data_inicio");

  let value = start;
  if ("data_fim" in payload) {
    usedKeys.add("data_fim");
    const end = formatPayloadDate(payload.data_fim);
    if (end && end !== start) value = `${start} a ${end}`;
  }

  return { field: { label: "Período", value }, usedKeys };
}

export function getServiceLogFields(log: ServiceLog): LogField[] {
  if (!log.payload) return [];

  const { field: cityField, usedKeys: cityKeys } = extractCityField(log.payload);
  const { field: periodField, usedKeys: periodKeys } = extractPeriodField(log.payload);
  const usedKeys = new Set([...cityKeys, ...periodKeys]);

  const fields = Object.entries(log.payload)
    .filter(([key, value]) => !usedKeys.has(key) && value !== null && value !== undefined)
    .map(([key, value]) => ({
      label: humanizeLabel(key),
      value: formatPayloadValue(key, value, log.payload!),
    }));

  const specialFields = [cityField, periodField].filter((f): f is LogField => f !== null);

  return [...specialFields, ...fields];
}
