import type { RepairType } from "@/types/carParts";

export const REPAIR_TYPE_LABEL: Record<RepairType, string> = {
  SEM_DANO: "Sem dano",
  PDR: "PDR",
  PINTURA: "Pintura",
  TROCA: "Troca",
  ALUMINIO_PDR: "Alumínio PDR",
  ALUMINIO_PINTURA: "Alumínio pintura",
};

export const REPAIR_TYPE_COLOR: Record<RepairType, string> = {
  SEM_DANO: "#9CA3AF",
  PDR: "#1F8BFF",
  PINTURA: "#F97316",
  TROCA: "#E34C4C",
  ALUMINIO_PDR: "#2F8BFF",
  ALUMINIO_PINTURA: "#2F8BFF",
};

export function getRepairTypeLabel(type: string): string {
  return REPAIR_TYPE_LABEL[type as RepairType] ?? type;
}

export function getRepairTypeColor(type: string): string {
  return REPAIR_TYPE_COLOR[type as RepairType] ?? REPAIR_TYPE_COLOR.SEM_DANO;
}

export const SERVICE_REPAIR_COLORS: Record<RepairType, string> = {
  SEM_DANO: "#d1d5db",
  PDR: "#1f8bff",
  PINTURA: "#facc15",
  TROCA: "#e34c4c",
  ALUMINIO_PDR: "#1f8bff",
  ALUMINIO_PINTURA: "#facc15",
};

export const SERVICE_ALUMINUM_STRIPE = "#22c55e";
export const SERVICE_GLUE_STRIPE = "#111827";

export function serviceRepairSwatch(type: RepairType | "COLA"): string {
  if (type === "COLA") return `repeating-linear-gradient(135deg, #f8fafc 0 4px, ${SERVICE_GLUE_STRIPE} 4px 6px)`;
  const color = SERVICE_REPAIR_COLORS[type];
  return type.startsWith("ALUMINIO_")
    ? `repeating-linear-gradient(135deg, ${color} 0 4px, ${SERVICE_ALUMINUM_STRIPE} 4px 8px)`
    : color;
}
