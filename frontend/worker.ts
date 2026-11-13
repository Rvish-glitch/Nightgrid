export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status === 404 && !url.pathname.includes('.')) {
        return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
      }
      return response;
    } catch {
      return env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    }
  },
};
