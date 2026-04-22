const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = 8787;
const ALLOWED_HOSTS = new Set([
  'nominatim.openstreetmap.org',
]);

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function send(res, code, body, headers = {}) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders(), ...headers });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  if (u.pathname === '/health') {
    return send(res, 200, 'ok', { 'Content-Type': 'text/plain; charset=utf-8' });
  }

  if (u.pathname !== '/proxy') {
    return send(res, 404, 'Not found');
  }

  const target = u.searchParams.get('url');
  if (!target) {
    return send(res, 400, 'Missing url');
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch (e) {
    return send(res, 400, 'Invalid url');
  }

  if (!ALLOWED_HOSTS.has(targetUrl.hostname)) {
    return send(res, 403, 'Host not allowed');
  }

  const lib = targetUrl.protocol === 'https:' ? https : http;
  const proxied = lib.request(
    {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      path: `${targetUrl.pathname}${targetUrl.search}`,
      method: 'GET',
      headers: {
        'User-Agent': 'LocalGeocodeProxy/1.0',
        'Accept': 'application/json',
      },
    },
    (pRes) => {
      res.writeHead(pRes.statusCode || 502, {
        ...corsHeaders(),
        'Content-Type': pRes.headers['content-type'] || 'application/json',
      });
      pRes.pipe(res);
    }
  );

  proxied.on('error', () => {
    send(res, 502, 'Proxy error');
  });
  proxied.end();
});

server.listen(PORT, () => {
  console.log(`Geocode proxy running at http://127.0.0.1:${PORT}/proxy?url=<ENCODED_URL>`);
  console.log(`Health check: http://127.0.0.1:${PORT}/health`);
});
