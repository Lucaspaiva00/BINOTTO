import { CAR_PART_LAYOUTS, getCarPartLabel } from "@/constants/carParts";
import { getRepairTypeColor } from "@/constants/repairTypes";
import type { PartInspection } from "@/types/carParts";

interface Props {
  partsState: Record<string, PartInspection>;
  selectedPartId: string | null;
  onSelectPart: (id: string) => void;
  canEdit?: boolean;
  square?: boolean;
  layout?: "classic" | "separated";
  partOrder?: readonly string[];
  partLabel?: (id: string) => string;
}

// A carroceria separada usa as mesmas IDs da vista 3D e da tabela.
const LEFT_BODY_PANELS = [
  { id: "paralama_dianteiro", path: "M12 22 Q34 22 48 32 Q60 42 61 105 L12 106 V101 C43 97 43 58 12 55 Z", x: 47, y: 53 },
  { id: "porta_dianteira", path: "M12 114 H59 L82 143 Q92 155 92 183 H12 Z", x: 45, y: 151 },
  { id: "porta_traseira", path: "M12 191 H92 V247 H12 Z", x: 51, y: 219 },
  { id: "lateral", path: "M12 255 H92 C91 285 63 301 55 345 Q53 357 12 357 V309 C45 303 44 264 12 261 Z", x: 44, y: 317 },
  { id: "coluna", path: "M101 105 H115 V248 H101 Z", x: 108, y: 178 },
];

const SEPARATED_PANELS = [
  ...LEFT_BODY_PANELS.map(panel => ({ ...panel, id: `${panel.id}_esq`, transform: undefined })),
  ...LEFT_BODY_PANELS.map(panel => ({ ...panel, id: `${panel.id}_dir`, transform: "translate(300 0) scale(-1 1)", x: 300 - panel.x })),
  { id: "capo", path: "M101 95 L104 37 Q106 12 126 12 H174 Q194 12 196 37 L199 95 Z", x: 150, y: 55 },
  { id: "teto", path: "M120 140 H180 V216 H120 Z", x: 150, y: 178 },
  { id: "tampa_superior", path: "M111 252 H189 L191 271 H109 Z", x: 150, y: 261 },
  { id: "tampa_inferior", path: "M109 279 H191 L187 324 Q185 335 166 335 H134 Q115 335 113 324 Z", x: 150, y: 306 },
];

/** Vista superior 2D: as mesmas IDs das peças do modelo 3D e dos formulários. */
export function CarDiagram2D({ partsState, selectedPartId, onSelectPart, canEdit = true, square = false, layout = "classic", partOrder, partLabel = getCarPartLabel }: Props) {
  const separated = layout === "separated";
  const panels = separated ? SEPARATED_PANELS : CAR_PART_LAYOUTS;

  return (
    <div className={`rounded-xl border border-border p-3 ${separated ? "bg-slate-950" : "bg-white"} ${square ? "aspect-square w-full" : "sm:p-5"}`}>
      <svg viewBox={separated ? "0 0 300 369" : "0 0 300 405"} role={separated ? "group" : "img"} aria-label="Vista superior 2D do veículo, com peças selecionáveis" className={`mx-auto block w-full ${square ? "h-full" : "max-w-[420px]"}`}>
        {separated ? (
          <g aria-hidden="true" fill="#1e293b" stroke="#64748b" strokeWidth="1.3">
            <path d="M117 106 H183 L180 137 H120 Z M120 219 H180 L184 248 H116 Z" />
          </g>
        ) : [58, 242].flatMap((x) => [101, 291].map((y) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="26" fill="#e1e1e1" />
            <circle cx={x} cy={y} r="17" fill="white" />
          </g>
        )))}
        {panels.map((part, index) => {
          const number = (partOrder?.indexOf(part.id) ?? index) + 1;
          const value = partsState[part.id];
          const selected = selectedPartId === part.id;
          const color = value?.assessed === false || !value?.repairType ? "#f8fafc" : getRepairTypeColor(value.repairType);
          const x = "path" in part ? part.x : part.x + part.w / 2;
          const y = "path" in part ? part.y : part.y + part.h / 2;
          return (
            <g key={part.id} role="button" tabIndex={canEdit ? 0 : -1} aria-label={`Peça ${number}: ${partLabel(part.id)}`} aria-pressed={selected}
              aria-disabled={!canEdit}
              onClick={() => canEdit && onSelectPart(part.id)}
              onKeyDown={(event) => { if (canEdit && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelectPart(part.id); } }}
              className={canEdit ? "cursor-pointer outline-none [&:focus-visible>.part-shape]:stroke-amber-400 [&:focus-visible>.part-shape]:stroke-[3]" : ""}>
              {"path" in part ? (
                <path className="part-shape" d={part.path} transform={"transform" in part ? part.transform : undefined} fill={color} stroke={selected ? "#fbbf24" : "#94a3b8"} strokeWidth={selected ? 3 : 1.5} />
              ) : (
                <rect className="part-shape" x={part.x} y={part.y} width={part.w} height={part.h} rx={Math.min(12, part.w / 5)} fill={color} stroke={selected ? "#111827" : "#b8bec6"} strokeWidth={selected ? 3.5 : 2.5} />
              )}
              {separated && part.id.startsWith("porta_dianteira_") && (
                <path aria-hidden="true" pointerEvents="none" d="M60 123 V178 H86 Q86 156 77 145 Z" transform={"transform" in part ? part.transform : undefined} fill="#1e293b" stroke="#64748b" />
              )}
              <circle cx={x} cy={y} r={separated ? 9 : 11} fill="white" stroke="#555" strokeWidth="1.2" />
              <text x={x} y={y + (separated ? 3.5 : 4)} fontSize={separated ? 10 : 11} fill="#222" textAnchor="middle">{number}</text>
            </g>
          );
        })}
      </svg>
      <p className={square ? "sr-only" : "mt-2 text-center text-xs text-slate-600"}>Vista superior • Clique em uma peça para editar a avaliação</p>
    </div>
  );
}
