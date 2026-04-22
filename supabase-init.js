import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cfg = (window.APP_CONFIG && window.APP_CONFIG.supabase) ? window.APP_CONFIG.supabase : null;

window.SUPABASE_CLIENT = null;
window.SUPABASE_INIT_ERROR = null;

try {
  const enabled = !!(cfg && cfg.enabled && cfg.url && cfg.anonKey);
  if (enabled) {
    window.SUPABASE_CLIENT = createClient(cfg.url, cfg.anonKey);
  }
} catch (err) {
  window.SUPABASE_INIT_ERROR = String(err && err.message ? err.message : err);
}

