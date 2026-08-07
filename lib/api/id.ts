import { supabase } from "@/lib/supabase";

export async function generateId(prefix: "CON" | "PRY" | "INV" | "QUO" | "FIL" | "PHO" | "CTR" | "DSN" | "RCP"): Promise<string> {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const pattern = `${prefix}${yy}${mm}`;

  const tableMap: Record<string, string> = {
    CON: "contacts", PRY: "projects", INV: "invoices", QUO: "quotes",
    FIL: "project_files", PHO: "project_photos", CTR: "contracts", DSN: "designs",
    RCP: "payment_receipts",
  };
  const table = tableMap[prefix];

  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .like("id", `${pattern}%`);

  if (error) throw error;

  const seq = ((count ?? 0) + 1).toString().padStart(2, "0");
  return `${pattern}${seq}`;
}
