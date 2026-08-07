import { supabase } from "@/lib/supabase";
import { generateId } from "./id";

export type DbDesign = {
  id: string; project_id: string; filename: string; storage_path: string; created_at: string;
};

export async function fetchDesigns(projectId: string): Promise<DbDesign[]> {
  const { data } = await supabase.from("designs").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
  return (data ?? []) as DbDesign[];
}

export async function createDesign(input: { project_id: string; file: File }): Promise<DbDesign> {
  const id = await generateId("DSN");
  const storagePath = `${input.project_id}/designs/${id}_${input.file.name}`;
  const { error: uploadError } = await supabase.storage.from("project-files").upload(storagePath, input.file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase.from("designs").insert({ id, project_id: input.project_id, filename: input.file.name, storage_path: storagePath }).select().single();
  if (error) { await supabase.storage.from("project-files").remove([storagePath]); throw error; }
  return data as DbDesign;
}

export async function deleteDesign(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from("project-files").remove([storagePath]);
  await supabase.from("designs").delete().eq("id", id);
}

export async function getDesignUrl(storagePath: string): Promise<string> {
  const { data } = await supabase.storage.from("project-files").createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? "";
}
