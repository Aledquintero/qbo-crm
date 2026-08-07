"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ContactDetail } from "@/features/ContactDetail";
import { AddContactPanel } from "@/components/AddContactPanel";
import { fetchContacts, createContact, updateContact } from "@/lib/api/contacts";
import { supabase } from "@/lib/supabase";
import type { Contact } from "@/data/contacts";
import {
  Search, Filter, ArrowUpDown, CheckCircle2,
  Clock, XCircle, MoreHorizontal, ChevronDown, Plus,
  Pencil, Trash2,
} from "lucide-react";

const PAGE_SIZE = 5;

const statusConfig = {
  active:   { icon: CheckCircle2, color: "text-success",     bg: "bg-success/10",     label: "Active"   },
  pending:  { icon: Clock,         color: "text-warning",     bg: "bg-warning/10",     label: "Pending"  },
  inactive: { icon: XCircle,       color: "text-destructive", bg: "bg-destructive/10", label: "Inactive" },
};

export function Contacts({ initialContactId }: { initialContactId?: string | null }) {
  const [searchQuery, setSearchQuery]       = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactList, setContactList] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [menuTarget, setMenuTarget] = useState<{ contact: Contact; x: number; y: number } | null>(null);
  const [page, setPage] = useState(1);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchContacts()
      .then((data) => {
        setContactList(data);
        if (initialContactId) {
          const found = data.find((c) => c.id === initialContactId);
          if (found) setSelectedContact(found);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [initialContactId]);

  useEffect(() => {
    if (!menuTarget) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuTarget(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuTarget]);

  if (selectedContact) {
    return (
      <ContactDetail
        contact={selectedContact}
        onBack={() => setSelectedContact(null)}
        onSaveContact={async (updated) => {
          try {
            const saved = await updateContact(updated.id, updated);
            if (saved) {
              setContactList((prev) =>
                prev.map((c) => (c.id === saved.id ? saved : c))
              );
              setSelectedContact(saved);
            }
          } catch (e) {
            console.error(e);
          }
        }}
      />
    );
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Cargando contactos...</div>;
  }

  const filteredContacts = contactList.filter((contact) => {
    const fullName = `${contact.name} ${contact.surname}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || contact.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedContacts = filteredContacts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleDelete = async (id: string) => {
    try {
      await supabase.from("contacts").delete().eq("id", id);
      setContactList((prev) => prev.filter((c) => c.id !== id));
      setMenuTarget(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">View and manage all your contacts in one place</p>
      </div>

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
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
            <Filter className="w-4 h-4" />
            More filters
            <ChevronDown className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity duration-200"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Name <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Teléfono</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dirección</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Contact</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedContacts.map((contact, index) => {
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
                          <p className="text-sm font-medium text-foreground">{contact.name} {contact.surname}</p>
                          <p className="text-xs text-muted-foreground">{contact.email}</p>
                        </div>
                      </div>
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
                      <span className="text-sm text-muted-foreground">{contact.direccion}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-muted-foreground">{contact.lastContact}</span>
                    </td>
                    <td className="py-4 px-4 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setMenuTarget(menuTarget?.contact.id === contact.id ? null : { contact, x: rect.right - 144, y: rect.bottom + 4 });
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/30">
          <span className="text-sm text-muted-foreground">
            Showing {Math.min(safePage * PAGE_SIZE, filteredContacts.length)} of {filteredContacts.length} contacts
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors duration-200",
                safePage <= 1
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "w-8 h-8 rounded-lg text-sm font-medium transition-colors duration-200",
                  safePage === p
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors duration-200",
                safePage >= totalPages
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AddContactPanel
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={async (data) => {
          try {
            const saved = await createContact({
              name: data.nombre,
              surname: data.apellido,
              phone: data.telefono,
              address: data.direccion,
              city: data.ciudad,
              rut: data.rut,
            });
            setContactList((prev) => [saved, ...prev]);
          } catch (e) {
            console.error(e);
          }
        }}
      />

      <AddContactPanel
        open={!!editContact}
        onClose={() => setEditContact(null)}
        initialData={editContact ? {
          nombre: editContact.name,
          apellido: editContact.surname,
          telefono: editContact.phone,
          direccion: editContact.direccion,
          ciudad: editContact.city || "",
          rut: editContact.rut || "",
        } : undefined}
        onSave={async (data) => {
          if (!editContact) return;
          try {
            const saved = await updateContact(editContact.id, {
              name: data.nombre,
              surname: data.apellido,
              phone: data.telefono,
              address: data.direccion,
              city: data.ciudad,
              rut: data.rut,
            });
            setContactList((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
            setEditContact(null);
          } catch (e) {
            console.error(e);
          }
        }}
      />

      {menuTarget && createPortal(
        <div ref={menuRef}
          style={{ position: "fixed", left: menuTarget.x, top: menuTarget.y, zIndex: 9999 }}
          className="w-36 rounded-xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            onClick={() => { setEditContact(menuTarget.contact); setMenuTarget(null); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors rounded-t-xl"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
          <button
            onClick={() => { handleDelete(menuTarget.contact.id); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors rounded-b-xl"
          >
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}