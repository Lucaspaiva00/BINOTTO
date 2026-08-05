import * as ImagePicker from "expo-image-picker";

export type Photo =
  | { type: "existing"; uri: string }
  | { type: "new"; asset: ImagePicker.ImagePickerAsset }
  | null;

export type RepairType =
  | "PDR"
  | "PINTURA"
  | "TROCA"
  | "ALUMINIO_PDR"
  | "ALUMINIO_PINTURA"
  | "SEM_DANO";

export type CarPart = {
  id: string;
  labelKey: string;
};

export type CarPartLayout = {
  id: CarPart["id"];
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: {
    tl?: number;
    tr?: number;
    bl?: number;
    br?: number;
  };
};

export type PartInspection = {
  tipoReparo: RepairType;
  quantidadeAmassados: number;
  quantidadeImpactosMaior25: number;
  quantidadeImpactosMenor25: number;
  tamanhoAmassado: "P" | "M" | "G" | null;
  coeficiente: number;
  fotos: Photo[];
  observacoes: string;
};