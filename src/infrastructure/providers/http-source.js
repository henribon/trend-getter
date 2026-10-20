import { TrendSourceError } from '../../domain/errors.js';

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_DETAIL_LENGTH = 200;

export async function requestSource({ fetch, url, headers, label }) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }).catch((error) => {
    throw new TrendSourceError(`Não foi possível acessar ${label}: ${error.cause?.message ?? error.message}`);
  });
  if (!response.ok) {
    throw new TrendSourceError(`${label} respondeu com status ${response.status}${await readDetail(response)}`);
  }
  return response;
}

async function readDetail(response) {
  const body = await response.text().catch(() => '');
  const detail = body.replace(/\s+/g, ' ').trim().slice(0, MAX_DETAIL_LENGTH);
  return detail ? `: ${detail}` : '.';
}
