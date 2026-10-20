const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function parseTimes(value) {
  const times = value.split(',').map((part) => part.trim()).filter(Boolean).map(parseTime);
  if (times.length === 0) {
    throw new Error('SCHEDULE_TIMES precisa ter pelo menos um horário.');
  }
  return [...new Map(times.map((time) => [time.label, time])).values()].sort(
    (first, second) => first.minutesOfDay - second.minutesOfDay,
  );
}

export function nextOccurrence(times, from) {
  return occurrences(times, from, [0, 1]).find((candidate) => candidate > from);
}

export function previousOccurrence(times, from) {
  return occurrences(times, from, [-1, 0]).findLast((candidate) => candidate <= from);
}

export function isOutdated(lastRunAt, times, now) {
  return !lastRunAt || lastRunAt < previousOccurrence(times, now);
}

function parseTime(text) {
  const match = TIME_PATTERN.exec(text);
  if (!match) {
    throw new Error(`Horário inválido em SCHEDULE_TIMES: "${text}". Use o formato HH:MM.`);
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return Object.freeze({
    hour,
    minute,
    minutesOfDay: hour * 60 + minute,
    label: `${String(hour).padStart(2, '0')}:${match[2]}`,
  });
}

function occurrences(times, reference, dayOffsets) {
  return dayOffsets.flatMap((dayOffset) => times.map((time) => atTime(reference, dayOffset, time)));
}

function atTime(reference, dayOffset, { hour, minute }) {
  const date = new Date(reference);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}
