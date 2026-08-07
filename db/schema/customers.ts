import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: text("id").primaryKey().notNull(),
  name: text("name"),
  company: text("company"),
  industry: text("industry"),
  tier: text("tier").default("starter"),
  location: text("location"),
  contact: text("contact"),
  email: text("email"),
  phone: text("phone"),
  total_revenue: integer("total_revenue").default(0),
  revenue: integer("revenue").default(0),
  active_deals: integer("active_deals").default(0),
  deals_count: integer("deals_count").default(0),
  health_score: integer("health_score").default(0),
  trend: text("trend").default("stable"),
  last_contact: text("last_contact"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});