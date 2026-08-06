import React, { useMemo } from "react";
import Svg, { Ellipse, G, Circle, Line, Path, Defs, RadialGradient, Stop } from "react-native-svg";
import { PartInspection } from "@/types/carParts";
import { CAR_3D_PARTS } from "./constants";
import { project3DPoint, calculateLighting, rotateVector } from "./useCarRotation";
import { CarPart } from "./CarPart";
import { REPAIR_COLORS } from "@/theme/repairColors";

interface CarMeshProps {
  width: number;
  height: number;
  yaw: number;
  pitch: number;
  zoom: number;
  partsState: Record<string, PartInspection>;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  isPartSelectable: (id: string) => boolean;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
}

function getPartColor(item?: PartInspection): string {
  if (!item) return REPAIR_COLORS.SEM_DANO;

  switch (item.tipoReparo) {
    case "SEM_DANO":
      return REPAIR_COLORS.SEM_DANO;
    case "PDR":
      return REPAIR_COLORS.PDR;
    case "PINTURA":
      return REPAIR_COLORS.PINTURA;
    case "TROCA":
      return REPAIR_COLORS.TROCA;
    case "ALUMINIO_PDR":
      return REPAIR_COLORS.ALUMINIO_PDR;
    case "ALUMINIO_PINTURA":
      return REPAIR_COLORS.ALUMINIO_PINTURA;
    default:
      return REPAIR_COLORS.SEM_DANO;
  }
}

// Ângulos fixos dos raios da roda de liga leve (5 raios esportivos)
const SPOKE_ANGLES = [0, 72, 144, 216, 288];

