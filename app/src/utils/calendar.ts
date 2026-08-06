export function eachDayOfInterval(start: Date, end: Date) {
  const days: Date[] = [];
  const d = new Date(start);

  while (d <= end) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }

  return days;
}

export function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  d.setDate(d.getDate() + diff);

  return d;
}

export function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  const end = new Date(start);

  end.setDate(start.getDate() + 6);

  return end;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date: Date, n: number) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

export function subMonths(date: Date, n: number) {
  return addMonths(date, -n);
}