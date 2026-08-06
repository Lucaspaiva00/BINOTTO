export const localeToCurrency: Record<string, 'BRL' | 'EUR'> = {
  'pt-BR': 'BRL',
  'fr-FR': 'EUR',
  'it-IT': 'EUR',
}

export function formatCurrency(
  value: number,
  currency: string = "BRL",
  locale: string = "pt-BR"
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

export function formatCurrencyInput(raw: string, locale: string = "pt-BR") {
  const value = Number(raw || 0) / 100;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseCurrencyInput(value: string) {
  const onlyNumbers = value.replace(/\D/g, "");
  const limited = onlyNumbers.slice(0, 8);
  return limited;
}