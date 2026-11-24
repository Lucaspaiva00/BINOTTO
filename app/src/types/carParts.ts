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

export type PartSpecification = {
  amassadosMenor25?: number | null;
  amassados25a50?: number | null;
  amassadosMaior50?: number | null;
  percentual?: number | null;
  ut?: number | null;
  cola?: boolean;
  aluminio?: boolean;
  total?: number | null;
};

export type PartInspection = {
  especificacoes?: PartSpecification;
  tipoReparo: RepairType;
  quantidadeAmassados: number;
  quantidadeImpactosMaior25: number;
  quantidadeImpactosMenor25: number;
  amassadosAte2?: number;
  amassadosAte5?: number;
  amassadosAcima5?: number;
  avaliada?: boolean;
  tamanhoAmassado: "P" | "M" | "G" | null;
  coeficiente: number;
  fotos: Photo[];
  observacoes: string;
};