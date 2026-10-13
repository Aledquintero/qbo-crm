import { supabase } from "@/lib/supabase";
import { createProjectStorage } from "./storage";

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
  estado: string | null;
  created_at: string;
  updated_at: string;
};

export type QuoteData = {
  numero?: string;
  fecha?: string;
  neto?: number | null;
  iva?: number | null;
  total?: number | null;
};

const api = createProjectStorage<DbQuote>({
  table: "quotes", prefix: "QUO", folder: "quotes", ownerKey: "project_id",
});

export const fetchQuotes = (projectId: string) => api.fetchAll(projectId);

export function createQuote(input: { project_id: string; file: File; extracted: QuoteData }) {
  return api.create(input.project_id, input.file, {
    numero: input.extracted.numero ?? null,
    fecha: input.extracted.fecha ?? null,
    neto: input.extracted.neto ?? null,
    iva: input.extracted.iva ?? null,
    total: input.extracted.total ?? null,
  });
}

export const deleteQuote = (id: string, storagePath: string) => api.remove(id, storagePath);
export const getQuoteUrl = api.getUrl;

/** Marca presupuestos como aprobados (requiere columna `estado` en quotes). */
export async function approveQuotes(ids: string[]): Promise<void> {
  await setQuotesEstado(ids, "aprobado");
}

/** Cambia el estado de un conjunto de presupuestos. */
export async function setQuotesEstado(ids: string[], estado: string): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("quotes")
    .update({ estado, updated_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}
