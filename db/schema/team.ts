import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const team = pgTable("team", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  role: text("role"),
  email: text("email"),
  phone: text("phone"),
  deals: integer("deals").default(0),
  revenue: integer("revenue").default(0),
  quota: integer("quota").default(0),
  change: integer("change").default(0),
  rank: integer("rank").default(0),
  status: text("status").default("active"),
  avatar: text("avatar"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});