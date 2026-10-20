import { onRequest as iosInterest } from './functions/api/ios-interest.js';
import { onRequest as iosInterestConfig } from './functions/api/ios-interest-config.js';
import { onRequest as iosInterestEmail } from './functions/api/ios-interest-email.js';

const apiRoutes = {
  '/api/ios-interest': iosInterest,
  '/api/ios-interest-config': iosInterestConfig,
  '/api/ios-interest-email': iosInterestEmail
};

export default {
  fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Branch/version previews have a prefix; the primary workers.dev host stays production.
    if (url.hostname.endsWith('-synapseworks-site.lucianirimie.workers.dev')
      && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return new Response(JSON.stringify({
        ok: false,
        code: 'PREVIEW_READ_ONLY',
        error: 'Write operations are disabled on preview deployments.'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex'
        }
      });
    }
    const pathname = url.pathname.replace(/\/$/, '') || '/';
    const legacyProductRoutes = {
      '/pageharbor': '/rme-pdf-scanner/',
      '/pageharbor/privacy': '/rme-pdf-scanner/privacy/'
    };
    if (legacyProductRoutes[pathname]) {
      const destination = new URL(request.url);
      destination.pathname = legacyProductRoutes[pathname];
      return Response.redirect(destination, 301);
    }
    if (pathname === '/store') {
      const destination = new URL(request.url);
      destination.pathname = '/products/';
      return Response.redirect(destination, 301);
    }
    const handler = apiRoutes[pathname];
    if (handler) return handler({ request, env, ctx });
    return env.ASSETS.fetch(request);
  }
};
