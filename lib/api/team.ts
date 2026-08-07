import { supabase } from "@/lib/supabase";
import { generateId } from "./id";

export type DbTeamMember = {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  deals: number | null;
  revenue: number | null;
  quota: number | null;
  change: number | null;
  rank: number | null;
  status: string | null;
  avatar: string | null;
  created_at: string;
  updated_at: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  deals: number;
  revenue: number;
  quota: number;
  change: number;
  rank: number;
  status: string;
};

function toTeamMember(db: DbTeamMember): TeamMember {
  return {
    id: db.id,
    name: db.name,
    role: db.role ?? "",
    email: db.email ?? "",
    phone: db.phone ?? "",
    avatar: db.avatar ?? db.name.split(" ").map((n) => n[0]).join("").slice(0, 2),
    deals: db.deals ?? 0,
    revenue: db.revenue ?? 0,
    quota: db.quota ?? 0,
    change: db.change ?? 0,
    rank: db.rank ?? 0,
    status: db.status ?? "active",
  };
}

type TeamRow = DbTeamMember;

export async function fetchTeam(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("team")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as unknown as TeamRow[]).map(toTeamMember);
}

export async function createTeamMember(input: {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  deals?: number;
  revenue?: number;
  quota?: number;
  change?: number;
}): Promise<TeamMember> {
  const id = await generateId("CON");
  const initials = input.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const { error } = await supabase.from("team").insert({
    id,
    name: input.name,
    role: input.role || null,
    email: input.email || null,
    phone: input.phone || null,
    deals: input.deals ?? 0,
    revenue: input.revenue ?? 0,
    quota: input.quota ?? 0,
    change: input.change ?? 0,
    avatar: initials,
    status: "active",
  });

  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("team")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  return toTeamMember(data as unknown as TeamRow);
}

export async function updateTeamMember(
  id: string,
  input: Partial<{
    name: string;
    role: string;
    email: string;
    phone: string;
    deals: number;
    revenue: number;
    quota: number;
    change: number;
    rank: number;
    status: string;
  }>
): Promise<TeamMember> {
  const { error } = await supabase
    .from("team")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from("team")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  return toTeamMember(data as unknown as TeamRow);
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from("team").delete().eq("id", id);
  if (error) throw error;
}