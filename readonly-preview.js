import site from './worker.js';

const withPreviewHeaders = (response) => {
  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex');
  headers.set('X-SynapseWorks-Preview', 'pr-6-read-only');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

export default {
  async fetch(request, env, ctx) {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return withPreviewHeaders(new Response(JSON.stringify({
        ok: false,
        code: 'PREVIEW_READ_ONLY',
        error: 'Write operations are disabled on preview deployments.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
      }));
    }

    const pathname = new URL(request.url).pathname.replace(/\/$/, '') || '/';
    if (request.method === 'GET' && pathname === '/api/ios-interest') {
      // Read the public count without binding this preview to the production database.
      return withPreviewHeaders(await fetch('https://synapseworks.org/api/ios-interest', {
        method: 'GET',
        redirect: 'error'
      }));
    }
    return withPreviewHeaders(await site.fetch(request, env, ctx));
  }
};
