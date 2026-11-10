import { CAR_PART_LAYOUTS, getCarPartLabel } from "@/constants/carParts";
import { getRepairTypeColor } from "@/constants/repairTypes";
import type { PartInspection } from "@/types/carParts";

interface Props {
  partsState: Record<string, PartInspection>;
  selectedPartId: string | null;
  onSelectPart: (id: string) => void;
  canEdit?: boolean;
  square?: boolean;
  partOrder?: readonly string[];
  partLabel?: (id: string) => string;
}

/** Vista superior 2D: as mesmas IDs das peças do modelo 3D e dos formulários. */
export function CarDiagram2D({ partsState, selectedPartId, onSelectPart, canEdit = true, square = false, partOrder, partLabel = getCarPartLabel }: Props) {
  return (
    <div className={`rounded-xl border border-border bg-white p-3 ${square ? "aspect-square w-full" : "sm:p-5"}`}>
      <svg viewBox="0 0 300 405" role="img" aria-label="Vista superior 2D do veículo, com peças selecionáveis" className={`mx-auto block w-full ${square ? "h-full" : "max-w-[420px]"}`}>
        {[58, 242].flatMap((x) => [101, 291].map((y) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="26" fill="#e1e1e1" />
            <circle cx={x} cy={y} r="17" fill="white" />
          </g>
        )))}
        {CAR_PART_LAYOUTS.map((part, index) => {
          const number = (partOrder?.indexOf(part.id) ?? index) + 1;
          const value = partsState[part.id];
          const selected = selectedPartId === part.id;
          const color = value?.assessed === false || !value?.repairType ? "#f8fafc" : getRepairTypeColor(value.repairType);
          return (
            <g key={part.id} role="button" tabIndex={canEdit ? 0 : -1} aria-label={`Peça ${number}: ${partLabel(part.id)}`} aria-pressed={selected}
              onClick={() => canEdit && onSelectPart(part.id)}
              onKeyDown={(event) => { if (canEdit && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelectPart(part.id); } }}
              className={canEdit ? "cursor-pointer outline-none" : ""}>
              <rect x={part.x} y={part.y} width={part.w} height={part.h} rx={Math.min(12, part.w / 5)} fill={color} stroke={selected ? "#111827" : "#b8bec6"} strokeWidth={selected ? 3.5 : 2.5} />
              <circle cx={part.x + part.w / 2} cy={part.y + part.h / 2} r="11" fill="white" stroke="#555" strokeWidth="1.2" />
              <text x={part.x + part.w / 2} y={part.y + part.h / 2 + 4} fontSize="11" fill="#222" textAnchor="middle">{number}</text>
            </g>
          );
        })}
      </svg>
      <p className={square ? "sr-only" : "mt-2 text-center text-xs text-slate-600"}>Vista superior • Clique em uma peça para editar a avaliação</p>
    </div>
  );
}
