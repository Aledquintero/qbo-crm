import { supabase } from "@/lib/supabase";

export type DbPayment = {
  id: string;
  project_id: string;
  monto: number | null;
  fecha: string | null;
  estado: "pendiente" | "pagado";
  pagado_por: string | null;
  num_transferencia: string | null;
  created_at: string;
};

export async function fetchPayments(projectId: string): Promise<DbPayment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as DbPayment[];
}

export async function createPayment(input: {
  project_id: string;
  monto: number;
  fecha: string;
  pagado_por?: string;
  num_transferencia?: string;
}): Promise<DbPayment> {
  const { data, error } = await supabase
    .from("payments")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as DbPayment;
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw error;
}
