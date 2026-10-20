import { createServer } from 'node:http';
import { registerApiRoutes } from './api-routes.js';
import { registerPageRoutes } from './page-routes.js';
import { sendError } from './responses.js';
import { Router } from './router.js';

export function createHttpServer(dependencies) {
  const router = new Router();
  registerApiRoutes(router, dependencies);
  registerPageRoutes(router, dependencies);
  return createServer((request, response) => {
    router.handle(request, response).catch((error) => sendError(response, error, dependencies.logger));
  });
}
