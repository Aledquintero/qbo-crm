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
  probability: number | null;
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
  probability: number | null;
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
  probability?: number;
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
      probability: input.probability ?? null,
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
  probability: number;
}>): Promise<Project> {
  const { error } = await supabase
    .from("projects")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("projects")
    .select("*, contact:contacts(name, surname)")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  return toProject(data as unknown as ProjectWithContact);
}