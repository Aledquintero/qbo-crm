import { supabase } from "@/lib/supabase";
import type { Contact } from "@/data/contacts";
import { generateId } from "./id";

export type DbContact = {
  id: string;
  name: string;
  surname: string | null;
  email: string | null;
  company: string | null;
  title: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  rut: string | null;
  last_contact: string | null;
  created_at: string;
  updated_at: string;
};

function toContact(db: DbContact): Contact {
  return {
    id: db.id,
    name: db.name,
    surname: db.surname ?? "",
    email: db.email ?? "",
    company: db.company ?? "",
    title: db.title ?? "",
    phone: db.phone ?? "",
    direccion: db.address ?? "",
    lastContact: db.last_contact ?? "",
    address: db.address ?? undefined,
    city: db.city ?? undefined,
    rut: db.rut ?? undefined,
  };
}

export async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as DbContact[]).map(toContact);
}

export async function createContact(input: {
  name: string;
  surname?: string;
  phone?: string;
  address?: string;
  city?: string;
  rut?: string;
}): Promise<Contact> {
  const id = await generateId("CON");
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      id,
      name: input.name,
      surname: input.surname || null,
      phone: input.phone || null,
      address: input.address || null,
      city: input.city || null,
      rut: input.rut || null,
    })
    .select()
    .single();

  if (error) throw error;
  return toContact(data as DbContact);
}

export async function updateContact(id: string, input: Partial<{
  name: string;
  surname: string;
  email: string;
  company: string;
  title: string;
  phone: string;
  address: string;
  city: string;
  rut: string;
}>): Promise<Contact> {
  const { data, error } = await supabase
    .from("contacts")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return toContact(data as DbContact);
}

export async function fetchContactById(id: string): Promise<Contact | null> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return toContact(data as DbContact);
}
