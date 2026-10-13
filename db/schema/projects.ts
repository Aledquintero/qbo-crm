import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { contacts } from "./contacts";

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  contactId: text("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  email: text("email"),
  value: integer("value").default(0),
  stage: text("stage").default("lead"),
  status: text("status", { enum: ["won", "pending", "lost"] }).default("pending"),
  closeDate: timestamp("close_date"),
  rep: text("rep"),
  direccion: text("direccion"),
  fechaVisita: timestamp("fecha_visita"),
  fechaInstalacion: timestamp("fecha_instalacion"),
  stageUpdatedAt: timestamp("stage_updated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
