// Dedicated static review surface. No production handlers, services, secrets or databases.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let response;
    if (!['GET', 'HEAD'].includes(request.method)) {
      response = new Response('Preview is read-only.', { status: 403 });
    } else if (url.pathname === '/') {
      response = new Response(null, { status: 302, headers: { Location: '/human-translator/' } });
    } else if (['/products/', '/docs/', '/support/', '/privacy/', '/security/', '/cookie-policy/',
      '/terms/', '/rme-pdf-scanner/', '/apps/synapse/', '/apps/decision-register/',
      '/products/submit-guard/'].includes(url.pathname)) {
      const destination = new URL(url.pathname, 'https://synapseworks.org');
      if (url.pathname === '/rme-pdf-scanner/' && url.searchParams.get('utm_campaign') === 'ht_v01') {
        destination.search = 'utm_source=human_translator&utm_medium=microtool&utm_campaign=ht_v01';
      }
      response = new Response(null, { status: 302, headers: { Location: destination.href } });
    } else if (!(url.pathname.startsWith('/human-translator/')
      || url.pathname.startsWith('/assets/navigation/')
      || ['/styles.css', '/site-shell.css', '/site-navigation.js', '/favicon.ico'].includes(url.pathname))) {
      response = new Response('This preview contains Human Translator only.', { status: 404 });
    } else {
      response = await env.ASSETS.fetch(request);
    }
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    headers.set('X-SynapseWorks-Preview', 'human-translator-read-only');
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }
};
