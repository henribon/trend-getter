import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const CONTENT_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
]);

const SECURITY_HEADERS = Object.freeze({
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; frame-ancestors 'none'",
});

export class StaticFiles {
  #files;

  constructor(files) {
    this.#files = files;
  }

  static async load(directory) {
    const entries = await readdir(directory, { recursive: true, withFileTypes: true });
    const files = await Promise.all(
      entries.filter((entry) => entry.isFile()).map((entry) => loadFile(directory, path.join(entry.parentPath, entry.name))),
    );
    return new StaticFiles(new Map(files));
  }

  has(urlPath) {
    return this.#files.has(urlPath);
  }

  send(urlPath, request, response) {
    const file = this.#files.get(urlPath);
    if (request.headers['if-none-match'] === file.etag) {
      response.writeHead(304, { ETag: file.etag });
      response.end();
      return;
    }
    response.writeHead(200, file.headers);
    response.end(file.body);
  }
}

async function loadFile(root, filePath) {
  const body = await readFile(filePath);
  const etag = `"${createHash('sha1').update(body).digest('base64url')}"`;
  const urlPath = `/${path.relative(root, filePath).split(path.sep).join('/')}`;
  const headers = {
    ...SECURITY_HEADERS,
    'Content-Type': CONTENT_TYPES.get(path.extname(filePath)) ?? 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control': 'no-cache',
    ETag: etag,
  };
  return [urlPath, { body, etag, headers }];
}
