import { createProjectStorage } from "./storage";

export type DbDesign = {
  id: string; project_id: string; filename: string; storage_path: string; created_at: string;
};

const api = createProjectStorage<DbDesign>({
  table: "designs", prefix: "DSN", folder: "designs", ownerKey: "project_id",
});

export const fetchDesigns = (projectId: string) => api.fetchAll(projectId);
export const createDesign = (input: { project_id: string; file: File }) =>
  api.create(input.project_id, input.file);
export const deleteDesign = (id: string, storagePath: string) => api.remove(id, storagePath);
export const getDesignUrl = api.getUrl;
