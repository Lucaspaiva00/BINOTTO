export interface InspectionData {
  placa: string;
  chassi: string;
  marca_modelo: string;
  moeda: "BRL" | "EUR";
  precoTotal: string;
  valorPericia: string;
   inserirValor: boolean,
}

export interface ExecutionData {
  placa: string;
  chassi: string;
  marcaModelo: string;
  precoTotal: string;
}