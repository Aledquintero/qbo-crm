import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const quotes = pgTable("quotes", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  storagePath: text("storage_path"),
  numero: text("numero"),
  fecha: text("fecha"),
  neto: integer("neto"),
  iva: integer("iva"),
  total: integer("total"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
