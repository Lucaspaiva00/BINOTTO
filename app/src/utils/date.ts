type DateLocale = "pt-BR" | "it-IT" | "fr-FR" | "en-US";

export function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function parseApiDate(date: string | Date) {
  return new Date(date);
}

export function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

export function formatDate(
  date: Date | string,
  locale: DateLocale | string = "pt-BR"
) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseApiDate(date));
}

export function formatLongDate(
  date: Date | string,
  locale: DateLocale | string = "pt-BR"
) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parseApiDate(date));
}

export function formatMonthYear(
  date: Date | string,
  locale: DateLocale | string = "pt-BR",
  capitalize = false
) {
  const formatted = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(parseApiDate(date));

  if (!capitalize) {
    return formatted;
  }

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatTime(
  date: Date | string,
  locale: DateLocale | string = "pt-BR"
) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parseApiDate(date));
}

export const formatArrivalTime = (date: Date) => {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function formatHour(time?: string | null) {
  if (!time) return "--";

  return time.slice(0, 5);
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth()
  );
}

export function isToday(date: Date) {
  return isSameDay(date, new Date());
}
