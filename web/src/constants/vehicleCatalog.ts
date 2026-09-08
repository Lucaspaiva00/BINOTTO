export type VehicleCategory = "hatch" | "sedan" | "suv" | "pickup" | "universal";
export type VehicleProfile = { category: VehicleCategory; label: string; scale: [number, number, number] };
export const VEHICLE_MODELS = ["Chevrolet Onix", "Chevrolet Onix Plus", "Chevrolet Tracker", "Fiat Argo", "Fiat Cronos", "Fiat Mobi", "Fiat Strada", "Honda Civic", "Honda City", "Honda HR-V", "Hyundai Creta", "Hyundai HB20", "Hyundai HB20S", "Jeep Compass", "Nissan Kicks", "Renault Duster", "Renault Kwid", "Toyota Corolla", "Toyota Hilux", "Volkswagen Amarok", "Volkswagen Gol", "Volkswagen Nivus", "Volkswagen Polo", "Volkswagen T-Cross", "Volkswagen Virtus"] as const;
const RULES: Array<{ terms: string[]; profile: VehicleProfile }> = [
  { terms: ["strada", "hilux", "amarok", "ranger", "s10", "montana", "frontier"], profile: { category: "pickup", label: "Picape", scale: [1.04, .94, 1.18] } },
  { terms: ["compass", "creta", "tracker", "kicks", "t-cross", "nivus", "hr-v", "duster", "renegade"], profile: { category: "suv", label: "SUV", scale: [1.08, 1.18, 1.08] } },
  { terms: ["civic", "corolla", "virtus", "cron", "onix plus", "hb20s", "city", "sentra"], profile: { category: "sedan", label: "Sedã", scale: [1, .98, 1.14] } },
  { terms: ["gol", "onix", "hb20", "argo", "mobi", "kwid", "polo", "yaris"], profile: { category: "hatch", label: "Hatch", scale: [.94, .92, .94] } },
];
export function resolveVehicleProfile(model?: string | null): VehicleProfile { const value = model?.toLocaleLowerCase("pt-BR") ?? ""; return RULES.find((rule) => rule.terms.some((term) => value.includes(term)))?.profile ?? { category: "universal", label: "Universal", scale: [1, 1, 1] }; }
