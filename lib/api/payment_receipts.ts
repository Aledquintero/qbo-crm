import { supabase } from "@/lib/supabase";
import { generateId } from "./id";

export type DbPaymentReceipt = {
  id: string; payment_id: string; filename: string; storage_path: string; created_at: string;
};

export async function createPaymentReceipt(input: { payment_id: string; file: File }): Promise<DbPaymentReceipt> {
  const id = await generateId("RCP");
  const storagePath = `payment-receipts/${id}_${input.file.name}`;
  const { error: uploadError } = await supabase.storage.from("project-files").upload(storagePath, input.file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase.from("payment_receipts").insert({ id, payment_id: input.payment_id, filename: input.file.name, storage_path: storagePath }).select().single();
  if (error) { await supabase.storage.from("project-files").remove([storagePath]); throw error; }
  return data as DbPaymentReceipt;
}

export async function getPaymentReceiptUrl(storagePath: string): Promise<string> {
  const { data } = await supabase.storage.from("project-files").createSignedUrl(storagePath, 3600);
  return data?.signedUrl ?? "";
}
