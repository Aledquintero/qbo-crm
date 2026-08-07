"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ContactDetail } from "@/components/dashboard/sections/contact-detail";
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  XCircle,
  MoreHorizontal,
  ChevronDown,
  Plus,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  phone: string;
  status: "active" | "pending" | "inactive";
  owner: string;
  lastContact: string;
}

const contacts: Contact[] = [
  { id: "1", name: "John Smith", email: "john@acme.com", company: "Acme Corporation", title: "VP of Sales", phone: "+1 (555) 123-4567", status: "active", owner: "Sarah Chen", lastContact: "2024-01-15" },
  { id: "2", name: "Lisa Wong", email: "lisa@techstart.io", company: "TechStart Inc", title: "CTO", phone: "+1 (555) 234-5678", status: "pending", owner: "Mike Johnson", lastContact: "2024-01-22" },
  { id: "3", name: "Robert Davis", email: "rdavis@globalfin.com", company: "GlobalFin Partners", title: "Head of Procurement", phone: "+1 (555) 345-6789", status: "pending", owner: "Emily Davis", lastContact: "2024-02-01" },
  { id: "4", name: "Emma Wilson", email: "emma@datasync.net", company: "DataSync Solutions", title: "Operations Lead", phone: "+1 (555) 456-7890", status: "inactive", owner: "James Wilson", lastContact: "2024-01-10" },
  { id: "5", name: "Michael Chen", email: "m.chen@cloudbase.io", company: "CloudBase Ltd", title: "CEO", phone: "+1 (555) 567-8901", status: "active", owner: "Sarah Chen", lastContact: "2024-01-18" },
  { id: "6", name: "Jennifer Park", email: "jpark@innovate.co", company: "Innovate Labs", title: "Product Manager", phone: "+1 (555) 678-9012", status: "pending", owner: "Lisa Park", lastContact: "2024-01-28" },
  { id: "7", name: "David Lee", email: "david@nextgen.tech", company: "NextGen Systems", title: "Engineering Director", phone: "+1 (555) 789-0123", status: "pending", owner: "Mike Johnson", lastContact: "2024-02-05" },
  { id: "8", name: "Sarah Johnson", email: "sj@primeanalytics.com", company: "Prime Analytics", title: "Marketing Lead", phone: "+1 (555) 890-1234", status: "active", owner: "Emily Davis", lastContact: "2024-02-10" },
];

const statusConfig = {
  active: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Active" },
  pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "Pending" },
  inactive: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Inactive" },
};

export function ContactsSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  if (selectedContact) {
    return (
      <ContactDetail contact={selectedContact} onBack={() => setSelectedContact(null)} />
    );
  }

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || contact.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">View and manage all your contacts in one place</p>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 h-9 pl-9 pr-4 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-2">
            {["all", "active", "pending", "inactive"].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                  selectedFilter === filter
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity duration-200">
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
          <Filter className="w-4 h-4" />
          More filters
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Name
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Owner</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Contact</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact, index) => {
                const status = statusConfig[contact.status];
                const StatusIcon = status.icon;

                return (
                  <tr
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground">
                          {contact.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">{contact.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-foreground">{contact.company}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded-md bg-secondary text-xs font-medium text-foreground">
                        {contact.title}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">{contact.phone}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium", status.bg, status.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">{contact.owner}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">{contact.lastContact}</span>
                    </td>
                    <td className="py-4 px-4">
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/30">
          <span className="text-sm text-muted-foreground">
            Showing {filteredContacts.length} of {contacts.length} contacts
          </span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200">
              Previous
            </button>
            <button className="px-3 py-1.5 rounded-lg text-sm bg-accent text-accent-foreground font-medium">
              1
            </button>
            <button className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200">
              2
            </button>
            <button className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
