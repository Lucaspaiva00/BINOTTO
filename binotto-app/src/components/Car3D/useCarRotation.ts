import { useState, useCallback, useRef } from "react";
import { PanResponder, PanResponderGestureState } from "react-native";
import { Vec3, Point2D, LIGHT_DIR_PRIMARY, LIGHT_DIR_SECONDARY, CameraPreset, CAMERA_PRESETS } from "./constants";

export interface RotationState {
  yaw: number;
  pitch: number;
  zoom: number;
  activePreset: CameraPreset | null;
}

export function useCarRotation(initialPreset: CameraPreset = "3D") {
  const defaultPreset = CAMERA_PRESETS.find((p) => p.id === initialPreset) || CAMERA_PRESETS[0];

  const [rotation, setRotation] = useState<RotationState>({
    yaw: defaultPreset.yaw,
    pitch: defaultPreset.pitch,
    zoom: defaultPreset.zoom,
    activePreset: defaultPreset.id,
  });

  const isDragging = useRef(false);
  const startRotation = useRef({ yaw: defaultPreset.yaw, pitch: defaultPreset.pitch });

  const setRotationAngles = useCallback((yaw: number, pitch: number, zoom = 1.0, activePreset: CameraPreset | null = null) => {
    let normalizedYaw = yaw % 360;
    if (normalizedYaw < 0) normalizedYaw += 360;
    const clampedPitch = Math.max(-10, Math.min(85, pitch));

    setRotation({
      yaw: normalizedYaw,
      pitch: clampedPitch,
      zoom,
      activePreset,
    });
  }, []);

  const rotateToPreset = useCallback(
    (presetId: CameraPreset) => {
      const preset = CAMERA_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        setRotationAngles(preset.yaw, preset.pitch, preset.zoom, preset.id);
      }
    },
    [setRotationAngles]
  );

  const resetRotation = useCallback(() => {
    rotateToPreset("3D");
  }, [rotateToPreset]);

  // Gestor de PanResponder suave com suporte a física de inércia
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        setRotation((curr) => {
          startRotation.current = { yaw: curr.yaw, pitch: curr.pitch };
          return curr;
        });
      },
      onPanResponderMove: (_, gestureState: PanResponderGestureState) => {
        if (!isDragging.current) return;
        const sensitivity = 0.55;
        const newYaw = startRotation.current.yaw - gestureState.dx * sensitivity;
        const newPitch = startRotation.current.pitch + gestureState.dy * sensitivity;

        let normYaw = newYaw % 360;
        if (normYaw < 0) normYaw += 360;
        const clampedPitch = Math.max(-10, Math.min(85, newPitch));

        setRotation({
          yaw: normYaw,
          pitch: clampedPitch,
          zoom: 1.0,
          activePreset: null,
        });
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
      },
    })
  ).current;

  return {
    rotation,
    setRotationAngles,
    rotateToPreset,
    resetRotation,
    panResponder,
    isDragging: isDragging.current,
  };
}

/**
 * Projeção de Ponto 3D para Espaço 2D
 */
export function project3DPoint(
  point: Vec3,
  width: number,
  height: number,
  yawDeg: number,
  pitchDeg: number,
  zoom = 1.0
): Point2D & { zDepth: number } {
  const radYaw = (yawDeg * Math.PI) / 180;
  const radPitch = (pitchDeg * Math.PI) / 180;

  const sinY = Math.sin(radYaw);
  const cosY = Math.cos(radYaw);
  const sinP = Math.sin(radPitch);
  const cosP = Math.cos(radPitch);

  // Rotação YAW (Eixo Y)
  const x1 = point.x * cosY + point.z * sinY;
  const y1 = point.y;
  const z1 = -point.x * sinY + point.z * cosY;

  // Rotação PITCH (Eixo X)
  const x2 = x1;
  const y2 = y1 * cosP - z1 * sinP;
  const z2 = y1 * sinP + z1 * cosP;

  // Projeção Ortográfica / Perspectiva Suave
  const cameraDistance = 5.2;
  const scale = (cameraDistance / (cameraDistance - z2)) * (Math.min(width, height) / 3.7) * zoom;

  const px = width / 2 + x2 * scale;
  const py = height / 2 - (y2 - 0.72) * scale;

  return {
    x: px,
    y: py,
    zDepth: z2,
  };
}

/**
 * Rotacionar vetor normal de superfície
 */
export function rotateVector(vector: Vec3, yawDeg: number, pitchDeg: number): Vec3 {
  const radYaw = (yawDeg * Math.PI) / 180;
  const radPitch = (pitchDeg * Math.PI) / 180;

  const sinY = Math.sin(radYaw);
  const cosY = Math.cos(radYaw);
  const sinP = Math.sin(radPitch);
  const cosP = Math.cos(radPitch);

  const x1 = vector.x * cosY + vector.z * sinY;
  const y1 = vector.y;
  const z1 = -vector.x * sinY + vector.z * cosY;

  const x2 = x1;
  const y2 = y1 * cosP - z1 * sinP;
  const z2 = y1 * sinP + z1 * cosP;

  return { x: x2, y: y2, z: z2 };
}

/**
 * Iluminação 3D Avançada (Lambertiana + Luz de Preenchimento + Brilho Especular Metálico)
 */
export function calculateLighting(normal: Vec3, yawDeg: number, pitchDeg: number): number {
  const rotNormal = rotateVector(normal, yawDeg, pitchDeg);

  // Luz Principal (Sun Keylight)
  const dotPrimary = rotNormal.x * LIGHT_DIR_PRIMARY.x + rotNormal.y * LIGHT_DIR_PRIMARY.y + rotNormal.z * LIGHT_DIR_PRIMARY.z;
  
  // Luz Secundária de Preenchimento (Fill Light)
  const dotSecondary = rotNormal.x * LIGHT_DIR_SECONDARY.x + rotNormal.y * LIGHT_DIR_SECONDARY.y + rotNormal.z * LIGHT_DIR_SECONDARY.z;

  // Brilho Especular Reflexivo Metálico
  const specular = Math.pow(Math.max(0, dotPrimary), 4.5) * 0.35;

  const diffuse = Math.max(-0.1, dotPrimary) * 0.42 + Math.max(0, dotSecondary) * 0.18;

  // Fator final de iluminação (0.72 a 1.35)
  return 0.75 + diffuse + specular;
}
