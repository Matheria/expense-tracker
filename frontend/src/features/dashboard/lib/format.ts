const rub = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const rubPrecise = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Whole-ruble figure for headline numbers (balance, stats). */
export function formatMoney(value: number): string {
  return rub.format(value);
}

/** Kopeck-precise figure for individual transaction amounts. */
export function formatAmount(value: number): string {
  return rubPrecise.format(value);
}

/** Signed amount with the leading +/− used in transaction rows. */
export function formatSigned(value: number, type: 'INCOME' | 'EXPENSE'): string {
  const sign = type === 'INCOME' ? '+' : '−';
  return `${sign}${rubPrecise.format(Math.abs(value))}`;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** "28 июня 2026" style — used in the dashboard header. */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const MONTHS_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

export function monthLabel(monthIndex: number): string {
  return MONTHS_SHORT[monthIndex] ?? '';
}
