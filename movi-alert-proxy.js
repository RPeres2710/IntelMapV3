const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = Number(process.env.MOVI_ALERT_PROXY_PORT || 8790);
const BASE_URL = process.env.MOVI_ALERT_BASE_URL || 'https://movi-alert.movisafe-americalatina.com';

const ALERTS_PATH = process.env.MOVI_ALERT_ALERTS_PATH || '/index.php/admin/view_incidents';
const LOGIN_PATH = process.env.MOVI_ALERT_LOGIN_PATH || '/index.php/';

const USERNAME = process.env.MOVI_ALERT_USER || '';
const PASSWORD = process.env.MOVI_ALERT_PASS || '';
const STATIC_COOKIE = process.env.MOVI_ALERT_COOKIE || '';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj, null, 2);
  res.writeHead(code, {
    ...corsHeaders(),
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function sendText(res, code, body) {
  res.writeHead(code, { ...corsHeaders(), 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(body);
}

function pickSetCookies(headers) {
  const v = headers['set-cookie'];
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [String(v)];
}

function mergeCookies(jar, setCookieHeaders) {
  const map = new Map();
  const add = (cookiePair) => {
    const idx = cookiePair.indexOf('=');
    if (idx <= 0) return;
    const name = cookiePair.slice(0, idx).trim();
    const value = cookiePair.slice(idx + 1).trim();
    if (!name) return;
    map.set(name, value);
  };

  String(jar || '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach(add);

  (setCookieHeaders || []).forEach((sc) => {
    const pair = String(sc || '').split(';')[0];
    if (pair) add(pair);
  });

  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

function requestUrl(targetUrl, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(targetUrl);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: `${u.pathname}${u.search}`,
        method: opts.method || 'GET',
        headers: {
          'User-Agent': 'MoviAlertProxy/1.0',
          'Accept': opts.accept || '*/*',
          ...(opts.headers || {}),
        },
      },
      (pRes) => {
        const chunks = [];
        pRes.on('data', (c) => chunks.push(c));
        pRes.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({
            status: pRes.statusCode || 0,
            headers: pRes.headers || {},
            body,
          });
        });
      }
    );
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

function extractLoginForm(html, baseUrl) {
  const h = String(html || '');
  const formRe = /<form\b[^>]*>[\s\S]*?<\/form>/gi;
  const forms = h.match(formRe) || [];
  const scoreForm = (f) => (/type\s*=\s*["']password["']/i.test(f) ? 10 : 0) + (/login|sign in|entrar/i.test(f) ? 2 : 0);
  const best = forms.map((f) => ({ f, s: scoreForm(f) })).sort((a, b) => b.s - a.s)[0]?.f;
  if (!best) return null;

  const actionMatch = best.match(/\baction\s*=\s*["']([^"']+)["']/i);
  const action = actionMatch ? actionMatch[1] : '';
  const actionUrl = new URL(action || LOGIN_PATH, baseUrl).toString();

  const inputRe = /<input\b[^>]*>/gi;
  const inputs = best.match(inputRe) || [];
  const fields = {};
  let userField = '';
  let passField = '';

  inputs.forEach((tag) => {
    const name = (tag.match(/\bname\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
    if (!name) return;
    const type = ((tag.match(/\btype\s*=\s*["']([^"']+)["']/i) || [])[1] || '').toLowerCase();
    const value = (tag.match(/\bvalue\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
    fields[name] = value;
    if (!userField && (type === 'email' || type === 'text') && !/pass/i.test(name)) userField = name;
    if (!passField && type === 'password') passField = name;
  });

  if (!passField) {
    const fallbackPass = Object.keys(fields).find((k) => /pass/i.test(k));
    if (fallbackPass) passField = fallbackPass;
  }

  return { actionUrl, fields, userField, passField };
}

function parseMarkersFromHtml(html) {
  const h = String(html || '');
  const idx = h.indexOf('var markers = [');
  if (idx < 0) return [];
  const start = h.indexOf('[', idx);
  if (start < 0) return [];

  let depth = 0;
  let inStr = false;
  let escape = false;
  for (let i = start; i < h.length; i++) {
    const ch = h[i];
    if (inStr) {
      if (escape) {
        escape = false;
      } else if (ch === '\\\\') {
        escape = true;
      } else if (ch === '"') {
        inStr = false;
      }
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === '[') depth++;
    if (ch === ']') depth--;
    if (depth === 0) {
      const jsonText = h.slice(start, i + 1);
      try {
        const arr = JSON.parse(jsonText);
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    }
  }
  return [];
}

function looksLikeLoginPage(html) {
  const h = String(html || '').toLowerCase();
  if (!h) return false;
  const hasPasswordInput = h.includes('type="password"') || h.includes("type='password'");
  const hasEmailField = h.includes('name="email"') || h.includes("name='email'");
  const hasLoginTitle = h.includes('>login<') || h.includes('>login ');
  return hasPasswordInput && hasEmailField && hasLoginTitle;
}

let cookieJar = STATIC_COOKIE || '';
let lastLoginAt = 0;

async function ensureSession() {
  if (STATIC_COOKIE) return;
  const now = Date.now();
  if (cookieJar && now - lastLoginAt < 10 * 60_000) return; // 10 min
  if (!USERNAME || !PASSWORD) {
    throw new Error('Missing MOVI_ALERT_USER / MOVI_ALERT_PASS (or MOVI_ALERT_COOKIE).');
  }

  // 1) Load login page (discover form + collect initial cookies)
  const loginUrl = new URL(LOGIN_PATH, BASE_URL).toString();
  const loginPage = await requestUrl(loginUrl, { method: 'GET', accept: 'text/html' });
  cookieJar = mergeCookies(cookieJar, pickSetCookies(loginPage.headers));

  const form = extractLoginForm(loginPage.body, BASE_URL);
  if (!form || !form.passField) {
    throw new Error('Could not auto-detect login form. Set MOVI_ALERT_COOKIE or provide a more specific MOVI_ALERT_LOGIN_PATH.');
  }
  if (!form.userField) {
    throw new Error('Could not auto-detect username/email field on login form.');
  }

  // 2) Post credentials
  const params = new URLSearchParams(form.fields || {});
  params.set(form.userField, USERNAME);
  params.set(form.passField, PASSWORD);

  const postRes = await requestUrl(form.actionUrl, {
    method: 'POST',
    accept: 'text/html',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      'Cookie': cookieJar,
      'Referer': loginUrl,
    },
    body: params.toString(),
  });
  cookieJar = mergeCookies(cookieJar, pickSetCookies(postRes.headers));
  if (looksLikeLoginPage(postRes.body)) {
    throw new Error('Login failed (still on login page). Check credentials or login path.');
  }
  lastLoginAt = Date.now();
}

async function fetchAlerts() {
  await ensureSession();
  const alertsUrl = new URL(ALERTS_PATH, BASE_URL).toString();
  const res = await requestUrl(alertsUrl, {
    method: 'GET',
    accept: 'text/html',
    headers: cookieJar ? { 'Cookie': cookieJar } : {},
  });
  cookieJar = mergeCookies(cookieJar, pickSetCookies(res.headers));

  if (res.status >= 300 && res.status < 400 && res.headers.location) {
    // Follow one redirect (common after login)
    const redirected = await requestUrl(new URL(res.headers.location, BASE_URL).toString(), {
      method: 'GET',
      accept: 'text/html',
      headers: cookieJar ? { 'Cookie': cookieJar } : {},
    });
    cookieJar = mergeCookies(cookieJar, pickSetCookies(redirected.headers));
    if (looksLikeLoginPage(redirected.body)) {
      throw new Error('Not authenticated (redirected to login).');
    }
    return parseMarkersFromHtml(redirected.body);
  }

  if (res.status !== 200) {
    throw new Error(`Alerts fetch failed: HTTP ${res.status}`);
  }

  if (looksLikeLoginPage(res.body)) {
    throw new Error('Not authenticated (alerts page is login).');
  }
  return parseMarkersFromHtml(res.body);
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  if (u.pathname === '/health') {
    return sendText(res, 200, 'ok');
  }

  if (u.pathname === '/alerts') {
    try {
      const markers = await fetchAlerts();
      return sendJson(res, 200, { baseUrl: BASE_URL, count: markers.length, items: markers });
    } catch (e) {
      return sendJson(res, 500, { error: String(e && e.message ? e.message : e), hint: 'Set MOVI_ALERT_COOKIE or MOVI_ALERT_USER/MOVI_ALERT_PASS env vars.' });
    }
  }

  return sendText(res, 404, 'Not found');
});

server.listen(PORT, () => {
  console.log(`Movi-Alert proxy running at http://127.0.0.1:${PORT}`);
  console.log(`- Health: http://127.0.0.1:${PORT}/health`);
  console.log(`- Alerts: http://127.0.0.1:${PORT}/alerts`);
});
