import { CollectionInProgressError, NotConfiguredError, ValidationError } from '../domain/errors.js';

const MAX_BODY_BYTES = 64 * 1024;

export class PayloadTooLargeError extends Error {
  name = 'PayloadTooLargeError';

  constructor() {
    super('O corpo da requisição é grande demais.');
  }
}

const STATUS_BY_ERROR = [
  [ValidationError, 400],
  [NotConfiguredError, 409],
  [CollectionInProgressError, 409],
  [PayloadTooLargeError, 413],
];

export function sendJson(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  });
  response.end(payload);
}

export function redirect(response, location) {
  response.writeHead(302, { Location: location, 'Cache-Control': 'no-store' });
  response.end();
}

export function sendError(response, error, logger) {
  const status = statusFor(error);
  if (status === 500) {
    logger.error(error.stack ?? error.message);
  }
  if (response.headersSent) {
    response.end();
    return;
  }
  sendJson(response, status, { error: status === 500 ? 'Erro interno no servidor.' : error.message });
}

export async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new PayloadTooLargeError();
    }
    chunks.push(chunk);
  }
  return parseBody(Buffer.concat(chunks).toString('utf8'));
}

function parseBody(text) {
  try {
    return JSON.parse(text || '{}');
  } catch {
    throw new ValidationError('O corpo da requisição não é um JSON válido.');
  }
}

function statusFor(error) {
  return STATUS_BY_ERROR.find(([type]) => error instanceof type)?.[1] ?? 500;
}
