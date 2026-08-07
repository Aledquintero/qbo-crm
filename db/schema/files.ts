import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const files = pgTable("files", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["ficha", "fotos", "cotizacion", "contrato", "diseno", "pago"] }).notNull(),
  filename: text("filename").notNull(),
  storagePath: text("storage_path"),
  valor: integer("valor"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
