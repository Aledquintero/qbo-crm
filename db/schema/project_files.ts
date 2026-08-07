import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const projectFiles = pgTable("project_files", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  storagePath: text("storage_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
