import { supabase } from "@/lib/supabase";

export async function generateId(prefix: "CON" | "PRY" | "QUO" | "FIL" | "PHO" | "CTR" | "DSN" | "RCP" | "CUS" | "TEA"): Promise<string> {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const pattern = `${prefix}${yy}${mm}`;

  const tableMap: Record<string, string> = {
    CON: "contacts", PRY: "projects", QUO: "quotes",
    FIL: "project_files", PHO: "project_photos", CTR: "contracts", DSN: "designs",
    RCP: "payment_receipts", CUS: "customers", TEA: "team",
  };
  const table = tableMap[prefix];

  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .like("id", `${pattern}%`);

  if (error) throw error;

  // El conteo se reutiliza tras borrados: avanza hasta encontrar un id libre.
  let seq = (count ?? 0) + 1;
  for (;;) {
    const id = `${pattern}${seq.toString().padStart(2, "0")}`;
    const { data, error: existsError } = await supabase
      .from(table)
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (existsError) throw existsError;
    if (!data) return id;
    seq += 1;
  }
}
