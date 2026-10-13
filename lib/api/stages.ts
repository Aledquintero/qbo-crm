import { supabase } from "@/lib/supabase";

export type Stage = {
  id: string;
  name: string;
  color: string;
  position: number;
  kind?: "open" | "won" | "lost";
};

type StageRow = {
  id: string;
  name: string;
  color: string;
  position: number;
  kind?: string | null;
};

function withKind(row: StageRow): Stage {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    position: row.position,
    kind: row.kind === "won" || row.kind === "lost" ? row.kind : "open",
  };
}

/** Si la columna `kind` aún no existe (SQL pendiente), se reintenta sin ella. */
function isMissingKind(error: { message: string }): boolean {
  return /kind/i.test(error.message);
}

// Memoria de sesión: si la nube ya falló de forma definitiva (RLS o red),
// no se repiten requests condenados en cada montaje. Se resetea al recargar.
let cloud: "unknown" | "ok" | "off" = "unknown";

function cloudOff(): Error {
  return new Error("stages-cloud-off");
}

export async function fetchStages(): Promise<Stage[]> {
  if (cloud === "off") throw cloudOff();
  const full = await supabase
    .from("stages")
    .select("id,name,color,position,kind")
    .order("position", { ascending: true });

  if (!full.error) {
    cloud = "ok";
    return ((full.data ?? []) as unknown as StageRow[]).map(withKind);
  }
  if (!isMissingKind(full.error)) {
    cloud = "off";
    throw full.error;
  }

  const base = await supabase
    .from("stages")
    .select("id,name,color,position")
    .order("position", { ascending: true });

  if (base.error) {
    cloud = "off";
    throw base.error;
  }
  cloud = "ok";
  return ((base.data ?? []) as unknown as StageRow[]).map(withKind);
}

export async function updateStage(
  id: string,
  input: Partial<{ name: string; color: string; position: number; kind: "open" | "won" | "lost" }>
): Promise<Stage> {
  const attempt = async (patch: object) => {
    const { error } = await supabase.from("stages").update(patch).eq("id", id);
    return error;
  };

  let error = await attempt(input);
  if (error && input.kind !== undefined && isMissingKind(error)) {
    const { kind: _dropped, ...rest } = input;
    error = await attempt(rest);
  }
  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("stages")
    .select("id,name,color,position")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  const row = data as unknown as StageRow;
  return withKind({ ...row, kind: input.kind ?? row.kind });
}

export async function createStage(input: {
  id: string;
  name: string;
  color: string;
  position: number;
  kind?: "open" | "won" | "lost";
}): Promise<Stage> {
  const { error } = await supabase.from("stages").insert(input);
  if (error) {
    if (input.kind !== undefined && isMissingKind(error)) {
      const { kind: _dropped, ...rest } = input;
      const retry = await supabase.from("stages").insert(rest);
      if (retry.error) throw retry.error;
    } else {
      throw error;
    }
  }
  return withKind({ ...input, kind: input.kind ?? "open" });
}

export async function deleteStage(id: string): Promise<void> {
  const { error } = await supabase.from("stages").delete().eq("id", id);
  if (error) throw error;
}

/** Siembra inicial en un solo INSERT (1 roundtrip). Lanza si la nube no permite escribir. */
export async function seedStages(
  source: { id: string; name: string; color: string; position: number; kind?: "open" | "won" | "lost" }[]
): Promise<Stage[]> {
  if (cloud === "off") throw cloudOff();
  const rows = source.map((s, i) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    position: s.position ?? i,
    kind: s.kind ?? "open",
  }));
  const { error } = await supabase.from("stages").insert(rows);
  if (error) {
    if (isMissingKind(error as { message: string })) {
      const retry = await supabase
        .from("stages")
        .insert(rows.map(({ kind: _dropped, ...rest }) => rest));
      if (retry.error) {
        cloud = "off";
        throw retry.error;
      }
    } else {
      cloud = "off";
      throw error;
    }
  }
  cloud = "ok";
  return rows.map((r) => withKind({ ...r, position: r.position }));
}
