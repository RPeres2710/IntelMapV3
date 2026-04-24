// Local config (committed): safe defaults only.
// If you need to override with real Supabase credentials, edit this file
// OR create `config.private.js` (ignored by git) based on `config.private.example.js`.
window.APP_CONFIG = window.APP_CONFIG || {};
window.APP_CONFIG.supabase = window.APP_CONFIG.supabase || {};

window.APP_CONFIG.supabase.enabled = false;
window.APP_CONFIG.supabase.url = "";
window.APP_CONFIG.supabase.anonKey = "";

// Geocoding overrides (optional)
// window.APP_CONFIG.geo = window.APP_CONFIG.geo || {};
// window.APP_CONFIG.geo.proxyUrls = ["https://YOUR-WORKER.workers.dev/proxy?url="];
