import { supabase } from "@/lib/supabase";
import { generateId } from "./id";

/** Bucket único de Supabase donde viven todos los archivos de proyecto. */
const BUCKET = "project-files";

type IdPrefix = Parameters<typeof generateId>[0];

/** Forma mínima que comparten todas las tablas de archivos. */
export type StoredFile = {
  id: string;
  filename: string;
  storage_path: string;
  created_at: string;
};

type OwnerKey = "project_id" | "payment_id";

/**
 * Fábrica para tablas "una fila = un archivo" (project_files,
 * project_photos, contracts, designs, quotes, payment_receipts).
 *
 * Centraliza: generación de id, ruta de storage, subida con
 * rollback si el insert falla, borrado y URLs firmadas.
 */
export function createProjectStorage<T extends StoredFile>(opts: {
  table: string;
  prefix: IdPrefix;
  folder: string;
  ownerKey: OwnerKey;
}) {
  const { table, prefix, folder, ownerKey } = opts;

  async function fetchAll(ownerId: string): Promise<T[]> {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq(ownerKey, ownerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as T[];
  }

  async function create(ownerId: string, file: File, extra: Record<string, unknown> = {}): Promise<T> {
    const id = await generateId(prefix);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "archivo";
    const storagePath =
      ownerKey === "project_id"
        ? `${ownerId}/${folder}/${id}_${safeName}`
        : `${folder}/${id}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from(table)
      .insert({ id, [ownerKey]: ownerId, filename: file.name, storage_path: storagePath, ...extra })
      .select()
      .single();
    if (error) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      throw error;
    }
    return data as T;
  }

  async function remove(id: string, storagePath: string): Promise<void> {
    // DB primero: si falla, el archivo sigue existiendo (recuperable).
    // Si se borrara Storage primero y fallara la DB, el archivo se perdería.
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath]);
    if (storageError) throw storageError;
  }

  async function getUrl(storagePath: string): Promise<string> {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
    return data?.signedUrl ?? "";
  }

  return { fetchAll, create, remove, getUrl };
}
