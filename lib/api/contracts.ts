import { createProjectStorage } from "./storage";

export type DbContract = {
  id: string; project_id: string; filename: string; storage_path: string; created_at: string;
};

const api = createProjectStorage<DbContract>({
  table: "contracts", prefix: "CTR", folder: "contracts", ownerKey: "project_id",
});

export const fetchContracts = (projectId: string) => api.fetchAll(projectId);

/**
 * Solo puede haber un contrato por proyecto: al subir uno nuevo
 * se eliminan los anteriores (el nuevo ya quedó creado, así que
 * un fallo aquí no deja al proyecto sin contrato).
 */
export async function createContract(input: { project_id: string; file: File }): Promise<DbContract> {
  const saved = await api.create(input.project_id, input.file);
  const all = await api.fetchAll(input.project_id).catch(() => [saved]);
  await Promise.all(
    all
      .filter((c) => c.id !== saved.id)
      .map((c) => api.remove(c.id, c.storage_path).catch(() => {}))
  );
  return saved;
}

export const deleteContract = (id: string, storagePath: string) => api.remove(id, storagePath);
export const getContractUrl = api.getUrl;