export function CarMesh({
  width,
  height,
  yaw,
  pitch,
  zoom,
  partsState,
  selectedPartId,
  hoveredPartId,
  isPartSelectable,
  onSelectPart,
  onHoverPart,
}: CarMeshProps) {
  // Projeção do Solo do Estúdio (Pedestral do Chassi com Luz Radial)
  const groundStage = useMemo(() => {
    const center = project3DPoint({ x: 0, y: 0.35, z: 0 }, width, height, yaw, pitch, zoom);
    const front = project3DPoint({ x: 0, y: 0.35, z: 2.0 }, width, height, yaw, pitch, zoom);
    const side = project3DPoint({ x: 1.1, y: 0.35, z: 0 }, width, height, yaw, pitch, zoom);

    const rx = Math.hypot(side.x - center.x, side.y - center.y);
    const ry = Math.hypot(front.x - center.x, front.y - center.y);

    return { cx: center.x, cy: center.y, rx, ry };
  }, [width, height, yaw, pitch, zoom]);

  // Lista de IDs de peças que são detalhes de superfície sobrepostos (vidros, faróis, lanternas, grade, retrovisores, maçanetas)
  const DETAIL_OVERLAY_IDS = useMemo(
    () =>
      new Set([
        "parabrisa",
        "vidro_traseiro",
        "vidro_lateral_dianteiro_esq",
        "vidro_lateral_dianteiro_dir",
        "vidro_lateral_traseiro_esq",
        "vidro_lateral_traseiro_dir",
        "farol_esq",
        "farol_dir",
        "lanterna_esq",
        "lanterna_dir",
        "grade_dianteira",
        "retrovisor_esq",
        "retrovisor_dir",
        "macaneta_dianteira_esq",
        "macaneta_dianteira_dir",
        "macaneta_traseira_esq",
        "macaneta_traseira_dir",
      ]),
    []
  );

  // Projeção Z-Sorting de Peças Poligonais do Veículo
  const projectedMeshes = useMemo(() => {
    const list = CAR_3D_PARTS.map((mesh) => {
      const projVertices = mesh.vertices.map((v) =>
        project3DPoint(v, width, height, yaw, pitch, zoom)
      );

      const projCenter = project3DPoint(mesh.center, width, height, yaw, pitch, zoom);
      const avgZ = projVertices.reduce((acc, v) => acc + v.zDepth, 0) / projVertices.length;
      const lighting = calculateLighting(mesh.normal, yaw, pitch);

      // Z-sorting inteligente para detalhes de superfície (vidros, faróis, lanternas)
      // Quando o detalhe está voltado para a câmera, aplica offset de sobreposição
      // para evitar que seja encoberto por painéis maiores ao girar o carro.
      const rotNormal = rotateVector(mesh.normal, yaw, pitch);
      let sortZ = avgZ;
      if (DETAIL_OVERLAY_IDS.has(mesh.id) && rotNormal.z > -0.25) {
        sortZ += 0.35;
      }

      const color = mesh.isSelectable ? getPartColor(partsState[mesh.id]) : "#334155";
      const selectable = mesh.isSelectable && isPartSelectable(mesh.id);

      return {
        mesh,
        projVertices,
        projCenter,
        avgZ,
        sortZ,
        lighting,
        color,
        selectable,
        selected: selectedPartId === mesh.id,
        hovered: hoveredPartId === mesh.id,
      };
    });

    return list.sort((a, b) => a.sortZ - b.sortZ);
  }, [
    width,
    height,
    yaw,
    pitch,
    zoom,
    partsState,
    selectedPartId,
    hoveredPartId,
    isPartSelectable,
    DETAIL_OVERLAY_IDS,
  ]);

  // Raio de referência da roda no mundo 3D (unidade alinhada com os arcos de roda dos paralamas)
  const WHEEL_RADIUS_WORLD = 0.22;

  // Projeção 3D de Rodas de Liga Leve Esportivas com Calotas, Discos de Freio e Pinças Brembo.
  const wheels = useMemo(() => {
    const wheelPositions = [
      { id: "wheel_fl", pos: { x: -0.78, y: 0.35, z: 1.32 }, innerX: -0.62 }, // Frente Esquerda
      { id: "wheel_fr", pos: { x: 0.78, y: 0.35, z: 1.32 }, innerX: 0.62 },   // Frente Direita
      { id: "wheel_rl", pos: { x: -0.78, y: 0.35, z: -1.28 }, innerX: -0.62 },// Trás Esquerda
      { id: "wheel_rr", pos: { x: 0.78, y: 0.35, z: -1.28 }, innerX: 0.62 },  // Trás Direita
    ];

    return wheelPositions.map((w) => {
      const center = project3DPoint(w.pos, width, height, yaw, pitch, zoom);
      const innerCenter = project3DPoint({ ...w.pos, x: w.innerX }, width, height, yaw, pitch, zoom);

      const edgeX = project3DPoint({ ...w.pos, x: w.pos.x + WHEEL_RADIUS_WORLD }, width, height, yaw, pitch, zoom);
      const edgeY = project3DPoint({ ...w.pos, y: w.pos.y + WHEEL_RADIUS_WORLD }, width, height, yaw, pitch, zoom);
      const edgeZ = project3DPoint({ ...w.pos, z: w.pos.z + WHEEL_RADIUS_WORLD }, width, height, yaw, pitch, zoom);

      const dx = Math.hypot(edgeX.x - center.x, edgeX.y - center.y);
      const dz = Math.hypot(edgeZ.x - center.x, edgeZ.y - center.y);
      const dy = Math.hypot(edgeY.x - center.x, edgeY.y - center.y);

      const rx = Math.max(dx, dz, 5);
      const ry = Math.max(dy, 5);

      return {
        id: w.id,
        x: center.x,
        y: center.y,
        ix: innerCenter.x,
        iy: innerCenter.y,
        zDepth: center.zDepth,
        rx,
        ry,
      };
    });
  }, [width, height, yaw, pitch, zoom]);

  // Mapeia cada roda ao painel de carroceria que deve exibir seu arco (furo)
  const WHEEL_WELL_MAP: Record<string, string> = {
    wheel_fl: "paralama_dianteiro_esq",
    wheel_fr: "paralama_dianteiro_dir",
    wheel_rl: "lateral_esq",
    wheel_rr: "lateral_dir",
  };

  const wheelWellByMeshId = useMemo(() => {
    const map: Record<string, { cx: number; cy: number; rx: number; ry: number }> = {};
    wheels.forEach((w) => {
      const meshId = WHEEL_WELL_MAP[w.id];
      if (!meshId) return;
      map[meshId] = { cx: w.x, cy: w.y, rx: w.rx * 0.94, ry: w.ry * 0.92 };
    });
    return map;
  }, [wheels]);

  // Lista única de itens desenháveis ordenada por profundidade (zDepth)
  type RenderItem =
    | { kind: "part"; avgZ: number; data: (typeof projectedMeshes)[number] }
    | { kind: "wheel"; avgZ: number; data: (typeof wheels)[number] };

  const renderItems = useMemo<RenderItem[]>(() => {
    const parts: RenderItem[] = projectedMeshes.map((item) => ({
      kind: "part",
      avgZ: item.avgZ,
      data: item,
    }));
    const wheelItems: RenderItem[] = wheels.map((w) => ({
      kind: "wheel",
      avgZ: w.zDepth,
      data: w,
    }));
    return [...parts, ...wheelItems].sort((a, b) => a.avgZ - b.avgZ);
  }, [projectedMeshes, wheels]);

  return (
    <Svg width={width} height={height} style={{ position: "absolute", top: 0, left: 0 }}>
      <Defs>
        <RadialGradient id="ground_glow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#1E293B" stopOpacity="0.85" />
          <Stop offset="60%" stopColor="#0F172A" stopOpacity="0.55" />
          <Stop offset="100%" stopColor="#020617" stopOpacity="0.0" />
        </RadialGradient>

        <RadialGradient id="contact_shadow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#000000" stopOpacity="0.80" />
          <Stop offset="55%" stopColor="#000000" stopOpacity="0.45" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient id="tire_gradient" cx="45%" cy="40%" rx="60%" ry="60%">
          <Stop offset="0%" stopColor="#333D4C" stopOpacity="1" />
          <Stop offset="65%" stopColor="#161B22" stopOpacity="1" />
          <Stop offset="100%" stopColor="#090C10" stopOpacity="1" />
        </RadialGradient>

        <RadialGradient id="rim_barrel_gradient" cx="42%" cy="38%" rx="65%" ry="65%">
          <Stop offset="0%" stopColor="#1E293B" stopOpacity="1" />
          <Stop offset="55%" stopColor="#334155" stopOpacity="1" />
          <Stop offset="100%" stopColor="#0F172A" stopOpacity="1" />
        </RadialGradient>

        <RadialGradient id="rim_face_gradient" cx="38%" cy="32%" rx="70%" ry="70%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <Stop offset="30%" stopColor="#CBD5E1" stopOpacity="1" />
          <Stop offset="80%" stopColor="#64748B" stopOpacity="1" />
          <Stop offset="100%" stopColor="#334155" stopOpacity="1" />
        </RadialGradient>

        <RadialGradient id="hub_gradient" cx="40%" cy="35%" rx="60%" ry="60%">
          <Stop offset="0%" stopColor="#334155" stopOpacity="1" />
          <Stop offset="70%" stopColor="#0F172A" stopOpacity="1" />
          <Stop offset="100%" stopColor="#020617" stopOpacity="1" />
        </RadialGradient>
      </Defs>

      {/* Brilho Radial do Estúdio */}
      <Ellipse
        cx={groundStage.cx}
        cy={groundStage.cy}
        rx={groundStage.rx * 1.35}
        ry={groundStage.ry * 1.35}
        fill="url(#ground_glow)"
      />

      {/* Sombra de Contato em Camadas */}
      <Ellipse
        cx={groundStage.cx}
        cy={groundStage.cy}
        rx={groundStage.rx * 1.15}
        ry={groundStage.ry * 0.92}
        fill="url(#contact_shadow)"
      />
      <Ellipse
        cx={groundStage.cx}
        cy={groundStage.cy}
        rx={groundStage.rx * 0.78}
        ry={groundStage.ry * 0.6}
        fill="#000000"
        fillOpacity={0.4}
      />

      {/* Anel de Luz da Plataforma Studio */}
      <Ellipse
        cx={groundStage.cx}
        cy={groundStage.cy}
        rx={groundStage.rx * 1.25}
        ry={groundStage.ry * 1.25}
        fill="none"
        stroke="rgba(96, 165, 250, 0.25)"
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />

      {/* Cenas Poligonais 3D (Carroceria + Rodas unificadas por zDepth) */}
      <G id="car_scene">
        {renderItems.map((item) => {
          if (item.kind === "part") {
            const p = item.data;
            return (
              <CarPart
                key={p.mesh.id}
                mesh={p.mesh}
                projectedVertices={p.projVertices}
                projectedCenter={p.projCenter}
                color={p.color}
                selected={p.selected}
                hovered={p.hovered}
                selectable={p.selectable}
                lightingFactor={p.lighting}
                wheelWell={wheelWellByMeshId[p.mesh.id]}
                onPress={() => onSelectPart(p.mesh.id)}
                onHoverIn={() => onHoverPart(p.mesh.id)}
                onHoverOut={() => onHoverPart(null)}
              />
            );
          }

          const w = item.data;
          const rx = w.rx;
          const ry = w.ry;
          const rimRx = rx * 0.62;
          const rimRy = ry * 0.62;

          // Deslocamento de perspectiva 3D da banda de rodagem do pneu
          const treadDx = w.ix - w.x;
          const treadDy = w.iy - w.y;
          const has3DTread = Math.hypot(treadDx, treadDy) > 1.2;

          return (
            <G key={w.id}>
              {/* Banda de rodagem 3D (profundidade volumétrica do pneu) */}
              {has3DTread && (
                <Path
                  d={`M ${w.x.toFixed(1)} ${(w.y - ry).toFixed(1)} L ${(w.ix).toFixed(1)} ${(w.iy - ry).toFixed(1)} A ${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 1 ${(w.ix).toFixed(1)} ${(w.iy + ry).toFixed(1)} L ${w.x.toFixed(1)} ${(w.y + ry).toFixed(1)} Z`}
                  fill="#11161F"
                  stroke="#070A0F"
                  strokeWidth={1}
                />
              )}

              {/* Parede Lateral do Pneu (Rubber Sidewall Profile) */}
              <Ellipse cx={w.x} cy={w.y} rx={rx} ry={ry} fill="url(#tire_gradient)" stroke="#090C10" strokeWidth={1.6} />

              {/* Sulcos e Relevos do Ombros do Pneu (Sports Sidewall Grooves) */}
              <Ellipse cx={w.x} cy={w.y} rx={rx * 0.88} ry={ry * 0.88} fill="none" stroke="#475569" strokeWidth={0.8} strokeOpacity={0.6} strokeDasharray="3 6" />

              {/* Anel Talonador Interno do Pneu */}
              <Ellipse cx={w.x} cy={w.y} rx={rx * 0.74} ry={ry * 0.74} fill="none" stroke="#1E293B" strokeWidth={1.2} />

              {/* Disco de Freio Ventilado (Brake Rotor) */}
              <Ellipse cx={w.x} cy={w.y - rimRy * 0.02} rx={rimRx * 0.72} ry={rimRy * 0.72} fill="#27303A" stroke="#475569" strokeWidth={1} />
              <Ellipse cx={w.x} cy={w.y - rimRy * 0.02} rx={rimRx * 0.54} ry={rimRy * 0.54} fill="none" stroke="#1E293B" strokeWidth={1} strokeDasharray="2 4" />

              {/* Pinça de Freio Esportiva Brembo (Red Brake Caliper) */}
              <Path
                d={`M ${(w.x - rimRx * 0.52).toFixed(1)} ${(w.y - rimRy * 0.48).toFixed(1)} A ${(rimRx * 0.65).toFixed(1)} ${(rimRy * 0.65).toFixed(1)} 0 0 1 ${(w.x - rimRx * 0.12).toFixed(1)} ${(w.y - rimRy * 0.68).toFixed(1)} L ${(w.x - rimRx * 0.18).toFixed(1)} ${(w.y - rimRy * 0.38).toFixed(1)} A ${(rimRx * 0.42).toFixed(1)} ${(rimRy * 0.42).toFixed(1)} 0 0 0 ${(w.x - rimRx * 0.42).toFixed(1)} ${(w.y - rimRy * 0.28).toFixed(1)} Z`}
                fill="#EF4444"
                stroke="#B91C1C"
                strokeWidth={1}
              />

              {/* Aro Metálico com Profundidade (Deep Rim Barrel Lip) */}
              <Ellipse cx={w.x} cy={w.y} rx={rimRx} ry={rimRy} fill="url(#rim_barrel_gradient)" stroke="#0F172A" strokeWidth={2} />
              <Ellipse cx={w.x} cy={w.y} rx={rimRx * 0.96} ry={rimRy * 0.96} fill="none" stroke="#F1F5F9" strokeWidth={1.4} />

              {/* Raios Esportivos de Liga Leve (5 Raios Duplos Esportivos) */}
              {SPOKE_ANGLES.map((deg) => {
                const radCentral = (deg * Math.PI) / 180;
                const radA = ((deg - 7) * Math.PI) / 180;
                const radB = ((deg + 7) * Math.PI) / 180;

                // Pontos no cubo central
                const hxa = w.x + Math.cos(radA) * rimRx * 0.24;
                const hya = w.y + Math.sin(radA) * rimRy * 0.24;
                const hxb = w.x + Math.cos(radB) * rimRx * 0.24;
                const hyb = w.y + Math.sin(radB) * rimRy * 0.24;

                // Pontos no aro externo
                const rxa = w.x + Math.cos(radA) * rimRx * 0.90;
                const rya = w.y + Math.sin(radA) * rimRy * 0.90;
                const rxb = w.x + Math.cos(radB) * rimRx * 0.90;
                const ryb = w.y + Math.sin(radB) * rimRy * 0.90;

                return (
                  <G key={deg}>
                    {/* Braço de Raio A */}
                    <Line x1={hxa} y1={hya} x2={rxa} y2={rya} stroke="#F8FAFC" strokeWidth={Math.max(1.4, rimRx * 0.08)} strokeLinecap="round" />
                    <Line x1={hxa} y1={hya + 1} x2={rxa} y2={rya + 1} stroke="#475569" strokeWidth={Math.max(0.8, rimRx * 0.04)} strokeLinecap="round" />

                    {/* Braço de Raio B */}
                    <Line x1={hxb} y1={hyb} x2={rxb} y2={ryb} stroke="#CBD5E1" strokeWidth={Math.max(1.4, rimRx * 0.08)} strokeLinecap="round" />
                    <Line x1={hxb} y1={hyb + 1} x2={rxb} y2={ryb + 1} stroke="#334155" strokeWidth={Math.max(0.8, rimRx * 0.04)} strokeLinecap="round" />
                  </G>
                );
              })}

              {/* Cubo Central e Calota de Liga Leve */}
              <Ellipse cx={w.x} cy={w.y} rx={rimRx * 0.24} ry={rimRy * 0.24} fill="url(#hub_gradient)" stroke="#E2E8F0" strokeWidth={1.4} />
              <Ellipse cx={w.x} cy={w.y} rx={rimRx * 0.14} ry={rimRy * 0.14} fill="none" stroke="#60A5FA" strokeWidth={1} />

              {/* Parafusos de Roda Hexagonais (Lug Nuts) */}
              {SPOKE_ANGLES.map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const lx = w.x + Math.cos(rad) * rimRx * 0.32;
                const ly = w.y + Math.sin(rad) * rimRy * 0.32;
                return (
                  <Circle
                    key={`lug_${deg}`}
                    cx={lx}
                    cy={ly}
                    r={Math.max(1.2, rimRx * 0.045)}
                    fill="#F8FAFC"
                    stroke="#334155"
                    strokeWidth={0.8}
                  />
                );
              })}
            </G>
          );
        })}
      </G>
    </Svg>
  );
}