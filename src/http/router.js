export class Router {
  #routes = new Map();
  #fallback = null;

  on(method, path, handler) {
    this.#routes.set(`${method} ${path}`, handler);
    return this;
  }

  otherwise(handler) {
    this.#fallback = handler;
    return this;
  }

  async handle(request, response) {
    const url = new URL(request.url, 'http://localhost');
    const handler = this.#routes.get(`${request.method} ${url.pathname}`) ?? this.#fallback;
    await handler({ request, response, url });
  }
}
