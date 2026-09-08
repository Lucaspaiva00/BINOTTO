import type { VehicleProfile } from "@/constants/vehicleCatalog";

/**
 * Registry for licensed GLB files. A model only becomes available when its
 * `assetPath` is set and the corresponding file exists in public/models.
 *
 * Keeping this separate from the vehicle-name catalogue prevents the UI from
 * claiming that a category-shaped fallback is an official vehicle model.
 */
export type VehicleAsset = {
  id: string;
  label: string;
  terms: string[];
  assetPath?: string;
  attribution?: string;
  profile: VehicleProfile;
  /** Maps the mesh names inside the GLB to Binotto inspection part ids. */
  partNodes?: Record<string, string[]>;
};

export const VEHICLE_ASSETS: VehicleAsset[] = [
  { id: "fiat-argo", label: "Fiat Argo", terms: ["fiat argo", "argo"], assetPath: "/models/fiat-argo.optimized.glb", attribution: "Modelo Fiat Argo por wjmatos · CC BY 4.0", profile: { category: "hatch", label: "Hatch", scale: [1, 1, 1] } },
  { id: "chevrolet-onix", label: "Chevrolet Onix", terms: ["chevrolet onix", "onix"], assetPath: "/models/chevrolet-onix.optimized.glb", attribution: "Modelo Chevrolet Onix por uzb_rx7 · CC BY 4.0", profile: { category: "hatch", label: "Hatch", scale: [1, 1, 1] } },
  { id: "hyundai-hb20", label: "Hyundai HB20", terms: ["hyundai hb20", "hb20"], assetPath: "/models/hyundai-hb20.optimized.glb", attribution: "Modelo Hyundai HB20 por Nieve5677 · CC BY 4.0", profile: { category: "hatch", label: "Hatch", scale: [1, 1, 1] } },
  { id: "volkswagen-gol", label: "Volkswagen Gol", terms: ["volkswagen gol", "vw gol", "gol"], profile: { category: "hatch", label: "Hatch", scale: [1, 1, 1] } },
  { id: "jeep-compass", label: "Jeep Compass", terms: ["jeep compass", "compass"], profile: { category: "suv", label: "SUV", scale: [1, 1, 1] } },
  { id: "fiat-strada", label: "Fiat Strada", terms: ["fiat strada", "strada"], profile: { category: "pickup", label: "Picape", scale: [1, 1, 1] } },
];

export function resolveVehicleAsset(model?: string | null): VehicleAsset | undefined {
  const normalized = model?.toLocaleLowerCase("pt-BR") ?? "";
  return VEHICLE_ASSETS.find((asset) => asset.terms.some((term) => normalized.includes(term)));
}

export function hasRealVehicleAsset(model?: string | null) {
  return Boolean(resolveVehicleAsset(model)?.assetPath);
}
