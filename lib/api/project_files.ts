import { supabase } from "@/lib/supabase";
import { generateId } from "./id";

export type DbProjectFile = {
  id: string; project_id: string; filename: string; storage_path: string; created_at: string;
};

export async function fetchProjectFiles(projectId: string): Promise<DbProjectFile[]> {
  const { data } = await supabase.from("project_files").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
  return (data ?? []) as DbProjectFile[];
}

export async function createProjectFile(input: { project_id: string; file: File }): Promise<DbProjectFile> {
  const id = await generateId("FIL");
  const storagePath = `${input.project_id}/files/${id}_${input.file.name}`;
  const { error: uploadError } = await supabase.storage.from("project-files").upload(storagePath, input.file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase.from("project_files").insert({ id, project_id: input.project_id, filename: input.file.name, storage_path: storagePath }).select().single();
  if (error) { await supabase.storage.from("project-files").remove([storagePath]); throw error; }
  return data as DbProjectFile;
}

export async function deleteProjectFile(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from("project-files").remove([storagePath]);
  await supabase.from("project_files").delete().eq("id", id);
}

export async function getProjectFileUrl(storagePath: string): Promise<string> {
  const { data } = await supabase.storage.from("project-files").createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? "";
}
