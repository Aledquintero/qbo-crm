import { supabase } from "@/lib/supabase";
import { generateId } from "./id";

export type DbQuote = {
  id: string;
  project_id: string;
  filename: string;
  storage_path: string;
  numero: string | null;
  fecha: string | null;
  neto: number | null;
  iva: number | null;
  total: number | null;
  created_at: string;
  updated_at: string;
};

export async function fetchQuotes(projectId: string): Promise<DbQuote[]> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as DbQuote[];
}

type QuoteData = {
  numero?: string;
  fecha?: string;
  neto?: number | null;
  iva?: number | null;
  total?: number | null;
};

export async function createQuote(input: {
  project_id: string;
  file: File;
  extracted: QuoteData;
}): Promise<DbQuote> {
  const id = await generateId("QUO");
  const storagePath = `${input.project_id}/quotes/${id}_${input.file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(storagePath, input.file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      id,
      project_id: input.project_id,
      filename: input.file.name,
      storage_path: storagePath,
      numero: input.extracted.numero ?? null,
      fecha: input.extracted.fecha ?? null,
      neto: input.extracted.neto ?? null,
      iva: input.extracted.iva ?? null,
      total: input.extracted.total ?? null,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from("project-files").remove([storagePath]);
    throw error;
  }

  return data as DbQuote;
}

export async function deleteQuote(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from("project-files").remove([storagePath]);
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) throw error;
}

export async function getQuoteUrl(storagePath: string): Promise<string> {
  const { data } = await supabase.storage
    .from("project-files")
    .createSignedUrl(storagePath, 3600);

  return data?.signedUrl ?? "";
}
