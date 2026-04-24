// Local config (committed): safe defaults only.
// If you need to override with real Supabase credentials, edit this file
// OR create `config.private.js` (ignored by git) based on `config.private.example.js`.
window.APP_CONFIG = window.APP_CONFIG || {};
window.APP_CONFIG.supabase = window.APP_CONFIG.supabase || {};

window.APP_CONFIG.supabase.enabled = true;
window.APP_CONFIG.supabase.url = "https://pjktbhjzgsbxfxbfxuai.supabase.co";
window.APP_CONFIG.supabase.anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqa3RiaGp6Z3NieGZ4YmZ4dWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTE4MTUsImV4cCI6MjA5MjQ2NzgxNX0.J7Pn1-KstU-a5LYUURwMPZKD0tE_MR6LQX06zJi3JKE";
window.APP_CONFIG.supabase.tableOcorrencias = "ocorrencias";

// Geocoding overrides (optional)
// window.APP_CONFIG.geo = window.APP_CONFIG.geo || {};
// window.APP_CONFIG.geo.proxyUrls = ["https://YOUR-WORKER.workers.dev/proxy?url="];
