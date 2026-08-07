// ============================================================
// DATOS DE CONTACTOS
// Edita aquí la lista de contactos del CRM
// ============================================================

export interface Contact {
  id: string;
  name: string;
  surname: string;
  email: string;
  company: string;
  title: string;
  phone: string;
  status: "active" | "pending" | "inactive";
  direccion: string;
  lastContact: string;
  address?: string;
  city?: string;
  rut?: string;
}

export const contacts: Contact[] = [
  { id: "1", name: "John",    surname: "Smith",   email: "john@acme.com",             company: "Acme Corporation",  title: "VP of Sales",         phone: "+1 (555) 123-4567", status: "active",   direccion: "Sarah Chen",   lastContact: "2024-01-15" },
  { id: "2", name: "Lisa",    surname: "Wong",    email: "lisa@techstart.io",         company: "TechStart Inc",     title: "CTO",                 phone: "+1 (555) 234-5678", status: "pending",  direccion: "Mike Johnson", lastContact: "2024-01-22" },
  { id: "3", name: "Robert",  surname: "Davis",   email: "rdavis@globalfin.com",      company: "GlobalFin Partners", title: "Head of Procurement", phone: "+1 (555) 345-6789", status: "pending",  direccion: "Emily Davis",  lastContact: "2024-02-01" },
  { id: "4", name: "Emma",    surname: "Wilson",  email: "emma@datasync.net",         company: "DataSync Solutions", title: "Operations Lead",     phone: "+1 (555) 456-7890", status: "inactive", direccion: "James Wilson", lastContact: "2024-01-10" },
  { id: "5", name: "Michael", surname: "Chen",    email: "m.chen@cloudbase.io",       company: "CloudBase Ltd",     title: "CEO",                 phone: "+1 (555) 567-8901", status: "active",   direccion: "Sarah Chen",   lastContact: "2024-01-18" },
  { id: "6", name: "Jennifer",surname: "Park",    email: "jpark@innovate.co",         company: "Innovate Labs",     title: "Product Manager",     phone: "+1 (555) 678-9012", status: "pending",  direccion: "Lisa Park",    lastContact: "2024-01-28" },
  { id: "7", name: "David",   surname: "Lee",     email: "david@nextgen.tech",        company: "NextGen Systems",   title: "Engineering Director", phone: "+1 (555) 789-0123", status: "pending",  direccion: "Mike Johnson", lastContact: "2024-02-05" },
  { id: "8", name: "Sarah",   surname: "Johnson", email: "sj@primeanalytics.com",     company: "Prime Analytics",   title: "Marketing Lead",      phone: "+1 (555) 890-1234", status: "active",   direccion: "Emily Davis",  lastContact: "2024-02-10" },
];
