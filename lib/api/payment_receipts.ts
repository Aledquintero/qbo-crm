import { createProjectStorage } from "./storage";

export type DbPaymentReceipt = {
  id: string; payment_id: string; filename: string; storage_path: string; created_at: string;
};

const api = createProjectStorage<DbPaymentReceipt>({
  table: "payment_receipts", prefix: "RCP", folder: "payment-receipts", ownerKey: "payment_id",
});

export const createPaymentReceipt = (input: { payment_id: string; file: File }) =>
  api.create(input.payment_id, input.file);
export const getPaymentReceiptUrl = api.getUrl;
