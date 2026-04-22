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
- Copie `config.local.example.js` → `config.local.js`
- Preencha `url` (Project URL) e `anonKey` (anon public key) e deixe `enabled = true`

`config.local.js` fica no `.gitignore` por padrão.

## Deploy no GitHub Pages

- Suba o repositório normalmente.
- Para o Pages funcionar, você precisa ter um `config.local.js` no ambiente publicado também.
  - Se você for publicar **somente leitura**, pode habilitar apenas `select` no Supabase (RLS/policy) e usar a `anonKey`.
  - Se você publicar com **insert/update públicos**, qualquer pessoa com o link poderá gravar na tabela (não recomendado).

