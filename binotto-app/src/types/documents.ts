export type DocumentItem = {
  id: string;
  name: string;
  uri: string;
  mimeType?: string;
  size?: number;
  uploaded?: boolean;
  type?: string;
};

export type DocumentType =
  | "identidade"
  | "passaporte"
  | "doc_empresa"
  | "doc_ext";