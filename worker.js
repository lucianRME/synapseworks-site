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
    const pathname = new URL(request.url).pathname.replace(/\/$/, '') || '/';
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
