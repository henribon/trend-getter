import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isOutdated, nextOccurrence, parseTimes, previousOccurrence } from '../src/domain/schedule.js';

const times = parseTimes('20:00, 8:00, 08:00');
const at = (day, hour, minute = 0) => new Date(2026, 9, day, hour, minute);

test('interpreta, ordena e remove horários repetidos', () => {
  assert.deepEqual(times.map(({ label }) => label), ['08:00', '20:00']);
  assert.throws(() => parseTimes('25:00'), /Horário inválido/);
  assert.throws(() => parseTimes(' , '), /pelo menos um horário/);
});

test('calcula a próxima execução no mesmo dia ou no dia seguinte', () => {
  assert.deepEqual(nextOccurrence(times, at(20, 7, 59)), at(20, 8));
  assert.deepEqual(nextOccurrence(times, at(20, 8)), at(20, 20));
  assert.deepEqual(nextOccurrence(times, at(20, 21)), at(21, 8));
});

test('calcula a execução anterior', () => {
  assert.deepEqual(previousOccurrence(times, at(20, 7)), at(19, 20));
  assert.deepEqual(previousOccurrence(times, at(20, 12)), at(20, 8));
});

test('detecta quando um horário agendado foi perdido', () => {
  const now = at(20, 21);
  assert.equal(isOutdated(null, times, now), true);
  assert.equal(isOutdated(at(20, 9), times, now), true);
  assert.equal(isOutdated(at(20, 20, 1), times, now), false);
});
