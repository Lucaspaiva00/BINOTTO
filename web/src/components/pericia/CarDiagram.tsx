import { Suspense, useMemo, useState } from "react";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { Center, Html, OrbitControls, useGLTF } from "@react-three/drei";
import type { Object3D } from "three";
import { getCarPartLabel } from "@/constants/carParts";
import { getRepairTypeColor } from "@/constants/repairTypes";
import type { PartInspection } from "@/types/carParts";
import { resolveVehicleProfile } from "@/constants/vehicleCatalog";
import { resolveVehicleAsset, type VehicleAsset } from "@/constants/vehicleAssets";

interface CarDiagramProps { partsState: Record<string, PartInspection>; selectedPartId: string | null; onSelectPart: (partId: string) => void; canEdit?: boolean; vehicleModel?: string | null; }
type Panel = { id: string; position: [number, number, number]; size: [number, number, number] };

// Painéis independentes permitem registrar a avaria por peça, sem depender de imagem gerada por IA.
const PANELS: Panel[] = [
  { id: "capo", position: [0, .76, -1.58], size: [1.72, .07, 1.14] }, { id: "teto", position: [0, 1.38, 0], size: [1.6, .06, 1.72] },
  { id: "tampa_superior", position: [0, .82, 1.48], size: [1.68, .07, .7] }, { id: "tampa_inferior", position: [0, .61, 2.04], size: [1.82, .2, .35] },
  { id: "paralama_dianteiro_esq", position: [-.96, .72, -1.42], size: [.24, .38, 1.08] }, { id: "paralama_dianteiro_dir", position: [.96, .72, -1.42], size: [.24, .38, 1.08] },
  { id: "porta_dianteira_esq", position: [-1.03, .67, -.48], size: [.14, .72, .92] }, { id: "porta_dianteira_dir", position: [1.03, .67, -.48], size: [.14, .72, .92] },
  { id: "coluna_esq", position: [-.91, 1.18, .18], size: [.12, .74, .16] }, { id: "coluna_dir", position: [.91, 1.18, .18], size: [.12, .74, .16] },
  { id: "porta_traseira_esq", position: [-1.03, .67, .72], size: [.14, .72, .92] }, { id: "porta_traseira_dir", position: [1.03, .67, .72], size: [.14, .72, .92] },
  { id: "lateral_esq", position: [-.98, .58, 1.56], size: [.22, .38, .66] }, { id: "lateral_dir", position: [.98, .58, 1.56], size: [.22, .38, .66] },
];

function VehiclePanel({ panel, state, selected, canOpen, onSelect, overlayOnly }: { panel: Panel; state?: PartInspection; selected: boolean; canOpen: boolean; onSelect: () => void; overlayOnly?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const color = getRepairTypeColor(state?.repairType ?? "SEM_DANO");
  const click = (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); if (canOpen) onSelect(); };
  const visible = !overlayOnly || state?.repairType !== "SEM_DANO" || selected || hovered;
  return <mesh visible={visible} position={panel.position} onClick={click} onPointerEnter={(event) => { event.stopPropagation(); setHovered(true); document.body.style.cursor = canOpen ? "pointer" : "default"; }} onPointerLeave={() => { setHovered(false); document.body.style.cursor = "default"; }}>
    <boxGeometry args={panel.size} /><meshStandardMaterial transparent={overlayOnly} opacity={overlayOnly ? .72 : 1} color={color} metalness={.45} roughness={.35} emissive={selected || hovered ? "#ffffff" : "#000000"} emissiveIntensity={selected ? .32 : hovered ? .12 : 0} />
    {(hovered || selected) && <Html position={[0, panel.size[1] / 2 + .12, 0]} center distanceFactor={7} style={{ pointerEvents: "none" }}><div className="whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[11px] font-medium text-white shadow-lg">{getCarPartLabel(panel.id)}</div></Html>}
  </mesh>;
}

function LicensedVehicleModel({ asset }: { asset: VehicleAsset }) {
  const gltf = useGLTF(asset.assetPath!, true, true);
  const scene = useMemo(() => gltf.scene.clone(true) as Object3D, [gltf.scene]);
  return <Center><primitive object={scene} /></Center>;
}

function Vehicle(props: CarDiagramProps) {
  const profile = resolveVehicleProfile(props.vehicleModel);
  const asset = resolveVehicleAsset(props.vehicleModel);
  const hasRealModel = Boolean(asset?.assetPath);
  return <group rotation={[0, -.42, 0]} scale={profile.scale}>
    {hasRealModel ? <Suspense fallback={null}><LicensedVehicleModel asset={asset!} /></Suspense> : <><mesh position={[0, .44, 0]}><boxGeometry args={[1.95, .62, 4.28]} /><meshStandardMaterial color="#242a34" metalness={.55} roughness={.34} /></mesh><mesh position={[0, 1.01, .12]}><boxGeometry args={[1.62, .66, 1.82]} /><meshStandardMaterial color="#17202c" metalness={.7} roughness={.18} transparent opacity={.88} /></mesh>{[-1, 1].flatMap((x) => [-1.3, 1.35].map((z) => <mesh key={`${x}-${z}`} position={[x, .28, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.37, .37, .2, 28]} /><meshStandardMaterial color="#080b10" roughness={.48} /></mesh>))}</>}
    {PANELS.map((panel) => { const state = props.partsState[panel.id]; const canOpen = props.canEdit || (state && state.repairType !== "SEM_DANO"); return <VehiclePanel key={panel.id} panel={panel} state={state} selected={props.selectedPartId === panel.id} canOpen={Boolean(canOpen)} overlayOnly={hasRealModel} onSelect={() => props.onSelectPart(panel.id)} />; })}
  </group>;
}

export function CarDiagram(props: CarDiagramProps) {
  const profile = resolveVehicleProfile(props.vehicleModel);
  const vehicleAsset = resolveVehicleAsset(props.vehicleModel);
  const hasRealModel = Boolean(vehicleAsset?.assetPath);
  const modelStatus = hasRealModel ? `Modelo 3D: ${vehicleAsset?.label}` : `Perfil técnico genérico: ${profile.label}`;
  return <div className="h-100 w-full overflow-hidden rounded-xl border border-border bg-linear-to-b from-slate-950 to-slate-800"><div className="absolute z-10 m-3 rounded-full bg-black/50 px-3 py-1 text-xs text-white">{modelStatus}</div><Canvas camera={{ position: [5.5, 4.5, 6], fov: 42 }} dpr={[1, 2]}><ambientLight intensity={1.35} /><directionalLight position={[5, 7, 4]} intensity={2.4} /><directionalLight position={[-4, 3, -3]} intensity={1.2} /><Vehicle {...props} /><OrbitControls makeDefault enablePan={false} minDistance={5.2} maxDistance={9} minPolarAngle={.45} maxPolarAngle={1.45} /></Canvas><p className="pointer-events-none -mt-8 px-3 text-center text-xs text-slate-300">Arraste para girar · clique em uma peça para ver o reparo</p>{hasRealModel && <p className="pointer-events-none -mt-12 px-3 text-right text-[10px] text-slate-400">{vehicleAsset?.attribution}</p>}</div>;
}
