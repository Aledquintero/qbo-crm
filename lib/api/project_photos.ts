import { createProjectStorage } from "./storage";

export type DbProjectPhoto = {
  id: string; project_id: string; filename: string; storage_path: string; created_at: string;
};

const api = createProjectStorage<DbProjectPhoto>({
  table: "project_photos", prefix: "PHO", folder: "photos", ownerKey: "project_id",
});

export const fetchProjectPhotos = (projectId: string) => api.fetchAll(projectId);
export const createProjectPhoto = (input: { project_id: string; file: File }) =>
  api.create(input.project_id, input.file);
export const deleteProjectPhoto = (id: string, storagePath: string) => api.remove(id, storagePath);
export const getProjectPhotoUrl = api.getUrl;
