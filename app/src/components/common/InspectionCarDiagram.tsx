import { useId } from "react";
import Svg, { Circle, Defs, G, Path, Pattern, Rect, Text as SvgText } from "react-native-svg";
import { useTranslation } from "react-i18next";
import { CAR_PARTS } from "@/utils/carParts";
import type { PartInspection } from "@/types/carParts";

const sides = [
  ["paralama_dianteiro", "M12 22 Q34 22 48 32 Q60 42 61 105 L12 106 V101 C43 97 43 58 12 55 Z", 47, 53, 2, 12],
  ["porta_dianteira", "M12 114 H59 L82 143 Q92 155 92 183 H12 Z", 45, 151, 3, 11],
  ["porta_traseira", "M12 191 H92 V247 H12 Z", 51, 219, 4, 10],
  ["lateral", "M12 255 H92 C91 285 63 301 55 345 Q53 357 12 357 V309 C45 303 44 264 12 261 Z", 44, 317, 5, 9],
  ["coluna", "M101 105 H115 V248 H101 Z", 108, 178, 6, 13],
] as const;

const panels: { id: string; path: string; x: number; y: number; number: number; transform?: string }[] = [
  ...sides.flatMap(([id, path, x, y, left, right]) => [
    { id: `${id}_esq`, path, x, y, number: left, transform: undefined },
    { id: `${id}_dir`, path, x: 300 - x, y, number: right, transform: "translate(300 0) scale(-1 1)" },
  ]),
  { id: "capo", path: "M101 95 L104 37 Q106 12 126 12 H174 Q194 12 196 37 L199 95 Z", x: 150, y: 55, number: 1 },
  { id: "teto", path: "M120 140 H180 V216 H120 Z", x: 150, y: 178, number: 14 },
  { id: "tampa_superior", path: "M111 252 H189 L191 271 H109 Z", x: 150, y: 261, number: 7 },
  { id: "tampa_inferior", path: "M109 279 H191 L187 324 Q185 335 166 335 H134 Q115 335 113 324 Z", x: 150, y: 306, number: 8 },
];

const paint = "#facc15";
const pdr = "#1f8bff";

export function InspectionCarDiagram({ parts, selected, onSelect, allowUndamaged = true }: {
  parts: Record<string, PartInspection>;
  selected: string | null;
  onSelect?: (id: string) => void;
  allowUndamaged?: boolean;
}) {
  const { t } = useTranslation();
  const pattern = useId().replace(/[^\w-]/g, "");
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 369" style={{ backgroundColor: "#020617" }}>
      <Defs>
        {[pdr, paint].map((color, index) => <Pattern key={color} id={`${pattern}al${index}`} width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <Rect width={8} height={8} fill={color} />
          <Rect width={4} height={8} fill="#22c55e" />
        </Pattern>)}
        <Pattern id={`${pattern}glue`} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <Rect width={2} height={6} fill="#111827" />
        </Pattern>
      </Defs>
      <Path d="M117 106 H183 L180 137 H120 Z M120 219 H180 L184 248 H116 Z" fill="#1e293b" stroke="#64748b" />
      {panels.map((panel) => {
        const part = parts[panel.id];
        const type = part?.avaliada === false ? undefined : part?.tipoReparo;
        const fill = type === "ALUMINIO_PINTURA" ? `url(#${pattern}al1)`
          : type === "ALUMINIO_PDR" ? `url(#${pattern}al0)`
          : type === "PINTURA" ? paint : type === "PDR" ? pdr : type === "TROCA" ? "#e34c4c"
          : type === "SEM_DANO" ? "#d1d5db" : "#f8fafc";
        const label = CAR_PARTS.find(({ id }) => id === panel.id)?.labelKey ?? panel.id;
        const press = onSelect && (allowUndamaged || (type && type !== "SEM_DANO")) ? () => onSelect(panel.id) : undefined;
        return <G key={panel.id} onPress={press} accessible={Boolean(press)} accessibilityRole="button" accessibilityLabel={t(label)}>
          <Path d={panel.path} transform={panel.transform} fill={fill} stroke={selected === panel.id ? "#fbbf24" : "#94a3b8"} strokeWidth={selected === panel.id ? 3 : 1.5} />
          {part?.especificacoes?.cola && <Path d={panel.path} transform={panel.transform} fill={`url(#${pattern}glue)`} />}
          <Circle cx={panel.x} cy={panel.y} r={8} fill="#f8fafc" />
          <SvgText x={panel.x} y={panel.y + 3} textAnchor="middle" fontSize={8} fontWeight="700" fill="#111827">{panel.number}</SvgText>
        </G>;
      })}
    </Svg>
  );
}
