-- Minimal schema for this app (run in Supabase SQL editor)

create table if not exists public.ocorrencias (
  id text primary key,
  tipo text not null,
  tipo_label text,
  local text,
  lat double precision,
  lng double precision,
  data text,
  hora text,
  grupo text,
  descricao text,
  fonte text,
  gravidade text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ocorrencias_created_at_idx on public.ocorrencias (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ocorrencias_set_updated_at on public.ocorrencias;
create trigger ocorrencias_set_updated_at
before update on public.ocorrencias
for each row
execute function public.set_updated_at();

-- Security (choose ONE approach)
-- Option A (quick demo; NOT recommended for public deployments):
--   alter table public.ocorrencias enable row level security;
--   create policy "public read" on public.ocorrencias for select using (true);
--   create policy "public write" on public.ocorrencias for insert with check (true);
--   create policy "public update" on public.ocorrencias for update using (true) with check (true);

-- Option B (recommended): require authenticated users
--   alter table public.ocorrencias enable row level security;
--   create policy "auth read" on public.ocorrencias for select to authenticated using (true);
--   create policy "auth write" on public.ocorrencias for insert to authenticated with check (true);
--   create policy "auth update" on public.ocorrencias for update to authenticated using (true) with check (true);

