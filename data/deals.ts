// ============================================================
// DATOS DE NEGOCIOS / PROJECTS
// Edita aquí la lista de negocios del CRM
// ============================================================

export interface Project {
  id: string;
  company: string;
  contact: string;
  contact_id?: string | null;
  email: string;
  value: number;
  stage: string;
  status: "won" | "pending" | "lost";
  closeDate: string;
  rep: string;
  direccion?: string | null;
  fecha_visita?: string | null;
  fecha_instalacion?: string | null;
  probability?: number | null;
}

export const projects: Project[] = [
  { id: "1", company: "Acme Corporation",   contact: "John Smith",    email: "john@acme.com",          value: 125000, stage: "Negotiation", status: "won",     closeDate: "2024-01-15", rep: "Sarah Chen"   },
  { id: "2", company: "TechStart Inc",      contact: "Lisa Wong",     email: "lisa@techstart.io",      value: 89500,  stage: "Proposal",     status: "pending", closeDate: "2024-01-22", rep: "Mike Johnson" },
  { id: "3", company: "GlobalFin Partners", contact: "Robert Davis",  email: "rdavis@globalfin.com",   value: 245000, stage: "Qualified",    status: "pending", closeDate: "2024-02-01", rep: "Emily Davis"  },
  { id: "4", company: "DataSync Solutions", contact: "Emma Wilson",   email: "emma@datasync.net",      value: 67800,  stage: "Lead",         status: "lost",    closeDate: "2024-01-10", rep: "James Wilson" },
  { id: "5", company: "CloudBase Ltd",      contact: "Michael Chen",  email: "m.chen@cloudbase.io",    value: 178000, stage: "Negotiation", status: "won",     closeDate: "2024-01-18", rep: "Sarah Chen"   },
  { id: "6", company: "Innovate Labs",      contact: "Jennifer Park", email: "jpark@innovate.co",      value: 156000, stage: "Proposal",     status: "pending", closeDate: "2024-01-28", rep: "Lisa Park"    },
  { id: "7", company: "NextGen Systems",    contact: "David Lee",     email: "david@nextgen.tech",     value: 203000, stage: "Qualified",    status: "pending", closeDate: "2024-02-05", rep: "Mike Johnson" },
  { id: "8", company: "Prime Analytics",   contact: "Sarah Johnson", email: "sj@primeanalytics.com",  value: 94500,  stage: "Lead",         status: "pending", closeDate: "2024-02-10", rep: "Emily Davis"  },
];
