/**
 * Cloudflare Worker - CORS proxy for Nominatim (OpenStreetMap) geocoding.
 *
 * Route example:
 *   https://YOUR-WORKER.workers.dev/proxy?url=https%3A%2F%2Fnominatim.openstreetmap.org%2Fsearch%3Fformat%3Djsonv2%26limit%3D1%26q%3DRio%2Bde%2BJaneiro
 *
 * Security:
 * - Only allows forwarding to nominatim.openstreetmap.org
 * - Adds CORS headers for browser usage (GitHub Pages)
 */

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Accept,Accept-Language",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function jsonResponse(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (request.method !== "GET") {
      return jsonResponse({ error: "Method not allowed" }, { status: 405, headers: corsHeaders(request) });
    }

    if (url.pathname !== "/proxy") {
      return jsonResponse({ error: "Not found" }, { status: 404, headers: corsHeaders(request) });
    }

    const targetRaw = url.searchParams.get("url") || "";
    if (!targetRaw) {
      return jsonResponse({ error: "Missing url param" }, { status: 400, headers: corsHeaders(request) });
    }

    let target;
    try {
      target = new URL(targetRaw);
    } catch {
      return jsonResponse({ error: "Invalid target URL" }, { status: 400, headers: corsHeaders(request) });
    }

    if (target.protocol !== "https:" || target.hostname !== "nominatim.openstreetmap.org") {
      return jsonResponse({ error: "Target not allowed" }, { status: 403, headers: corsHeaders(request) });
    }

    // Simple caching at the edge
    const cacheKey = new Request(target.toString(), { method: "GET" });
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) {
      const h = new Headers(cached.headers);
      const cors = corsHeaders(request);
      Object.keys(cors).forEach((k) => h.set(k, cors[k]));
      return new Response(cached.body, { status: cached.status, headers: h });
    }

    const upstream = await fetch(target.toString(), {
      headers: {
        // Nominatim policy expects a descriptive UA; CF Workers will supply its own UA,
        // but we add Accept-Language for better results.
        "Accept": "application/json",
        "Accept-Language": request.headers.get("Accept-Language") || "pt-BR",
      },
      cf: { cacheTtl: 3600, cacheEverything: true },
    });

    const body = await upstream.text();
    const headers = new Headers(upstream.headers);
    headers.delete("Set-Cookie");

    // Cache only successful responses for 1h
    if (upstream.ok) {
      const cacheResp = new Response(body, { status: upstream.status, headers });
      ctx.waitUntil(cache.put(cacheKey, cacheResp.clone()));
    }

    const cors = corsHeaders(request);
    Object.keys(cors).forEach((k) => headers.set(k, cors[k]));
    headers.set("Content-Type", headers.get("Content-Type") || "application/json; charset=utf-8");
    return new Response(body, { status: upstream.status, headers });
  },
};

