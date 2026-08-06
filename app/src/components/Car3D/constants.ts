import { CAR_PARTS } from "@/utils/carParts";

export type Vec3 = { x: number; y: number; z: number };
export type Point2D = { x: number; y: number };

export type CameraPreset = "3D" | "FRONT" | "REAR" | "LEFT" | "RIGHT" | "TOP";

export type PresetConfig = {
  id: CameraPreset;
  labelKey: string;
  iconName: string;
  yaw: number;
  pitch: number;
  zoom: number;
};

export const CAMERA_PRESETS: PresetConfig[] = [
  { id: "3D", labelKey: "carDiagram.presets.isometric", iconName: "box", yaw: 38, pitch: 20, zoom: 1.05 },
  { id: "FRONT", labelKey: "carDiagram.presets.front", iconName: "arrow-up", yaw: 0, pitch: 12, zoom: 1.15 },
  { id: "LEFT", labelKey: "carDiagram.presets.left", iconName: "arrow-left", yaw: 270, pitch: 14, zoom: 1.08 },
  { id: "RIGHT", labelKey: "carDiagram.presets.right", iconName: "arrow-right", yaw: 90, pitch: 14, zoom: 1.08 },
  { id: "REAR", labelKey: "carDiagram.presets.rear", iconName: "arrow-down", yaw: 180, pitch: 12, zoom: 1.15 },
  { id: "TOP", labelKey: "carDiagram.presets.top", iconName: "disc", yaw: 0, pitch: 78, zoom: 1.2 },
];

export interface MeshPartDefinition {
  id: string;
  labelKey?: string;
  isSelectable: boolean;
  vertices: Vec3[];
  normal: Vec3;
  center: Vec3;
  curvature?: number; // Para gradientes curvos
}

// Vetores de iluminação dupla (Luz Principal Superior-Frente + Luz de Preenchimento Lateral)
export const LIGHT_DIR_PRIMARY: Vec3 = { x: 0.5, y: 0.85, z: 0.65 };
export const LIGHT_DIR_SECONDARY: Vec3 = { x: -0.6, y: 0.4, z: -0.3 };

/**
 * Geometria 3D de Alta Fidelidade Visual (Sedan/SUV Esportivo Moderno)
 * Centro do veículo em (0, 0, 0)
 * X: Largura (-1.0 a +1.0)
 * Y: Altura (0.2 a 1.6)
 * Z: Comprimento (-2.1 a +2.1)
 */
