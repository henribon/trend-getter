import { TrendSourceError } from '../../domain/errors.js';

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_DETAIL_LENGTH = 200;
const BLOCKING_STATUSES = new Set([403, 429, 503]);

export async function requestSource({ fetch, url, headers, label }) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }).catch((error) => {
    throw new TrendSourceError(`Não foi possível acessar ${label}: ${error.cause?.message ?? error.message}`);
  });
  if (!response.ok) {
    throw new TrendSourceError(`${label} respondeu com status ${response.status}${await describeFailure(response)}`);
  }
  return response;
}

async function describeFailure(response) {
  const isHtml = (response.headers.get('content-type') ?? '').includes('html');
  if (isHtml) {
    return BLOCKING_STATUSES.has(response.status) ? ': o site bloqueou o acesso automático.' : '.';
  }
  const body = await response.text().catch(() => '');
  const detail = body.replace(/\s+/g, ' ').trim().slice(0, MAX_DETAIL_LENGTH);
  return detail ? `: ${detail}` : '.';
}
