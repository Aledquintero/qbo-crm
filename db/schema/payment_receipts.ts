import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { payments } from "./payments";

export const paymentReceipts = pgTable("payment_receipts", {
  id: text("id").primaryKey(),
  paymentId: text("payment_id").references(() => payments.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  storagePath: text("storage_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
