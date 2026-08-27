import { CAR_PART_LAYOUTS, CAR_PARTS, getCarPartLabel } from "@/constants/carParts";
import { getRepairTypeColor } from "@/constants/repairTypes";
import type { CarPartLayout, PartInspection } from "@/types/carParts";
import { cn } from "@/lib/utils";

interface CarDiagramProps {
  partsState: Record<string, PartInspection>;
  selectedPartId: string | null;
  onSelectPart: (partId: string) => void;
}

function partTextColor(item?: PartInspection): string {
  return !item || item.repairType === "SEM_DANO" ? "#242A34" : "#FFFFFF";
}

function borderRadiusStyle(radius?: CarPartLayout["radius"]) {
  if (!radius) return undefined;
  return {
    borderTopLeftRadius: radius.tl ?? 8,
    borderTopRightRadius: radius.tr ?? 8,
    borderBottomLeftRadius: radius.bl ?? 8,
    borderBottomRightRadius: radius.br ?? 8,
  };
}

export function CarDiagram({ partsState, selectedPartId, onSelectPart }: CarDiagramProps) {
  return (
    <div className="relative mx-auto w-full max-w-75 aspect-300/400 bg-muted/40 rounded-2xl border border-border">
      {CAR_PART_LAYOUTS.map((layout) => {
        const state = partsState[layout.id];
        const part = CAR_PARTS.find((p) => p.id === layout.id);
        const selected = selectedPartId === layout.id;
        const canOpen = state && state.repairType !== "SEM_DANO";

        if (!part) return null;

        return (
          <button
            key={layout.id}
            type="button"
            disabled={!canOpen}
            onClick={() => canOpen && onSelectPart(layout.id)}
            title={getCarPartLabel(layout.id)}
            className={cn(
              "absolute flex items-center justify-center text-[9px] leading-tight font-medium text-center px-0.5 transition-all",
              canOpen ? "cursor-pointer hover:brightness-95" : "cursor-default opacity-80",
              selected && "ring-2 ring-[hsl(var(--app-accent))] ring-offset-1 z-10",
            )}
            style={{
              left: `${(layout.x / 300) * 100}%`,
              top: `${(layout.y / 400) * 100}%`,
              width: `${(layout.w / 300) * 100}%`,
              height: `${(layout.h / 400) * 100}%`,
              backgroundColor: getRepairTypeColor(state?.repairType ?? "SEM_DANO"),
              color: partTextColor(state),
              ...borderRadiusStyle(layout.radius),
            }}
          >
            <span className="pointer-events-none line-clamp-3">{part.label.split(" ").slice(0, 2).join(" ")}</span>
          </button>
        );
      })}
    </div>
  );
}
