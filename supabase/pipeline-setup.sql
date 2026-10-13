-- ============================================================
-- PIPELINE: etapas en la BD + antigüedad por etapa
-- Ejecutar UNA VEZ en Supabase → SQL Editor → Run.
-- La app usa la anon key sin login, por eso la política es `to anon`.
-- ============================================================

-- 1) El catálogo de etapas debe ser escribible por la app
alter table public.stages enable row level security;

drop policy if exists "anon_all_stages" on public.stages;
create policy "anon_all_stages" on public.stages
  for all to anon
  using (true)
  with check (true);

-- 2) Tipo de etapa: open (flujo) | won (cierre ganado) | lost (cierre perdido)
alter table public.stages
  add column if not exists kind text not null default 'open';

-- 3) Cuándo entró cada proyecto a su etapa actual (alerta de estancamiento).
--    Los existentes parten desde ahora para no marcar todo en rojo el día 1.
alter table public.projects
  add column if not exists stage_updated_at timestamptz;

update public.projects
  set stage_updated_at = now()
  where stage_updated_at is null;
