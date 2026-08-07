import { supabase } from "@/lib/supabase";

export type DbQuotation = {
  id: string;
  project_id: string;
  name: string;
  value: number | null;
  date: string | null;
  created_at: string;
};

export async function fetchQuotations(projectId: string): Promise<DbQuotation[]> {
  const { data, error } = await supabase
    .from("quotations")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as DbQuotation[];
}

export async function createQuotation(input: {
  project_id: string;
  name: string;
  value: number;
}): Promise<DbQuotation> {
  const { data, error } = await supabase
    .from("quotations")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as DbQuotation;
}

export async function deleteQuotation(id: string): Promise<void> {
  const { error } = await supabase.from("quotations").delete().eq("id", id);
  if (error) throw error;
}
