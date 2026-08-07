import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const quotations = pgTable("quotations", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  value: integer("value").default(0),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