export const CAR_3D_PARTS: MeshPartDefinition[] = [
  // --- CAPÔ (Hood) ---
  {
    id: "capo",
    labelKey: "carParts.hood",
    isSelectable: true,
    center: { x: 0, y: 0.94, z: 1.28 },
    normal: { x: 0, y: 0.72, z: 0.69 },
    vertices: [
      { x: -0.62, y: 0.92, z: 0.72 },
      { x: 0.62, y: 0.92, z: 0.72 },
      { x: 0.58, y: 0.76, z: 1.84 },
      { x: 0.38, y: 0.73, z: 1.94 },
      { x: -0.38, y: 0.73, z: 1.94 },
      { x: -0.58, y: 0.76, z: 1.84 },
    ],
  },

  // --- TETO (Roof) ---
  {
    id: "teto",
    labelKey: "carParts.roof",
    isSelectable: true,
    center: { x: 0, y: 1.34, z: -0.15 },
    normal: { x: 0, y: 0.98, z: 0.05 },
    vertices: [
      { x: -0.56, y: 1.34, z: 0.38 },
      { x: 0.56, y: 1.34, z: 0.38 },
      { x: 0.56, y: 1.32, z: -0.78 },
      { x: -0.56, y: 1.32, z: -0.78 },
    ],
  },

  /*// --- PARALAMA DIANTEIRO ESQUERDO (Front Fender Left) ---
  {
    id: "paralama_dianteiro_esq",
    labelKey: "carParts.front_fender_left",
    isSelectable: true,
    center: { x: -0.76, y: 0.72, z: 1.32 },
    normal: { x: -0.88, y: 0.32, z: 0.35 },
    vertices: [
      { x: -0.62, y: 0.92, z: 0.72 },
      { x: -0.74, y: 0.88, z: 1.25 },
      { x: -0.68, y: 0.74, z: 1.92 },
      { x: -0.82, y: 0.32, z: 1.92 },
      { x: -0.85, y: 0.32, z: 1.45 },
      { x: -0.84, y: 0.32, z: 0.72 },
    ],
  },*/
  // --- PARALAMA DIANTEIRO ESQUERDO (Front Fender Left) ---
  // --- PARALAMA DIANTEIRO ESQUERDO (Front Fender Left) ---
  {
    id: "paralama_dianteiro_esq",
    labelKey: "carParts.front_fender_left",
    isSelectable: true,
    // Centro ajustado para o novo volume
    center: { x: -0.78, y: 0.58, z: 1.30 },
    // Normal média mantida (ligeiramente para fora, cima e frente)
    normal: { x: -0.88, y: 0.32, z: 0.35 },
    vertices: [
      // --- CONTORNO EXTERNO COMPLETO (ORDEM ANTI-HORÁRIA) ---

      // 1. Topo Posterior (Junção Coluna A / Capô)
      { x: -0.65, y: 0.92, z: 0.72 }, // Topo/Atrás (Ponto inicial)

      // 2. Borda Superior (Junção com o Capô - Curva Interna)
      { x: -0.68, y: 0.90, z: 1.00 },
      { x: -0.70, y: 0.88, z: 1.25 },
      { x: -0.71, y: 0.85, z: 1.50 },
      { x: -0.72, y: 0.80, z: 1.75 },

      // 3. Ponta Dianteira Superior (Encontro Capô/Farol)
      { x: -0.73, y: 0.76, z: 1.92 }, // Canto superior frontal

      // 4. Borda Traseira do Farol (Curva Descendente)
      { x: -0.77, y: 0.68, z: 1.93 },
      { x: -0.80, y: 0.60, z: 1.93 },

      // 5. Canto Dianteiro Inferior (Junção com o Para-choque/Grelha)
      { x: -0.82, y: 0.55, z: 1.92 }, // Base frontal

      // 6. Arco da Roda - Curva Interna (O recorte para a roda)
      // *Esta é a parte mais crítica e complexa*
      { x: -0.85, y: 0.52, z: 1.78 }, // Início do arco (frente)
      { x: -0.88, y: 0.55, z: 1.62 },
      { x: -0.90, y: 0.60, z: 1.45 },
      { x: -0.91, y: 0.65, z: 1.32 }, // Topo central do arco
      { x: -0.90, y: 0.68, z: 1.20 },
      { x: -0.89, y: 0.65, z: 1.10 },
      { x: -0.88, y: 0.60, z: 1.00 },
      { x: -0.86, y: 0.55, z: 0.90 }, // Final do arco (atrás)

      // 7. Base Traseira ("Perna" da soleira)
      { x: -0.85, y: 0.40, z: 0.85 },
      { x: -0.84, y: 0.28, z: 0.80 },

      // 8. Canto Posterior Inferior (Encontro com a Soleira e Porta)
      { x: -0.83, y: 0.25, z: 0.78 }, // Ponto mais baixo/atrás

      // 9. Borda Traseira Vertical (Junção com a Porta)
      { x: -0.80, y: 0.40, z: 0.77 },
      { x: -0.76, y: 0.60, z: 0.76 },
      { x: -0.71, y: 0.75, z: 0.75 },
      { x: -0.67, y: 0.88, z: 0.74 }, // Próximo ao topo (conecta ao ponto 1)
    ],
  },

  // --- PARALAMA DIANTEIRO DIREITO (Front Fender Right) ---
  {
    id: "paralama_dianteiro_dir",
    labelKey: "carParts.front_fender_right",
    isSelectable: true,
    center: { x: 0.76, y: 0.72, z: 1.32 },
    normal: { x: 0.88, y: 0.32, z: 0.35 },
    vertices: [
      { x: 0.62, y: 0.92, z: 0.72 },
      { x: 0.84, y: 0.32, z: 0.72 },
      { x: 0.85, y: 0.32, z: 1.45 },
      { x: 0.82, y: 0.32, z: 1.92 },
      { x: 0.68, y: 0.74, z: 1.92 },
      { x: 0.74, y: 0.88, z: 1.25 },
    ],
  },

  // --- PORTA DIANTEIRA ESQUERDA (Front Door Left) ---
  {
    id: "porta_dianteira_esq",
    labelKey: "carParts.front_door_left",
    isSelectable: true,
    center: { x: -0.82, y: 0.72, z: 0.36 },
    normal: { x: -0.96, y: 0.12, z: 0.05 },
    vertices: [
      { x: -0.62, y: 0.92, z: 0.72 },
      { x: -0.84, y: 0.32, z: 0.72 },
      { x: -0.86, y: 0.32, z: 0.02 },
      { x: -0.64, y: 0.94, z: 0.02 },
    ],
  },

  // --- PORTA DIANTEIRA DIREITA (Front Door Right) ---
  {
    id: "porta_dianteira_dir",
    labelKey: "carParts.front_door_right",
    isSelectable: true,
    center: { x: 0.82, y: 0.72, z: 0.36 },
    normal: { x: 0.96, y: 0.12, z: 0.05 },
    vertices: [
      { x: 0.62, y: 0.92, z: 0.72 },
      { x: 0.64, y: 0.94, z: 0.02 },
      { x: 0.86, y: 0.32, z: 0.02 },
      { x: 0.84, y: 0.32, z: 0.72 },
    ],
  },

  // --- PORTA TRASEIRA ESQUERDA (Rear Door Left) ---
  {
    id: "porta_traseira_esq",
    labelKey: "carParts.rear_door_left",
    isSelectable: true,
    center: { x: -0.82, y: 0.72, z: -0.42 },
    normal: { x: -0.96, y: 0.12, z: -0.05 },
    vertices: [
      { x: -0.64, y: 0.94, z: 0.02 },
      { x: -0.86, y: 0.32, z: 0.02 },
      { x: -0.86, y: 0.32, z: -0.78 },
      { x: -0.62, y: 0.94, z: -0.78 },
    ],
  },

  // --- PORTA TRASEIRA DIREITA (Rear Door Right) ---
  {
    id: "porta_traseira_dir",
    labelKey: "carParts.rear_door_right",
    isSelectable: true,
    center: { x: 0.82, y: 0.72, z: -0.42 },
    normal: { x: 0.96, y: 0.12, z: -0.05 },
    vertices: [
      { x: 0.64, y: 0.94, z: 0.02 },
      { x: 0.62, y: 0.94, z: -0.78 },
      { x: 0.86, y: 0.32, z: -0.78 },
      { x: 0.86, y: 0.32, z: 0.02 },
    ],
  },

  // --- COLUNA ESQUERDA (Left Pillar A/B/C) ---
  {
    id: "coluna_esq",
    labelKey: "carParts.left_pillar",
    isSelectable: true,
    center: { x: -0.64, y: 1.22, z: -0.15 },
    normal: { x: -0.72, y: 0.68, z: 0 },
    vertices: [
      { x: -0.56, y: 1.34, z: 0.38 },
      { x: -0.62, y: 0.92, z: 0.72 },
      { x: -0.62, y: 0.94, z: -0.78 },
      { x: -0.56, y: 1.32, z: -0.78 },
    ],
  },

  // --- COLUNA DIREITA (Right Pillar A/B/C) ---
  {
    id: "coluna_dir",
    labelKey: "carParts.right_pillar",
    isSelectable: true,
    center: { x: 0.64, y: 1.22, z: -0.15 },
    normal: { x: 0.72, y: 0.68, z: 0 },
    vertices: [
      { x: 0.56, y: 1.34, z: 0.38 },
      { x: 0.56, y: 1.32, z: -0.78 },
      { x: 0.62, y: 0.94, z: -0.78 },
      { x: 0.62, y: 0.92, z: 0.72 },
    ],
  },

  // --- LATERAL ESQUERDA / PARALAMA TRASEIRO ESQ (Side Left) ---
  {
    id: "lateral_esq",
    labelKey: "carParts.side_left",
    isSelectable: true,
    center: { x: -0.8, y: 0.72, z: -1.3 },
    normal: { x: -0.88, y: 0.25, z: -0.4 },
    vertices: [
      { x: -0.62, y: 0.94, z: -0.78 },
      { x: -0.86, y: 0.32, z: -0.78 },
      { x: -0.82, y: 0.32, z: -1.82 },
      { x: -0.62, y: 0.88, z: -1.82 },
    ],
  },

  // --- LATERAL DIREITA / PARALAMA TRASEIRO DIR (Side Right) ---
  {
    id: "lateral_dir",
    labelKey: "carParts.side_right",
    isSelectable: true,
    center: { x: 0.8, y: 0.72, z: -1.3 },
    normal: { x: 0.88, y: 0.25, z: -0.4 },
    vertices: [
      { x: 0.62, y: 0.94, z: -0.78 },
      { x: 0.62, y: 0.88, z: -1.82 },
      { x: 0.82, y: 0.32, z: -1.82 },
      { x: 0.86, y: 0.32, z: -0.78 },
    ],
  },

  // --- TAMPA SUPERIOR / PORTA-MALAS (Upper Tailgate) ---
  {
    id: "tampa_superior",
    labelKey: "carParts.upper_tailgate",
    isSelectable: true,
    center: { x: 0, y: 0.98, z: -1.35 },
    normal: { x: 0, y: 0.65, z: -0.76 },
    vertices: [
      { x: -0.56, y: 1.32, z: -0.78 },
      { x: 0.56, y: 1.32, z: -0.78 },
      { x: 0.62, y: 0.88, z: -1.82 },
      { x: -0.62, y: 0.88, z: -1.82 },
    ],
  },

  // --- TAMPA INFERIOR / PARA-CHOQUE TRASEIRO (Lower Tailgate/Bumper) ---
  {
    id: "tampa_inferior",
    labelKey: "carParts.lower_tailgate",
    isSelectable: true,
    center: { x: 0, y: 0.58, z: -1.86 },
    normal: { x: 0, y: 0.1, z: -0.99 },
    vertices: [
      { x: -0.62, y: 0.88, z: -1.82 },
      { x: 0.62, y: 0.88, z: -1.82 },
      { x: 0.78, y: 0.32, z: -1.86 },
      { x: -0.78, y: 0.32, z: -1.86 },
    ],
  },

  // ==========================================
  // ELEMENTOS ADICIONAIS DE ESTILO E ACABAMENTO
  // ==========================================

  // --- PARA-BRISA DIANTEIRO (Panoramic Windshield) ---
  {
    id: "parabrisa",
    isSelectable: false,
    center: { x: 0, y: 1.2, z: 0.55 },
    normal: { x: 0, y: 0.62, z: 0.78 },
    vertices: [
      { x: -0.56, y: 1.34, z: 0.38 },
      { x: 0.56, y: 1.34, z: 0.38 },
      { x: 0.62, y: 0.92, z: 0.72 },
      { x: -0.62, y: 0.92, z: 0.72 },
    ],
  },

  // --- VIDRO TRASEIRO (Rear Windshield) ---
  {
    id: "vidro_traseiro",
    isSelectable: false,
    center: { x: 0, y: 1.18, z: -0.82 },
    normal: { x: 0, y: 0.62, z: -0.78 },
    vertices: [
      { x: -0.56, y: 1.32, z: -0.78 },
      { x: 0.56, y: 1.32, z: -0.78 },
      { x: 0.60, y: 0.92, z: -1.30 },
      { x: -0.60, y: 0.92, z: -1.30 },
    ],
  },

  // --- VIDROS LATERAIS DIANTEIROS (Front Side Windows) ---
  {
    id: "vidro_lateral_dianteiro_esq",
    isSelectable: false,
    center: { x: -0.63, y: 1.14, z: 0.37 },
    normal: { x: -0.97, y: 0.1, z: 0.05 },
    vertices: [
      { x: -0.565, y: 1.28, z: 0.35 },
      { x: -0.615, y: 0.98, z: 0.68 },
      { x: -0.635, y: 0.98, z: 0.04 },
      { x: -0.585, y: 1.28, z: -0.02 },
    ],
  },
  {
    id: "vidro_lateral_dianteiro_dir",
    isSelectable: false,
    center: { x: 0.63, y: 1.14, z: 0.37 },
    normal: { x: 0.97, y: 0.1, z: 0.05 },
    vertices: [
      { x: 0.565, y: 1.28, z: 0.35 },
      { x: 0.585, y: 1.28, z: -0.02 },
      { x: 0.635, y: 0.98, z: 0.04 },
      { x: 0.615, y: 0.98, z: 0.68 },
    ],
  },

  // --- VIDROS LATERAIS TRASEIROS (Rear Side Windows) ---
  {
    id: "vidro_lateral_traseiro_esq",
    isSelectable: false,
    center: { x: -0.61, y: 1.14, z: -0.4 },
    normal: { x: -0.97, y: 0.1, z: -0.05 },
    vertices: [
      { x: -0.585, y: 1.27, z: -0.06 },
      { x: -0.635, y: 0.98, z: 0.0 },
      { x: -0.635, y: 0.98, z: -0.74 },
      { x: -0.575, y: 1.25, z: -0.74 },
    ],
  },
  {
    id: "vidro_lateral_traseiro_dir",
    isSelectable: false,
    center: { x: 0.61, y: 1.14, z: -0.4 },
    normal: { x: 0.97, y: 0.1, z: -0.05 },
    vertices: [
      { x: 0.585, y: 1.27, z: -0.06 },
      { x: 0.575, y: 1.25, z: -0.74 },
      { x: 0.635, y: 0.98, z: -0.74 },
      { x: 0.635, y: 0.98, z: 0.0 },
    ],
  },

  // --- PARA-CHOQUE DIANTEIRO (Front Bumper Aerodynamic Lip) ---
  {
    id: "parachoques_dianteiro",
    isSelectable: false,
    center: { x: 0, y: 0.52, z: 1.96 },
    normal: { x: 0, y: 0.15, z: 0.98 },
    vertices: [
      { x: -0.58, y: 0.76, z: 1.84 },
      { x: -0.38, y: 0.73, z: 1.94 },
      { x: 0.38, y: 0.73, z: 1.94 },
      { x: 0.58, y: 0.76, z: 1.84 },
      { x: 0.68, y: 0.32, z: 1.92 },
      { x: -0.68, y: 0.32, z: 1.92 },
    ],
  },

  // --- GRADE DIANTEIRA (Front Grille) ---
  {
    id: "grade_dianteira",
    isSelectable: false,
    center: { x: 0, y: 0.7, z: 1.945 },
    normal: { x: 0, y: 0.1, z: 0.99 },
    vertices: [
      { x: -0.34, y: 0.735, z: 1.945 },
      { x: 0.34, y: 0.735, z: 1.945 },
      { x: 0.33, y: 0.615, z: 1.955 },
      { x: -0.33, y: 0.615, z: 1.955 },
    ],
  },

  // --- RETROVISOR ESQUERDO (Side Mirror Left) ---
  {
    id: "retrovisor_esq",
    isSelectable: false,
    center: { x: -0.78, y: 0.98, z: 0.68 },
    normal: { x: -0.9, y: 0.2, z: 0.3 },
    vertices: [
      { x: -0.68, y: 0.94, z: 0.72 },
      { x: -0.88, y: 0.96, z: 0.66 },
      { x: -0.86, y: 0.88, z: 0.62 },
      { x: -0.68, y: 0.88, z: 0.68 },
    ],
  },

  // --- RETROVISOR DIREITO (Side Mirror Right) ---
  {
    id: "retrovisor_dir",
    isSelectable: false,
    center: { x: 0.78, y: 0.98, z: 0.68 },
    normal: { x: 0.9, y: 0.2, z: 0.3 },
    vertices: [
      { x: 0.68, y: 0.94, z: 0.72 },
      { x: 0.68, y: 0.88, z: 0.68 },
      { x: 0.86, y: 0.88, z: 0.62 },
      { x: 0.88, y: 0.96, z: 0.66 },
    ],
  },

  // --- MAÇANETAS (Door Handles) ---
  {
    id: "macaneta_dianteira_esq",
    isSelectable: false,
    center: { x: -0.855, y: 0.63, z: 0.34 },
    normal: { x: -0.96, y: 0.12, z: 0.05 },
    vertices: [
      { x: -0.85, y: 0.66, z: 0.44 },
      { x: -0.86, y: 0.66, z: 0.24 },
      { x: -0.86, y: 0.6, z: 0.24 },
      { x: -0.85, y: 0.6, z: 0.44 },
    ],
  },
  {
    id: "macaneta_dianteira_dir",
    isSelectable: false,
    center: { x: 0.855, y: 0.63, z: 0.34 },
    normal: { x: 0.96, y: 0.12, z: 0.05 },
    vertices: [
      { x: 0.85, y: 0.66, z: 0.44 },
      { x: 0.85, y: 0.6, z: 0.44 },
      { x: 0.86, y: 0.6, z: 0.24 },
      { x: 0.86, y: 0.66, z: 0.24 },
    ],
  },
  {
    id: "macaneta_traseira_esq",
    isSelectable: false,
    center: { x: -0.865, y: 0.63, z: -0.4 },
    normal: { x: -0.96, y: 0.12, z: -0.05 },
    vertices: [
      { x: -0.86, y: 0.66, z: -0.3 },
      { x: -0.86, y: 0.66, z: -0.5 },
      { x: -0.865, y: 0.6, z: -0.5 },
      { x: -0.865, y: 0.6, z: -0.3 },
    ],
  },
  {
    id: "macaneta_traseira_dir",
    isSelectable: false,
    center: { x: 0.865, y: 0.63, z: -0.4 },
    normal: { x: 0.96, y: 0.12, z: -0.05 },
    vertices: [
      { x: 0.86, y: 0.66, z: -0.3 },
      { x: 0.865, y: 0.6, z: -0.3 },
      { x: 0.865, y: 0.6, z: -0.5 },
      { x: 0.86, y: 0.66, z: -0.5 },
    ],
  },

  // --- FARÓIS LED DIANTEIROS (LED Matrix Headlights) ---
  {
    id: "farol_esq",
    isSelectable: false,
    center: { x: -0.48, y: 0.74, z: 1.92 },
    normal: { x: -0.35, y: 0.2, z: 0.92 },
    vertices: [
      { x: -0.58, y: 0.76, z: 1.84 },
      { x: -0.36, y: 0.74, z: 1.93 },
      { x: -0.38, y: 0.62, z: 1.93 },
      { x: -0.60, y: 0.64, z: 1.88 },
    ],
  },
  {
    id: "farol_dir",
    isSelectable: false,
    center: { x: 0.48, y: 0.74, z: 1.92 },
    normal: { x: 0.35, y: 0.2, z: 0.92 },
    vertices: [
      { x: 0.36, y: 0.74, z: 1.93 },
      { x: 0.58, y: 0.76, z: 1.84 },
      { x: 0.60, y: 0.64, z: 1.88 },
      { x: 0.38, y: 0.62, z: 1.93 },
    ],
  },

  // --- LANTERNAS TRASEIRAS LED (Lightbar Rear LED) ---
  {
    id: "lanterna_esq",
    isSelectable: false,
    center: { x: -0.48, y: 0.86, z: -1.83 },
    normal: { x: -0.2, y: 0.1, z: -0.98 },
    vertices: [
      { x: -0.60, y: 0.88, z: -1.82 },
      { x: -0.32, y: 0.88, z: -1.82 },
      { x: -0.34, y: 0.78, z: -1.84 },
      { x: -0.61, y: 0.78, z: -1.84 },
    ],
  },
  {
    id: "lanterna_dir",
    isSelectable: false,
    center: { x: 0.48, y: 0.86, z: -1.83 },
    normal: { x: 0.2, y: 0.1, z: -0.98 },
    vertices: [
      { x: 0.32, y: 0.88, z: -1.82 },
      { x: 0.60, y: 0.88, z: -1.82 },
      { x: 0.61, y: 0.78, z: -1.84 },
      { x: 0.34, y: 0.78, z: -1.84 },
    ],
  },
];