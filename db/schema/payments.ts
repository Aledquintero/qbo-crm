import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  monto: integer("monto").default(0),
  fecha: timestamp("fecha"),
  estado: text("estado", { enum: ["pendiente", "pagado"] }).default("pendiente"),
  pagadoPor: text("pagado_por"),
  numTransferencia: text("num_transferencia"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
