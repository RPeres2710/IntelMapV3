# Mapeamento (RJ) — Leaflet + CSV + Supabase (opcional)

Projeto front-end (arquivo único `index.html`) com mapa (Leaflet), importação CSV (PapaParse), dashboard (Chart.js) e persistência opcional no Supabase.

## Rodar local

- Use um servidor local (não abra por `file://`).
- No VS Code: extensão **Live Server** → “Go Live”.

## Supabase (backend)

1) No Supabase, crie um projeto e rode o schema:
- `supabase_schema.sql`

2) Habilite as permissões (escolha UMA):
- **rápido (público)**: `supabase_policies_public.sql`
- **recomendado (login)**: `supabase_policies_auth.sql` (vai exigir implementar autenticação no site)

3) Configure as chaves no seu ambiente local:
- Opção 1: edite `config.local.js` (já existe no repo) e preencha `url` / `anonKey` e deixe `enabled = true`
- Opção 2 (recomendado pra não commitar credenciais): copie `config.private.example.js` → `config.private.js` e preencha os valores

`config.private.js` fica no `.gitignore` por padrão.

## Deploy no GitHub Pages

- Suba o repositório normalmente.
- Para o Pages funcionar com Supabase, coloque as credenciais em `config.local.js` (commitado) ou adapte o deploy para injetar um `config.private.js` no build (se você tiver pipeline).

## Pins corretos no GitHub Pages (geocoding)

No GitHub Pages, geocodificar direto no navegador costuma falhar por CORS. Para os pins não ficarem “fora do lugar”, há 2 caminhos:

1) Melhor: sua planilha/CSV já vem com `lat`/`lng` (sem geocode em runtime).
2) Ou: use um proxy CORS e configure `window.APP_CONFIG.geo.proxyUrls`.
3) Alternativa (sem proxy): use um “seed” de cache de geocodificação versionado no repositório.

### Alternativa (recomendada) — Seed de cache (sem proxy)

O app suporta carregar automaticamente um arquivo `geocode_cache_seed.json` (na mesma pasta do `index.html`) e usar essas coordenadas sem precisar geocodificar no GitHub Pages.

Obs.: se sua planilha não tiver endereço completo (rua/número), a geocodificação pode cair no “centro” do bairro/comunidade. O app tenta extrair um local mais específico do campo **TÍTULO** (ex.: “Tiros no Morro do Juramentinho”) para melhorar a precisão, mas o ideal é ter `lat/lng`.

Dica: se você conseguir gerar/armazenar `lat` e `lng` em colunas na própria planilha (mesmo que o “Local” seja um smart chip), o site já lê essas colunas e **não precisa** geocodificar em runtime.

Fluxo:

1) Rode local (com proxy local rodando) e deixe o app geocodificar os endereços.
2) Na sidebar → **Geocodificação** → **Exportar cache** (vai baixar `geocode_cache_seed.json`).
3) Commite esse arquivo no repositório, ao lado do `index.html`.
4) No GitHub Pages, o site vai carregar o seed e os pins já aparecem com coordenadas precisas.

### Proxy CORS (Cloudflare Worker)

- Arquivo: `cloudflare-worker-geocode-proxy.js`
- Depois de publicar o Worker, configure no seu `config.local.js`:
  - `window.APP_CONFIG.geo.proxyUrls = ["https://YOUR-WORKER.workers.dev/proxy?url="];`

### Proxy CORS (Supabase Edge Function)

- Função: `supabase/functions/geocode-proxy/index.ts`
- Deploy (precisa do Supabase CLI):
  - `supabase functions deploy geocode-proxy --no-verify-jwt`
- Depois configure no seu `config.local.js`:
  - `window.APP_CONFIG.geo.proxyUrls = ["https://<PROJECT-REF>.functions.supabase.co/geocode-proxy?url="];`

  - Se você for publicar **somente leitura**, pode habilitar apenas `select` no Supabase (RLS/policy) e usar a `anonKey`.
  - Se você publicar com **insert/update públicos**, qualquer pessoa com o link poderá gravar na tabela (não recomendado).
