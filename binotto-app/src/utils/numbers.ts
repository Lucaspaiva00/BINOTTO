export const normalizePhone = (value?: string | null) => {
  if (!value) return null;

  const digits = value.replace(/\D/g, "");

  return digits ? `+${digits}` : null;
};