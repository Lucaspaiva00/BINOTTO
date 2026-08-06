export const COMMON_COUNTRIES = ["BR", "IT", "FR", "ES", "CH", "PT"] as const;
export type CommonCountry = (typeof COMMON_COUNTRIES)[number];
