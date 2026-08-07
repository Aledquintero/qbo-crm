import { supabase } from "@/lib/supabase";
import { generateId } from "./id";

export type DbContract = {
  id: string; project_id: string; filename: string; storage_path: string; created_at: string;
};

export async function fetchContracts(projectId: string): Promise<DbContract[]> {
  const { data } = await supabase.from("contracts").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
  return (data ?? []) as DbContract[];
}

export async function createContract(input: { project_id: string; file: File }): Promise<DbContract> {
  const id = await generateId("CTR");
  const storagePath = `${input.project_id}/contracts/${id}_${input.file.name}`;
  const { error: uploadError } = await supabase.storage.from("project-files").upload(storagePath, input.file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase.from("contracts").insert({ id, project_id: input.project_id, filename: input.file.name, storage_path: storagePath }).select().single();
  if (error) { await supabase.storage.from("project-files").remove([storagePath]); throw error; }
  return data as DbContract;
}

export async function deleteContract(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from("project-files").remove([storagePath]);
  await supabase.from("contracts").delete().eq("id", id);
}

export async function getContractUrl(storagePath: string): Promise<string> {
  const { data } = await supabase.storage.from("project-files").createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? "";
}
