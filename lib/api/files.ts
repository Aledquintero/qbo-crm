import { supabase } from "@/lib/supabase";

export type DbFile = {
  id: string;
  project_id: string;
  type: "ficha" | "fotos" | "cotizacion" | "contrato" | "diseno" | "pago";
  filename: string;
  storage_path: string;
  valor: number | null;
  created_at: string;
};

export async function fetchFiles(projectId: string): Promise<DbFile[]> {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as DbFile[];
}

export async function createFile(input: {
  project_id: string;
  type: DbFile["type"];
  file: File;
  valor?: number;
}): Promise<DbFile> {
  const storagePath = `${input.project_id}/${input.type}/${input.file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(storagePath, input.file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("files")
    .insert({
      project_id: input.project_id,
      type: input.type,
      filename: input.file.name,
      storage_path: storagePath,
      valor: input.valor ?? null,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from("project-files").remove([storagePath]);
    throw error;
  }

  return data as DbFile;
}

export async function deleteFile(id: string): Promise<void> {
  const { data: file, error: fetchError } = await supabase
    .from("files")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  if (file?.storage_path) {
    await supabase.storage.from("project-files").remove([file.storage_path]);
  }

  const { error } = await supabase.from("files").delete().eq("id", id);
  if (error) throw error;
}

export async function getFileUrl(storagePath: string): Promise<string> {
  const { data } = await supabase.storage
    .from("project-files")
    .createSignedUrl(storagePath, 3600);

  return data?.signedUrl ?? "";
}
