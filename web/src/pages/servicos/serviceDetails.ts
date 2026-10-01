import { CAR_PARTS } from "@/constants/carParts";
import type { PartInspection } from "@/types/carParts";
import type { Service, ServiceVehicleRepair } from "@/types/service";

export const VEHICLE_PHOTOS = [
  { key: "frente_motorista", label: "Frente motorista" },
  { key: "traseira_carona", label: "Traseira carona" },
  { key: "placa", label: "Placa" },
  { key: "chassi", label: "Chassi" },
  { key: "marca", label: "Marca (captura)" },
  { key: "modelo", label: "Modelo (captura)" },
] as const;
export type VehiclePhotoKey = (typeof VEHICLE_PHOTOS)[number]["key"];
export type VehiclePhotoMap = Record<VehiclePhotoKey, File | string | null>;
export function emptyVehiclePhotos(): VehiclePhotoMap {
  return { frente_motorista: null, traseira_carona: null, placa: null, chassi: null, marca: null, modelo: null };
}

export const PRICE_KEYS = [
  { key: "oficina_desmontagem", label: "Oficina — desmontagem" },
  { key: "oficina_carro", label: "Oficina — carro" },
  { key: "tecnico_desmontagem", label: "Técnico — desmontagem" },
  { key: "tecnico_carro", label: "Técnico — carro" },
] as const;
export type DetailedPriceKey = (typeof PRICE_KEYS)[number]["key"];
/** Propostas do técnico: independentes da comissão e dos valores contratados. */
export const SUGGESTION_KEYS = [
  { key: "tecnico_sugestao_carro", label: "Sugestão técnico — reparação" },
  { key: "tecnico_sugestao_desmontagem", label: "Sugestão técnico — desmontagem" },
] as const;
export type SuggestionPriceKey = (typeof SUGGESTION_KEYS)[number]["key"];
export type DetailedPrice = { tipo: "valor" | "porcentagem"; valor: string; visivel_app: boolean; habilitado_preenchimento_app: boolean };
export type DetailedPrices = Record<DetailedPriceKey | SuggestionPriceKey, DetailedPrice>;
export function defaultPrices(amount = 0, techAmount: number | null = null, techPercentage: number | null = null): DetailedPrices {
  return {
    oficina_desmontagem: { tipo: "valor", valor: "0", visivel_app: false, habilitado_preenchimento_app: false },
    oficina_carro: { tipo: "valor", valor: String(amount), visivel_app: false, habilitado_preenchimento_app: false },
    tecnico_desmontagem: { tipo: "valor", valor: "0", visivel_app: false, habilitado_preenchimento_app: false },
    tecnico_carro: { tipo: techPercentage !== null ? "porcentagem" : "valor", valor: String(techPercentage ?? techAmount ?? 0), visivel_app: false, habilitado_preenchimento_app: false },
    tecnico_sugestao_carro: { tipo: "valor", valor: "0", visivel_app: false, habilitado_preenchimento_app: false },
    tecnico_sugestao_desmontagem: { tipo: "valor", valor: "0", visivel_app: false, habilitado_preenchimento_app: false },
  };
}
export function pricesFromService(service: Service): DetailedPrices {
  const defaults = defaultPrices(service.totalAmount, service.technicianAmount, service.technicianPercentage);
  for (const { key } of [...PRICE_KEYS, ...SUGGESTION_KEYS]) {
    const supplied = service.detailedPrices?.[key];
    if (supplied) {
      const isOffice = key === "oficina_carro" || key === "oficina_desmontagem";
      const item = key.endsWith("desmontagem") ? "desmontagem" : "carro";
      const normalizedValue = isOffice && supplied.tipo === "porcentagem"
        ? service.calculatedPrices?.[item]?.oficina ?? 0
        : supplied.valor ?? 0;
      defaults[key] = {
        tipo: isOffice ? "valor" : supplied.tipo,
        valor: String(normalizedValue),
        visivel_app: supplied.visivel_app ?? false,
        habilitado_preenchimento_app: supplied.habilitado_preenchimento_app ?? false,
      };
    }
  }
  return defaults;
}
export const SERVICE_PARTS_ORDER = [
  "capo", "paralama_dianteiro_esq", "porta_dianteira_esq", "porta_traseira_esq",
  "lateral_esq", "coluna_esq", "tampa_inferior", "tampa_superior", "lateral_dir",
  "porta_traseira_dir", "porta_dianteira_dir", "paralama_dianteiro_dir", "coluna_dir", "teto",
] as const;

