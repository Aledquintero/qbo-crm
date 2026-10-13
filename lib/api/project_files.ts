import { createProjectStorage } from "./storage";

export type DbProjectFile = {
  id: string; project_id: string; filename: string; storage_path: string; created_at: string;
};

const api = createProjectStorage<DbProjectFile>({
  table: "project_files", prefix: "FIL", folder: "files", ownerKey: "project_id",
});

export const fetchProjectFiles = (projectId: string) => api.fetchAll(projectId);
export const createProjectFile = (input: { project_id: string; file: File }) =>
  api.create(input.project_id, input.file);
export const deleteProjectFile = (id: string, storagePath: string) => api.remove(id, storagePath);
export const getProjectFileUrl = api.getUrl;
