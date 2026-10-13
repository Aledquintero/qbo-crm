-- ============================================================
-- QBO CRM — 0002 reconciliación (idempotente, ejecutar UNA VEZ)
-- Supabase → SQL Editor → Run.
-- La DB real usa IDs texto (CON/PRY/QUO/CUS/TEA...) y fue creada a mano;
-- las migraciones 0000/0001 (uuid + quotations) quedaron obsoletas.
-- Este script alinea la DB con db/schema/* sin borrar datos.
-- ============================================================

-- Limpieza fantasma: quotations no la usa la app (usa quotes)
DROP TABLE IF EXISTS public.quotations;

-- Tablas que faltan en 0000 (todas con id texto como genera lib/api/id.ts)
CREATE TABLE IF NOT EXISTS public.quotes (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  filename text NOT NULL,
  storage_path text,
  numero text,
  fecha text,
  neto integer,
  iva integer,
  total integer,
  estado text DEFAULT 'pendiente',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customers (
  id text PRIMARY KEY,
  name text, company text, industry text,
  tier text DEFAULT 'starter', location text,
  contact text, email text, phone text,
  total_revenue integer DEFAULT 0, revenue integer DEFAULT 0,
  active_deals integer DEFAULT 0, deals_count integer DEFAULT 0,
  health_score integer DEFAULT 0, trend text DEFAULT 'stable',
  last_contact text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.team (
  id text PRIMARY KEY,
  name text NOT NULL, role text, email text, phone text,
  deals integer DEFAULT 0, revenue integer DEFAULT 0,
  quota integer DEFAULT 0, change integer DEFAULT 0,
  rank integer DEFAULT 0, status text DEFAULT 'active', avatar text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  filename text NOT NULL, storage_path text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.designs (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  filename text NOT NULL, storage_path text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id text PRIMARY KEY,
  payment_id text REFERENCES public.payments(id) ON DELETE CASCADE,
  filename text NOT NULL, storage_path text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_files (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  filename text NOT NULL, storage_path text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_photos (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  filename text NOT NULL, storage_path text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.stages (
  id text PRIMARY KEY,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#38bdf8',
  position integer NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'open'
);

-- Columnas que solo existían en pipeline-setup / código
ALTER TABLE public.stages ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'open';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS stage_updated_at timestamptz;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS estado text DEFAULT 'pendiente';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS pagado_por text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS num_transferencia text;

-- Un contrato vigente por proyecto (evita multi-contrato de createContract)
CREATE UNIQUE INDEX IF NOT EXISTS contracts_one_per_project
  ON public.contracts (project_id);

-- Bucket único (crearlo si no existe; las policies se gestionan aparte)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;
