import { supabase } from "@/lib/supabase";

export type Stage = {
  id: string;
  name: string;
  color: string;
  position: number;
};

export async function fetchStages(): Promise<Stage[]> {
  const { data, error } = await supabase
    .from("stages")
    .select("id,name,color,position")
    .order("position", { ascending: true });

  if (error) throw error;
  return (data as unknown as Stage[]) ?? [];
}

export async function updateStage(
  id: string,
  input: Partial<{ name: string; color: string; position: number }>
): Promise<Stage> {
  const { error } = await supabase
    .from("stages")
    .update(input)
    .eq("id", id);

  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("stages")
    .select("id,name,color,position")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  return data as unknown as Stage;
}

export async function createStage(input: {
  id: string;
  name: string;
  color: string;
  position: number;
}): Promise<Stage> {
  const { error } = await supabase.from("stages").insert(input);
  if (error) throw error;
  return input as Stage;
}

export async function deleteStage(id: string): Promise<void> {
  const { error } = await supabase.from("stages").delete().eq("id", id);
  if (error) throw error;
}