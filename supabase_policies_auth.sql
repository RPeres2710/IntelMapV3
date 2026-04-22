-- AUTH policies (recommended): only authenticated users can read/write
alter table public.ocorrencias enable row level security;

drop policy if exists "auth read" on public.ocorrencias;
drop policy if exists "auth write" on public.ocorrencias;
drop policy if exists "auth update" on public.ocorrencias;

create policy "auth read"
on public.ocorrencias
for select
to authenticated
using (true);

create policy "auth write"
on public.ocorrencias
for insert
to authenticated
with check (true);

create policy "auth update"
on public.ocorrencias
for update
to authenticated
using (true)
with check (true);

