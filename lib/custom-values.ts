// Valores de campos personalizados: Supabase (custom_values) con fallback local.
// Si la tabla no existe (0003 pendiente), funciona solo en este navegador.
import { supabase } from "@/lib/supabase";

export type CustomEntity = "project" | "contact";

const LS_KEY = "qbo_custom_values";
let cloud: "unknown" | "ok" | "off" = "unknown";

function readLS(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function writeLS(m: Record<string, string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(m));
  } catch {}
}

const k = (e: CustomEntity, id: string, f: string) => `${e}:${id}:${f}`;

export async function fetchCustomValues(entity: CustomEntity, entityId: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (cloud !== "off") {
    try {
      const { data, error } = await supabase
        .from("custom_values")
        .select("field_id,value")
        .eq("entity", entity)
        .eq("entity_id", entityId);
      if (error) throw error;
      cloud = "ok";
      for (const r of (data ?? []) as { field_id: string; value: string | null }[]) {
        if (r.value != null) out[r.field_id] = r.value;
      }
      return out;
    } catch {
      cloud = "off";
    }
  }
  const all = readLS();
  for (const [key, v] of Object.entries(all)) {
    const [e, id, ...rest] = key.split(":");
    if (e === entity && id === entityId) out[rest.join(":")] = v;
  }
  return out;
}

export async function saveCustomValue(entity: CustomEntity, entityId: string, fieldId: string, value: string): Promise<void> {
  if (cloud !== "off") {
    try {
      const { error } = await supabase
        .from("custom_values")
        .upsert({ entity, entity_id: entityId, field_id: fieldId, value, updated_at: new Date().toISOString() },
          { onConflict: "entity,entity_id,field_id" });
      if (error) throw error;
      cloud = "ok";
      return;
    } catch {
      cloud = "off";
    }
  }
  const all = readLS();
  all[k(entity, entityId, fieldId)] = value;
  writeLS(all);
}
