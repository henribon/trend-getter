const LOCALE = 'pt-BR';
const DAY_MS = 24 * 60 * 60 * 1000;

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'short', timeStyle: 'short' });
const timeFormat = new Intl.DateTimeFormat(LOCALE, { timeStyle: 'short' });
const dayFormat = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit' });
const countFormat = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 });

export function formatDateTime(iso) {
  return dateTimeFormat.format(new Date(iso));
}

export function formatScheduledTime(iso) {
  const date = new Date(iso);
  return `${relativeDay(date)} às ${timeFormat.format(date)}`;
}

export function formatTweetCount(value) {
  return value === null || value === undefined ? '' : `${countFormat.format(value)} posts`;
}

export function formatList(items) {
  return new Intl.ListFormat(LOCALE, { type: 'conjunction' }).format(items);
}

export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function relativeDay(date) {
  const today = startOfDay(new Date());
  const difference = Math.round((startOfDay(date) - today) / DAY_MS);
  if (difference === 0) {
    return 'hoje';
  }
  return difference === 1 ? 'amanhã' : dayFormat.format(date);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
