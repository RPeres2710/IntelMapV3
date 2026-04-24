// App configuration (override locally as needed)
window.APP_CONFIG = window.APP_CONFIG || {};
window.APP_CONFIG.supabase = window.APP_CONFIG.supabase || {
  enabled: false,
  url: "",
  anonKey: "",
  tableOcorrencias: "ocorrencias",
  maxLoad: 5000,
  bootstrap: {
    load: true,
    seedFromLocalIfEmpty: false,
  },
  sync: {
    onLocalAdd: true,
    onImport: true,
    onExternal: false,
  },
};

// Geocoding/runtime options
window.APP_CONFIG.geo = window.APP_CONFIG.geo || {
  // For GitHub Pages/production, configure a CORS proxy and set:
  // proxyUrls:
  //  - Cloudflare Worker: ["https://YOUR-WORKER.workers.dev/proxy?url="]
  //  - Supabase Edge Fn:  ["https://<PROJECT-REF>.functions.supabase.co/geocode-proxy?url="]
  proxyUrls: [],
  // Optional overrides:
  // useProxyAuto: true,
  // tryDirect: false,
  // fallbackToZone: false,
};
