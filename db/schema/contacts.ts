import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  surname: text("surname"),
  email: text("email"),
  company: text("company"),
  title: text("title"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  rut: text("rut"),
  lastContact: timestamp("last_contact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
