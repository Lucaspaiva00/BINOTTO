import { REPAIR_TYPE_LABEL, getRepairTypeColor } from "@/constants/repairTypes";
import type { PartInspection, RepairType } from "@/types/carParts";

interface RepairSummaryProps {
  partsState: Record<string, PartInspection>;
}

export function RepairSummary({ partsState }: RepairSummaryProps) {
  const counts = Object.values(partsState).reduce<Record<string, number>>((acc, part) => {
    if (part.repairType === "SEM_DANO") return acc;
    acc[part.repairType] = (acc[part.repairType] ?? 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts);

  if (entries.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold mb-2">Resumo de reparos</h3>
        <p className="text-sm text-muted-foreground">Nenhum reparo registrado.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <h3 className="text-sm font-semibold mb-3">Resumo de reparos</h3>
      <div className="flex flex-wrap gap-2">
        {entries.map(([type, count]) => {
          const repairType = type as RepairType;
          const color = getRepairTypeColor(repairType);

          return (
            <div
              key={type}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor: color, color }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              {REPAIR_TYPE_LABEL[repairType] ?? type}: {count}
            </div>
          );
        })}
      </div>
    </div>
  );
}
