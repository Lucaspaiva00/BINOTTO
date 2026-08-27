import { CAR_PART_IDS } from "@/constants/carParts";
import type { PartInspection, RepairType } from "@/types/carParts";
import type { PericiaRepair } from "@/types/pericia";

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

export function normalizeReparos(repairs: PericiaRepair[] = []): Record<string, PartInspection> {
  return CAR_PART_IDS.reduce(
    (acc, id) => {
      const found = repairs.find((r) => r.part === id);
      const repairType = (found?.repairType ?? "SEM_DANO") as RepairType;

      acc[id] = {
        repairType,
        dentCount: found?.dentCount ?? 0,
        impactsOver25: found?.impactsOver25 ?? 0,
        impactsUnder25: found?.impactsUnder25 ?? 0,
        notes: found?.notes ?? "",
        photos: (found?.photos ?? []).filter(Boolean),
      };

      return acc;
    },
    {} as Record<string, PartInspection>,
  );
}
