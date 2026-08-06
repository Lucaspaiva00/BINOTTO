import React, { memo, useMemo } from "react";
import { Polygon, Path, Ellipse, Circle, G, Defs, LinearGradient, Stop } from "react-native-svg";
import { MeshPartDefinition, Point2D } from "./constants";

export interface WheelWell {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

interface CarPartProps {
  mesh: MeshPartDefinition;
  projectedVertices: Point2D[];
  projectedCenter: Point2D;
  color: string;
  selected: boolean;
  hovered: boolean;
  selectable: boolean;
  lightingFactor: number;
  wheelWell?: WheelWell;
  onPress: () => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
}

function adjustColorBrightness(hexColor: string, factor: number): string {
  if (!hexColor || !hexColor.startsWith("#")) return hexColor;
  let hex = hexColor.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));

  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

// Mistura duas cores hex por um fator 0..1
function mixColors(hexA: string, hexB: string, t: number): string {
  const clean = (h: string) => h.replace("#", "");
  const a = clean(hexA);
  const b = clean(hexB);
  if (a.length !== 6 || b.length !== 6) return hexA;
  const ar = parseInt(a.substring(0, 2), 16), ag = parseInt(a.substring(2, 4), 16), ab = parseInt(a.substring(4, 6), 16);
  const br = parseInt(b.substring(0, 2), 16), bg = parseInt(b.substring(2, 4), 16), bb = parseInt(b.substring(4, 6), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

type MaterialKind = "glass" | "chrome" | "plastic_dark" | "headlight" | "taillight" | "paint";

function getMaterialKind(mesh: MeshPartDefinition): MaterialKind {
  if (mesh.id === "parabrisa" || mesh.id === "vidro_traseiro" || mesh.id.startsWith("vidro_lateral")) return "glass";
  if (mesh.id.startsWith("retrovisor") || mesh.id.startsWith("macaneta") || mesh.id === "grade_dianteira") return "chrome";
  if (mesh.id === "parachoques_dianteiro") return "plastic_dark";
  if (mesh.id === "farol_esq" || mesh.id === "farol_dir") return "headlight";
  if (mesh.id === "lanterna_esq" || mesh.id === "lanterna_dir") return "taillight";
  return "paint";
}

export const CarPart = memo(function CarPart({
  mesh,
  projectedVertices,
  projectedCenter,
  color,
  selected,
  hovered,
  selectable,
  lightingFactor,
  wheelWell,
  onPress,
  onHoverIn,
  onHoverOut,
}: CarPartProps) {
  const material = useMemo(() => getMaterialKind(mesh), [mesh.id]);

  // Cor base por material (peças estruturais não pintáveis usam tons fixos ultra realistas)
  const fillBaseColor = useMemo(() => {
    switch (material) {
      case "glass":
        return "#132035";
      case "chrome":
        return "#CBD5E1";
      case "plastic_dark":
        return "#1E293B";
      case "headlight":
        return "#F8FAFC";
      case "taillight":
        return "#E11D48";
      default:
        return color;
    }
  }, [material, color]);

  // Direção do highlight especular adaptativo por inclinação do painel 3D
  const highlightPos = useMemo(() => {
    const up = Math.max(0, mesh.normal.y);
    return { x1: "15%", y1: `${10 + (1 - up) * 20}%`, x2: "85%", y2: `${50 + up * 20}%` };
  }, [mesh.normal.y]);

  const shadedColor = useMemo(() => {
    let factor = lightingFactor;
    if (hovered && selectable) factor *= 1.16;
    return adjustColorBrightness(fillBaseColor, factor);
  }, [fillBaseColor, lightingFactor, hovered, selectable]);

  const highlightColor = useMemo(() => {
    if (material === "glass") return "#38BDF8";
    if (material === "chrome") return "#FFFFFF";
    if (material === "plastic_dark") return "#475569";
    if (material === "headlight") return "#FFFFFF";
    if (material === "taillight") return "#FDA4AF";
    return adjustColorBrightness(fillBaseColor, Math.max(1.15, lightingFactor * 1.55));
  }, [material, fillBaseColor, lightingFactor]);

  const shadowEdgeColor = useMemo(() => {
    if (material === "glass") return "#060D19";
    if (material === "headlight") return "#94A3B8";
    if (material === "taillight") return "#881337";
    return adjustColorBrightness(fillBaseColor, Math.min(0.85, lightingFactor * 0.58));
  }, [material, fillBaseColor, lightingFactor]);

  // Opacidades por tipo de material
  const stopOpacities = useMemo(() => {
    if (material === "glass") return { hi: 0.65, mid: 0.88, low: 0.96 };
    if (material === "chrome") return { hi: 1.0, mid: 1.0, low: 1.0 };
    if (material === "headlight") return { hi: 0.95, mid: 0.90, low: 0.85 };
    if (!mesh.isSelectable) return { hi: 0.92, mid: 0.96, low: 1.0 };
    return { hi: 0.98, mid: 1.0, low: 1.0 };
  }, [material, mesh.isSelectable]);

  // Elevação 3D suave ao selecionar
  const vertices = useMemo(() => {
    if (!selected) return projectedVertices;
    return projectedVertices.map((v) => ({
      x: v.x + (v.x - projectedCenter.x) * 0.08,
      y: v.y + (v.y - projectedCenter.y) * 0.08,
    }));
  }, [projectedVertices, projectedCenter, selected]);

  const pointsString = useMemo(() => {
    return vertices.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  }, [vertices]);

  // Caminho do painel com recorte elíptico do arco de roda (fillRule="evenodd")
  const wellPathD = useMemo(() => {
    if (!wheelWell || vertices.length < 3) return null;
    const outer = `M ${vertices.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")} Z`;
    const { cx, cy, rx, ry } = wheelWell;
    const ellipse =
      `M ${(cx - rx).toFixed(1)},${cy.toFixed(1)} ` +
      `A ${rx.toFixed(1)},${ry.toFixed(1)} 0 1,0 ${(cx + rx).toFixed(1)},${cy.toFixed(1)} ` +
      `A ${rx.toFixed(1)},${ry.toFixed(1)} 0 1,0 ${(cx - rx).toFixed(1)},${cy.toFixed(1)} Z`;
    return `${outer} ${ellipse}`;
  }, [wheelWell, vertices]);

  // Faixa de verniz especular sobre a pintura automotiva
  const reflectionStripe = useMemo(() => {
    if (material !== "paint" || !mesh.isSelectable || vertices.length < 4) return null;
    const cx = projectedCenter.x;
    const cy = projectedCenter.y;
    const pts = vertices.map((v) => ({
      x: cx + (v.x - cx) * 0.96,
      y: cy + (v.y - cy) * 0.96,
    }));
    const n = pts.length;
    const top = pts.slice(0, Math.ceil(n / 2));
    if (top.length < 2) return null;
    return top.map((p) => `${p.x.toFixed(1)},${(p.y + 3).toFixed(1)}`).join(" ");
  }, [material, mesh.isSelectable, vertices, projectedCenter]);

  // Linha de reflexo diagonal para vidros
  const glassSheenLine = useMemo(() => {
    if (material !== "glass" || vertices.length < 4) return null;
    const p0 = vertices[0];
    const p2 = vertices[Math.floor(vertices.length / 2)];
    if (!p0 || !p2) return null;
    return {
      x1: p0.x + (p2.x - p0.x) * 0.2,
      y1: p0.y + (p2.y - p0.y) * 0.2,
      x2: p0.x + (p2.x - p0.x) * 0.8,
      y2: p0.y + (p2.y - p0.y) * 0.8,
    };
  }, [material, vertices]);

  const gradientId = `grad_${mesh.id}`;

  const strokeColor = useMemo(() => {
    if (selected) return "#2F8BFF";
    if (hovered && selectable) return "#60A5FA";
    if (material === "glass") return "#0A1220";
    if (material === "chrome") return "#64748B";
    if (material === "plastic_dark") return "#0F172A";
    if (material === "headlight") return "#94A3B8";
    if (material === "taillight") return "#991B1B";
    return "#0F172A";
  }, [selected, hovered, selectable, material]);

  const strokeWidth = selected ? 3.5 : hovered ? 2.2 : material === "glass" ? 1.0 : 1.1;

  return (
    <G
      onPress={selectable ? onPress : undefined}
      onPressIn={onHoverIn}
      onPressOut={onHoverOut}
    >
      <Defs>
        <LinearGradient id={gradientId} x1={highlightPos.x1} y1={highlightPos.y1} x2={highlightPos.x2} y2={highlightPos.y2}>
          <Stop offset="0%" stopColor={highlightColor} stopOpacity={stopOpacities.hi} />
          <Stop offset="45%" stopColor={shadedColor} stopOpacity={stopOpacities.mid} />
          <Stop offset="100%" stopColor={shadowEdgeColor} stopOpacity={stopOpacities.low} />
        </LinearGradient>
      </Defs>

      {/* Sombra Externa de Destaque 3D para Peça Selecionada */}
      {selected && (
        wellPathD ? (
          <Path
            d={wellPathD}
            fillRule="evenodd"
            fill="none"
            stroke="#2F8BFF"
            strokeWidth={7.0}
            strokeOpacity={0.35}
            strokeLinejoin="round"
          />
        ) : (
          <Polygon
            points={pointsString}
            fill="none"
            stroke="#2F8BFF"
            strokeWidth={7.0}
            strokeOpacity={0.35}
            strokeLinejoin="round"
          />
        )
      )}

      {/* Polígono do Painel 3D (com recorte do arco de roda quando aplicável) */}
      {wellPathD ? (
        <Path
          d={wellPathD}
          fillRule="evenodd"
          fill={`url(#${gradientId})`}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      ) : (
        <Polygon
          points={pointsString}
          fill={`url(#${gradientId})`}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )}

      {/* Sombra interna do arco de roda no painel */}
      {wheelWell && (
        <Ellipse
          cx={wheelWell.cx}
          cy={wheelWell.cy}
          rx={wheelWell.rx * 1.04}
          ry={wheelWell.ry * 1.04}
          fill="none"
          stroke="#000000"
          strokeWidth={2.5}
          strokeOpacity={0.5}
        />
      )}

      {/* Brilho de reflexo diagonal em vidros */}
      {glassSheenLine && (
        <Path
          d={`M ${glassSheenLine.x1.toFixed(1)} ${glassSheenLine.y1.toFixed(1)} L ${glassSheenLine.x2.toFixed(1)} ${glassSheenLine.y2.toFixed(1)}`}
          stroke="#BAE6FD"
          strokeWidth={1.6}
          strokeOpacity={0.35}
          strokeLinecap="round"
        />
      )}

      {/* Faixa de reflexo de verniz sobre pintura automotiva */}
      {reflectionStripe && (
        <Polygon
          points={reflectionStripe}
          fill="none"
          stroke={mixColors(shadedColor, "#FFFFFF", 0.55)}
          strokeWidth={1.4}
          strokeOpacity={0.30}
          strokeLinecap="round"
        />
      )}

      {/* Detalhes internos de Faróis LED (Projetores + DRL Strip) */}
      {material === "headlight" && (
        <G>
          <Polygon
            points={pointsString}
            fill="none"
            stroke="#38BDF8"
            strokeWidth={1.5}
            strokeOpacity={0.7}
          />
          <Circle
            cx={projectedCenter.x - 5}
            cy={projectedCenter.y}
            r={3}
            fill="#FFFFFF"
            stroke="#38BDF8"
            strokeWidth={1}
          />
          <Circle
            cx={projectedCenter.x + 5}
            cy={projectedCenter.y}
            r={2.5}
            fill="#E0F2FE"
            stroke="#0EA5E9"
            strokeWidth={0.8}
          />
        </G>
      )}

      {/* Detalhes internos de Lanternas LED (Lightbar em Néon Rubi) */}
      {material === "taillight" && (
        <G>
          <Polygon
            points={pointsString}
            fill="none"
            stroke="#FB7185"
            strokeWidth={1.5}
            strokeOpacity={0.85}
          />
          <Path
            d={`M ${(projectedCenter.x - 12).toFixed(1)} ${projectedCenter.y.toFixed(1)} L ${(projectedCenter.x + 12).toFixed(1)} ${projectedCenter.y.toFixed(1)}`}
            stroke="#FFFFFF"
            strokeWidth={1.2}
            strokeOpacity={0.75}
            strokeLinecap="round"
          />
        </G>
      )}

      {/* Detalhes internos da Grade Dianteira (Frisos de Entrada de Ar) */}
      {mesh.id === "grade_dianteira" && (
        <G>
          <Path
            d={`M ${(projectedCenter.x - 14).toFixed(1)} ${(projectedCenter.y - 3).toFixed(1)} L ${(projectedCenter.x + 14).toFixed(1)} ${(projectedCenter.y - 3).toFixed(1)} M ${(projectedCenter.x - 12).toFixed(1)} ${(projectedCenter.y + 2).toFixed(1)} L ${(projectedCenter.x + 12).toFixed(1)} ${(projectedCenter.y + 2).toFixed(1)}`}
            stroke="#64748B"
            strokeWidth={1.2}
            strokeOpacity={0.8}
          />
        </G>
      )}
    </G>
  );
});