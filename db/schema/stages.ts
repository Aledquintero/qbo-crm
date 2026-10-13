import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const stages = pgTable("stages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#38bdf8"),
  position: integer("position").notNull().default(0),
  kind: text("kind").notNull().default("open"),
});
