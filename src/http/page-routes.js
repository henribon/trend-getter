import { redirect, sendJson } from './responses.js';

export function registerPageRoutes(router, { settingsService, staticFiles }) {
  router
    .on('GET', '/', ({ request, response }) => {
      if (!settingsService.isConfigured()) {
        redirect(response, '/setup');
        return;
      }
      staticFiles.send('/index.html', request, response);
    })
    .on('GET', '/setup', ({ request, response }) => staticFiles.send('/setup.html', request, response))
    .otherwise(({ request, response, url }) => {
      if (request.method === 'GET' && staticFiles.has(url.pathname)) {
        staticFiles.send(url.pathname, request, response);
        return;
      }
      sendJson(response, 404, { error: 'Recurso não encontrado.' });
    });
}
