import { GLOBAL } from "@/constants/global";
import { CarPart, CarPartLayout, PartInspection, RepairType } from "@/types/carParts";
const storage = GLOBAL.storage;

// Lista de peças do veículo (domínio)
export const CAR_PARTS: CarPart[] = [
  { id: "capo", labelKey: "carParts.hood" },
  { id: "paralama_dianteiro_esq", labelKey: "carParts.front_fender_left" },
  { id: "paralama_dianteiro_dir", labelKey: "carParts.front_fender_right" },
  { id: "porta_dianteira_esq", labelKey: "carParts.front_door_left" },
  { id: "porta_dianteira_dir", labelKey: "carParts.front_door_right" },
  { id: "coluna_esq", labelKey: "carParts.left_pillar" },
  { id: "coluna_dir", labelKey: "carParts.right_pillar" },
  { id: "porta_traseira_esq", labelKey: "carParts.rear_door_left" },
  { id: "porta_traseira_dir", labelKey: "carParts.rear_door_right" },
  { id: "lateral_esq", labelKey: "carParts.side_left" },
  { id: "lateral_dir", labelKey: "carParts.side_right" },
  { id: "tampa_superior", labelKey: "carParts.upper_tailgate" },
  { id: "tampa_inferior", labelKey: "carParts.lower_tailgate" },
  { id: "teto", labelKey: "carParts.roof" },
];

// Layout visual do carro 
export const CAR_PART_LAYOUTS: CarPartLayout[] = [
  { id: "capo", x: 92, y: 16, w: 116, h: 54, radius: { tl: 18, tr: 18, bl: 10, br: 10 }},
  { id: "paralama_dianteiro_esq", x: 42, y: 16, w: 42, h: 54, radius: { tl: 24, bl: 14 }},
  { id: "paralama_dianteiro_dir", x: 216, y: 16, w: 42, h: 54, radius: { tr: 24, br: 14 }},
  { id: "porta_dianteira_esq", x: 42, y: 76, w: 42, h: 66, radius: { tl: 8, bl: 8 }},
  { id: "porta_dianteira_dir", x: 216, y: 76, w: 42, h: 66, radius: { tr: 8, br: 8 }},
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

// Estado inicial padrão das peças
export const createInitialPartsState = (): Record<string, PartInspection> => {
  return CAR_PART_IDS.reduce((acc, id) => {
    acc[id] = {
      tipoReparo: "SEM_DANO",
      quantidadeAmassados: 0,
      quantidadeImpactosMaior25: 0,
      quantidadeImpactosMenor25: 0,
      tamanhoAmassado: null,
      coeficiente: 0,
      fotos: [],
      observacoes: "",
    };
    return acc;
  }, {} as Record<string, PartInspection>);
};

// Lista de IDs (derivada, não duplicada)
export const CAR_PART_IDS = CAR_PARTS.map((p) => p.id);

// Normaliza reparos
export const normalizeReparos = (reparos: any[]): Record<string, PartInspection> => {
  return CAR_PART_IDS.reduce((acc, id) => {
    const found = reparos?.find((r) => r.peca === id);

   const tipoReparo = found?.tipoReparo ?? found?.tipo_reparo ?? "SEM_DANO";

    acc[id] = {
      tipoReparo,
      quantidadeAmassados: found?.quantidadeAmassados ?? 0,
      quantidadeImpactosMaior25: found?.quantidadeImpactosMaior25 ?? 0,
      quantidadeImpactosMenor25: found?.quantidadeImpactosMenor25 ?? 0,
      tamanhoAmassado: found?.tamanhoAmassado ?? null,
      coeficiente: found?.coeficiente ?? 0,
      observacoes: found?.observacoes ?? "",
      fotos: mapReparoFotos(found?.fotos ?? []),
    };

    return acc;
  }, {} as Record<string, PartInspection>);
};

const mapReparoFotos = (fotos: any[] = []) => {
  return fotos
    .filter(Boolean)
    .map((photo) => {
      if (typeof photo === "string") {
        return {
          type: "existing",
          uri: photo.startsWith("http")
            ? photo
            : `${storage}/${photo}`,
        };
      }

      if (photo?.type === "new") {
        return photo;
      }

      return {
        type: "existing",
        uri: photo?.uri ?? photo?.path ?? "",
      };
    })
    .filter((p) => p.uri); // evita undefined
};