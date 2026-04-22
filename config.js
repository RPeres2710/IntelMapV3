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

