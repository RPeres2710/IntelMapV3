-- PUBLIC demo policies (quick start; not recommended for public deployments)
alter table public.ocorrencias enable row level security;

drop policy if exists "public read" on public.ocorrencias;
drop policy if exists "public write" on public.ocorrencias;
drop policy if exists "public update" on public.ocorrencias;

create policy "public read"
on public.ocorrencias
for select
using (true);

create policy "public write"
on public.ocorrencias
for insert
with check (true);

create policy "public update"
on public.ocorrencias
for update
using (true)
with check (true);

