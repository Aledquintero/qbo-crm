import { supabase } from "@/lib/supabase";
import type { Project } from "@/data/deals";
import { generateId } from "./id";

export type DbProject = {
  id: string;
  contact_id: string | null;
  company: string;
  email: string | null;
  value: number | null;
  stage: string | null;
  status: "won" | "pending" | "lost";
  close_date: string | null;
  rep: string | null;
  direccion: string | null;
  fecha_visita: string | null;
  fecha_instalacion: string | null;
  stage_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectWithContact = DbProject & {
  contact: { name: string; surname: string } | null;
};

function toProject(db: ProjectWithContact): Project {
  return {
    id: db.id,
    company: db.company,
    contact: db.contact ? `${db.contact.name} ${db.contact.surname}` : "",
    contact_id: db.contact_id,
    email: db.email ?? "",
    value: db.value ?? 0,
    stage: db.stage ?? "lead",
    status: db.status,
    closeDate: db.close_date ?? "",
    rep: db.rep ?? "",
    direccion: db.direccion,
    fecha_visita: db.fecha_visita,
    fecha_instalacion: db.fecha_instalacion,
    stage_updated_at: db.stage_updated_at ?? null,
    created_at: (db as DbProject).created_at ?? undefined,
  };
}

type ProjectRow = {
  id: string;
  contact_id: string;
  company: string;
  email: string | null;
  value: number | null;
  stage: string | null;
  status: string;
  close_date: string | null;
  rep: string | null;
  direccion: string | null;
  fecha_visita: string | null;
  fecha_instalacion: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, contact:contacts(name, surname)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as ProjectWithContact[]).map(toProject);
}

export async function fetchProjectsByContact(contactId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, contact:contacts(name, surname)")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as ProjectWithContact[]).map(toProject);
}

export async function createProject(input: {
  contact_id?: string;
  company: string;
  value?: number;
  stage?: string;
  rep?: string;
  email?: string;
  direccion?: string;
}): Promise<Project> {
  const id = await generateId("PRY");
  const { error } = await supabase
    .from("projects")
    .insert({
      id,
      contact_id: input.contact_id || null,
      company: input.company,
      value: input.value ?? 0,
      stage: input.stage ?? "lead",
      rep: input.rep || null,
      email: input.email || null,
      direccion: input.direccion || null,
    });

  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("projects")
    .select("*, contact:contacts(name, surname)")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  return toProject(data as unknown as ProjectWithContact);
}

async function refetchProject(id: string): Promise<Project> {
  const { data, error: fetchError } = await supabase
    .from("projects")
    .select("*, contact:contacts(name, surname)")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  return toProject(data as unknown as ProjectWithContact);
}

// Si la columna `stage_updated_at` aún no existe (SQL pendiente),
// los cambios de etapa se guardan igual pero sin el sello de fecha.
let stageStampSupported = true;

export async function updateProject(id: string, input: Partial<{
  company: string;
  email: string;
  value: number;
  stage: string;
  status: string;
  close_date: string;
  rep: string;
  direccion: string;
  fecha_visita: string;
  fecha_instalacion: string;
}>): Promise<Project> {
  const basePatch = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  if (input.stage !== undefined && stageStampSupported) {
    const { error } = await supabase
      .from("projects")
      .update({ ...basePatch, stage_updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) return refetchProject(id);
    if (!/stage_updated_at/i.test(error.message ?? "")) throw error;
    stageStampSupported = false;
  }

  const { error } = await supabase
    .from("projects")
    .update(basePatch)
    .eq("id", id);

  if (error) throw error;
  return refetchProject(id);
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}