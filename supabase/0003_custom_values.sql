-- 0003 valores de campos personalizados (idempotente)
CREATE TABLE IF NOT EXISTS public.custom_values (
  entity text NOT NULL CHECK (entity IN ('project','contact')),
  entity_id text NOT NULL,
  field_id text NOT NULL,
  value text,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (entity, entity_id, field_id)
);