export function normalizeServiceRepairs(repairs: ServiceVehicleRepair[] = []): Record<string, PartInspection> {
  const result = Object.fromEntries(CAR_PARTS.map(part => [part.id, {
    repairType: "SEM_DANO", dentCount: 0, impactsOver25: 0, impactsUnder25: 0,
    dentsUpTo2: 0, dentsUpTo5: 0, dentsOver5: 0, notes: "", photos: [],
  }])) as Record<string, PartInspection>;
  for (const repair of repairs) {
    if (!repair.peca || !result[repair.peca]) continue;
    const state = result[repair.peca];
    result[repair.peca] = {
      ...state,
      repairType: (repair.tipoReparo ?? state.repairType) as PartInspection["repairType"],
      dentCount: repair.quantidadeAmassados ?? 0,
      impactsOver25: repair.quantidadeImpactosMaior25 ?? 0,
      impactsUnder25: repair.quantidadeImpactosMenor25 ?? 0,
      dentsUpTo2: repair.amassadosAte2 ?? 0,
      dentsUpTo5: repair.amassadosAte5 ?? 0,
      dentsOver5: repair.amassadosAcima5 ?? 0,
      notes: repair.observacoes ?? "",
      photos: repair.fotos ?? [],
    };
  }
  return result;
}

