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
  SEM_DANO: "#D7DDE5",
  PDR: "#1F8BFF",
  PINTURA: "#E8A91E",
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
