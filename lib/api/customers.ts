import { supabase } from "@/lib/supabase";
import { generateId } from "./id";

export type DbCustomer = {
  id: string;
  name: string | null;
  company: string | null;
  industry: string | null;
  tier: string | null;
  location: string | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
  total_revenue: number | null;
  revenue: number | null;
  active_deals: number | null;
  deals_count: number | null;
  health_score: number | null;
  trend: string | null;
  last_contact: string | null;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  name: string;
  industry: string;
  tier: string;
  location: string;
  contact: string;
  email: string;
  phone: string;
  totalRevenue: number;
  activeDeals: number;
  healthScore: number;
  trend: "up" | "down" | "stable";
  lastContact: string;
};

function toCustomer(db: DbCustomer): Customer {
  return {
    id: db.id,
    name: db.name ?? db.company ?? "",
    industry: db.industry ?? "",
    tier: db.tier ?? "Starter",
    location: db.location ?? "",
    contact: db.contact ?? "",
    email: db.email ?? "",
    phone: db.phone ?? "",
    totalRevenue: db.total_revenue ?? db.revenue ?? 0,
    activeDeals: db.active_deals ?? db.deals_count ?? 0,
    healthScore: db.health_score ?? 0,
    trend: (db.trend as "up" | "down" | "stable") ?? "stable",
    lastContact: db.last_contact ?? "",
  };
}

type CustomerRow = DbCustomer;

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as CustomerRow[]).map(toCustomer);
}

export async function createCustomer(input: {
  name: string;
  industry?: string;
  tier?: string;
  location?: string;
  contact?: string;
  email?: string;
  phone?: string;
}): Promise<Customer> {
  const id = await generateId("CUS");
  const { error } = await supabase.from("customers").insert({
    id,
    name: input.name,
    company: input.name,
    industry: input.industry || null,
    tier: input.tier || "Starter",
    location: input.location || null,
    contact: input.contact || null,
    email: input.email || null,
    phone: input.phone || null,
  });

  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  return toCustomer(data as unknown as CustomerRow);
}

export async function updateCustomer(
  id: string,
  input: Partial<{
    name: string;
    industry: string;
    tier: string;
    location: string;
    contact: string;
    email: string;
    phone: string;
    total_revenue: number;
    active_deals: number;
    health_score: number;
    trend: string;
    last_contact: string;
  }>
): Promise<Customer> {
  const { error } = await supabase
    .from("customers")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  return toCustomer(data as unknown as CustomerRow);
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}