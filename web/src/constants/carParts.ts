import type { CarPart, CarPartLayout } from "@/types/carParts";

export const CAR_PARTS: CarPart[] = [
  { id: "capo", label: "Capô" },
  { id: "paralama_dianteiro_esq", label: "Para-lama dianteiro esquerdo" },
  { id: "paralama_dianteiro_dir", label: "Para-lama dianteiro direito" },
  { id: "porta_dianteira_esq", label: "Porta dianteira esquerda" },
  { id: "porta_dianteira_dir", label: "Porta dianteira direita" },
  { id: "coluna_esq", label: "Coluna esquerda" },
  { id: "coluna_dir", label: "Coluna direita" },
  { id: "porta_traseira_esq", label: "Porta traseira esquerda" },
  { id: "porta_traseira_dir", label: "Porta traseira direita" },
  { id: "lateral_esq", label: "Lateral esquerda" },
  { id: "lateral_dir", label: "Lateral direita" },
  { id: "tampa_superior", label: "Tampa superior" },
  { id: "tampa_inferior", label: "Tampa inferior" },
  { id: "teto", label: "Teto" },
];

export const CAR_PART_LAYOUTS: CarPartLayout[] = [
  { id: "capo", x: 92, y: 16, w: 116, h: 54, radius: { tl: 18, tr: 18, bl: 10, br: 10 } },
  { id: "paralama_dianteiro_esq", x: 42, y: 16, w: 42, h: 54, radius: { tl: 24, bl: 14 } },
  { id: "paralama_dianteiro_dir", x: 216, y: 16, w: 42, h: 54, radius: { tr: 24, br: 14 } },
  { id: "porta_dianteira_esq", x: 42, y: 76, w: 42, h: 66, radius: { tl: 8, bl: 8 } },
  { id: "porta_dianteira_dir", x: 216, y: 76, w: 42, h: 66, radius: { tr: 8, br: 8 } },
  { id: "coluna_esq", x: 42, y: 148, w: 42, h: 42, radius: { tr: 6, br: 6 } },
  { id: "coluna_dir", x: 216, y: 148, w: 42, h: 42, radius: { tl: 6, bl: 6 } },
  { id: "porta_traseira_esq", x: 42, y: 196, w: 42, h: 72, radius: { tl: 8, bl: 8 } },
  { id: "porta_traseira_dir", x: 216, y: 196, w: 42, h: 72, radius: { tr: 8, br: 8 } },
  { id: "lateral_esq", x: 42, y: 274, w: 42, h: 56, radius: { tl: 12, bl: 12 } },
  { id: "lateral_dir", x: 216, y: 274, w: 42, h: 56, radius: { tr: 12, br: 12 } },
  { id: "tampa_superior", x: 88, y: 296, w: 124, h: 40, radius: { tl: 6, tr: 6, bl: 10, br: 10 } },
  { id: "tampa_inferior", x: 88, y: 342, w: 124, h: 40, radius: { bl: 18, br: 18 } },
  { id: "teto", x: 90, y: 76, w: 120, h: 212, radius: { tl: 20, tr: 20, bl: 14, br: 14 } },
];

export const CAR_PART_IDS = CAR_PARTS.map((p) => p.id);

export const TECH_PHOTO_SLOTS = [
  { key: "diagonalFrontDriver", label: "Dianteira diagonal motorista" },
  { key: "diagonalRearPassenger", label: "Traseira diagonal passageiro" },
  { key: "plateOrChassis", label: "Placa ou chassi" },
  { key: "workOrder", label: "Ordem de serviço" },
] as const;

export const COMPLETE_PHOTO_SLOTS = [
  { key: "document", label: "Documento" },
  { key: "km", label: "Quilometragem" },
  { key: "chassis", label: "Chassi" },
] as const;

export function getCarPartLabel(partId: string): string {
  return CAR_PARTS.find((p) => p.id === partId)?.label ?? partId;
}
