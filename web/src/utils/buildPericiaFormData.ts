import { CAR_PART_IDS } from "@/constants/carParts";
import type { CreatePericiaPayload, PartInspection } from "@/types/carParts";

function appendPhotoMap(formData: FormData, field: string, photos: Record<string, File | null>) {
  Object.entries(photos).forEach(([key, file]) => {
    if (file) {
      formData.append(`${field}[${key}]`, file);
    }
  });
}

export function buildPericiaFormData(payload: CreatePericiaPayload): FormData {
  const formData = new FormData();

  formData.append("oficina_id", String(payload.workshopId));
  if (payload.technicianId) {
    formData.append("tecnico_id", String(payload.technicianId));
  }

  formData.append("placa", payload.licensePlate.trim());
  formData.append("chassi", payload.chassis.trim());
  formData.append("marca_modelo", payload.model.trim());
  formData.append("tipo", payload.tipo);

  if (payload.tipo === "simples" && payload.includeValue && payload.suggestedPrice != null) {
    formData.append("preco_sugerido", String(payload.suggestedPrice));
  }

  if (payload.tipo === "completa" && payload.includeValue && payload.inspectionValue != null) {
    formData.append("valor_pericia", String(payload.inspectionValue));
  }

  appendPhotoMap(formData, "fotos", payload.photos);

  if (payload.tipo === "completa") {
    appendPhotoMap(formData, "fotos_pericia_completa", payload.completePhotos);
  }

  const repairs = CAR_PART_IDS.map((partId) => {
    const part = payload.partsState[partId];
    return {
      peca: partId,
      tipoReparo: part.repairType,
      quantidadeAmassados: part.dentCount,
      quantidadeImpactosMaior25: part.impactsOver25,
      quantidadeImpactosMenor25: part.impactsUnder25,
      tamanhoAmassado: null,
      coeficiente: 0,
      observacoes: part.notes,
    };
  });

  formData.append("reparos_necessarios", JSON.stringify(repairs));

  Object.entries(payload.partsState).forEach(([partId, part]) => {
    part.photos.forEach((photo) => {
      if (photo instanceof File) {
        formData.append(`fotos_reparos[${partId}][]`, photo);
      }
    });
  });

  return formData;
}

export function createInitialPartsState(): Record<string, PartInspection> {
  return CAR_PART_IDS.reduce(
    (acc, id) => {
      acc[id] = {
        repairType: "SEM_DANO",
        dentCount: 0,
        impactsOver25: 0,
        impactsUnder25: 0,
        notes: "",
        photos: [],
      };
      return acc;
    },
    {} as Record<string, PartInspection>,
  );
}