export function buildServiceDetailsFormData(form: {
  plate: string; chassis: string; brand: string; vehicleModel: string; notes: string;
  inspectionType: "simples" | "completa"; vehiclePhotos: VehiclePhotoMap; detailedPrices: DetailedPrices;
}, partsState: Record<string, PartInspection>): FormData {
  const data = new FormData();
  data.append("placa", form.plate.trim());
  data.append("chassi", form.chassis.trim());
  data.append("marca", form.brand.trim());
  data.append("modelo", form.vehicleModel.trim());
  data.append("observacoes", form.notes.trim());
  data.append("tipo_pericia", form.inspectionType);
  data.append("fotos_veiculo_existentes", JSON.stringify(Object.fromEntries(
    Object.entries(form.vehiclePhotos).map(([key, photo]) => [key, typeof photo === "string" ? photo : null]),
  )));
  Object.entries(form.vehiclePhotos).forEach(([key, photo]) => {
    if (photo instanceof File) data.append(`fotos_veiculo[${key}]`, photo);
  });
  data.append("precos_detalhados", JSON.stringify(Object.fromEntries(
    [...PRICE_KEYS, ...SUGGESTION_KEYS].map(({ key }) => {
      const current = form.detailedPrices[key];
      const isOffice = key === "oficina_carro" || key === "oficina_desmontagem";
      const isCommission = key === "tecnico_carro" || key === "tecnico_desmontagem";
      const isSuggestion = key === "tecnico_sugestao_carro" || key === "tecnico_sugestao_desmontagem";
      return [key, {
        ...current,
        tipo: isOffice || isSuggestion ? "valor" : current.tipo,
        valor: parseAmount(current.valor),
        // A tela nova não expõe permissões extras: comissão é apenas calculada no painel.
        habilitado_preenchimento_app: isCommission ? false : current.habilitado_preenchimento_app,
        // Sugestão do técnico usa apenas o botão "Visível" para aparecer/preencher no APP técnico.
        visivel_app: isSuggestion ? false : current.visivel_app,
      }];
    }),
  )));
  data.append("reparos_execucao", JSON.stringify(SERVICE_PARTS_ORDER.map((id) => {
    const part = partsState[id];
    return {
      peca: id,
      tipoReparo: part.repairType,
      amassadosAte2: part.dentsUpTo2 ?? 0,
      amassadosAte5: part.dentsUpTo5 ?? 0,
      amassadosAcima5: part.dentsOver5 ?? 0,
      observacoes: part.notes,
      fotos: part.photos.filter((photo): photo is string => typeof photo === "string"),
    };
  })));
  for (const id of SERVICE_PARTS_ORDER) {
    for (const photo of partsState[id].photos) {
      if (photo instanceof File) data.append(`fotos_reparos[${id}][]`, photo);
    }
  }
  return data;
}
export function parseAmount(input: string): number {
  const trimmed = input.trim();
  if (trimmed === "") return 0;
  const normalized = trimmed.includes(",") ? trimmed.replace(/\./g, "").replace(",", ".") : trimmed;
  return Number(normalized);
}
/** Só apresenta valores derivados, sem modificar os quatro preços originais. */
export function resolveDetailedPrices(prices: DetailedPrices): Record<"carro" | "desmontagem", { oficina: number; tecnico: number }> | null {
  const out = {} as Record<"carro" | "desmontagem", { oficina: number; tecnico: number }>;
  for (const item of ["carro", "desmontagem"] as const) {
    const office = prices[`oficina_${item}`];
    const tech = prices[`tecnico_${item}`];
    const a = parseAmount(office.valor);
    const b = parseAmount(tech.valor);
    if (![a, b].every(v => Number.isFinite(v) && v >= 0)) return null;
    if ((office.tipo === "porcentagem" && (a <= 0 || a > 100)) || (tech.tipo === "porcentagem" && b > 100)) return null;
    if (office.tipo === "porcentagem" && tech.tipo === "porcentagem") return null;
    const rounded = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
    out[item] = office.tipo === "valor" && tech.tipo === "porcentagem"
      ? { oficina: rounded(a), tecnico: rounded(a * b / 100) }
      : office.tipo === "porcentagem" && tech.tipo === "valor"
        ? { oficina: rounded(b * 100 / a), tecnico: rounded(b) }
        : { oficina: rounded(a), tecnico: rounded(b) };
    if (out[item].oficina > 99999999 || out[item].tecnico > 99999999) return null;
  }
  return out;
}

export function validateDetails(form: { detailedPrices: DetailedPrices; vehiclePhotos: VehiclePhotoMap }, parts: Record<string, PartInspection>): string | null {
  for (const { key, label } of PRICE_KEYS) {
    const price = form.detailedPrices[key];
    const value = parseAmount(price.valor);
    if (!Number.isFinite(value) || value < 0 || (price.tipo === "porcentagem" && value > 100)) return `Revise ${label}: valor inválido.`;
  }
  for (const { key, label } of SUGGESTION_KEYS) {
    const suggested = form.detailedPrices[key];
    const amount = parseAmount(suggested.valor);
    if (suggested.tipo !== "valor" || !Number.isFinite(amount) || amount < 0 || amount > 99999999) return `Revise ${label}: somente um valor monetário válido é permitido.`;
  }
  if (resolveDetailedPrices(form.detailedPrices) === null) return "Defina uma base fixa e apenas um percentual por item. No cálculo inverso, o percentual da oficina deve ser maior que zero.";
  for (const photo of Object.values(form.vehiclePhotos)) {
    if (photo instanceof File && photo.size > 8 * 1024 * 1024) return "Cada fotografia deve ter até 8 MB.";
  }
  for (const id of SERVICE_PARTS_ORDER) {
    const part = parts[id];
    for (const count of [part.dentsUpTo2, part.dentsUpTo5, part.dentsOver5]) {
      if (!Number.isInteger(count ?? 0) || (count ?? 0) < 0 || (count ?? 0) > 9999) return "Os campos de amassados devem conter até quatro dígitos.";
    }
    if (part.photos.length > 3) return "Cada peça admite no máximo três fotografias.";
  }
  return null;
}
