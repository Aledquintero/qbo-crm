"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { getSession } from "@/lib/auth/store";
import type { Role } from "@/lib/auth/types";
import { canSeeField, canSeeBlock, loadCustomFields, saveCustomFields, slugField, loadColumnOrder, customLabel, label, type CustomField, type CustomFieldType } from "@/lib/constructor/store";
import { fetchCustomValues } from "@/lib/custom-values";
import { cn } from "@/lib/utils";
import { ContactDetail } from "@/features/ContactDetail";
import { AddContactPanel } from "@/components/AddContactPanel";
import { fetchContacts, fetchProjects, createContact, updateContact } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { Contact } from "@/data/contacts";
import {
  Search, ArrowUpDown,
  MoreHorizontal, ChevronDown, Plus,
  Pencil, Trash2, Columns3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 5;

type ContactColumnId =
  | "name"
  | "phone"
  | "direccion"
  | "lastProject";

const CONTACT_COLUMNS: { id: ContactColumnId; label: string }[] = [
  { id: "name",        label: "Name" },
  { id: "phone",       label: "Teléfono" },
  { id: "direccion",   label: "Dirección" },
  { id: "lastProject", label: "Last Project" },
];

const CONTACT_COLUMNS_KEY = "contacts-visible-columns-v3";

function getDefaultContactColumns(): Record<ContactColumnId, boolean> {
  return {
    name: true,
    phone: true,
    direccion: true,
    lastProject: true,
  };
}

function formatProjectDate(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function loadContactColumns(): Record<ContactColumnId, boolean> {
  const defaults = getDefaultContactColumns();
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(CONTACT_COLUMNS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Record<ContactColumnId, boolean>>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function Contacts({ initialContactId, viewRole }: { initialContactId?: string | null; viewRole?: Role }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactList, setContactList] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [menuTarget, setMenuTarget] = useState<{ contact: Contact; x: number; y: number } | null>(null);
  const [page, setPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<Record<ContactColumnId, boolean>>(loadContactColumns);
  const [lastProjectByContact, setLastProjectByContact] = useState<Record<string, { company: string; date: string; count: number }>>({});
  const role = viewRole ?? getSession()?.rol ?? "Vendedor";
  const ccol = (id: ContactColumnId) => visibleColumns[id] && canSeeField("contacts", role, id);
  const corder = loadColumnOrder().contacts;
  const corderedVisible = corder.filter((id) => (CONTACT_COLUMNS.some((c) => c.id === id) ? ccol(id as ContactColumnId) : false));
  const ct = (key: string) => customLabel("contacts", key) ?? label("contacts", key);
  const CCONTACT_COLS_KEY = "contacts-custom-columns";
  const [customFields, setCustomFields] = useState<CustomField[]>(() => {
    try { return loadCustomFields().contacts; } catch { return []; }
  });
  const [customCols, setCustomCols] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(CCONTACT_COLS_KEY) ?? "{}") as Record<string, boolean>; } catch { return {}; }
  });
  const [customValues, setCustomValues] = useState<Record<string, Record<string, string>>>({});
  const [cfLabel, setCfLabel] = useState("");
  const [cfType, setCfType] = useState<CustomFieldType>("texto");
  const [cfOpts, setCfOpts] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(CONTACT_COLUMNS_KEY, JSON.stringify(visibleColumns));
    } catch {
      // ignorar errores de almacenamiento
    }
  }, [visibleColumns]);

  const toggleContactColumn = (id: ContactColumnId, value: boolean) =>
    setVisibleColumns((prev) => ({ ...prev, [id]: value }));
  const showAllContactColumns = () =>
    setVisibleColumns(getDefaultContactColumns());
  const hideAllContactColumns = () =>
    setVisibleColumns((prev) => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<ContactColumnId, boolean>));
  const visibleContactCount = CONTACT_COLUMNS.filter((c) => ccol(c.id)).length;
  const visibleCustom = customFields.filter((f) => customCols[f.id] !== false);
  const customCount = visibleCustom.length;

  useEffect(() => {
    try { window.localStorage.setItem(CCONTACT_COLS_KEY, JSON.stringify(customCols)); } catch {}
  }, [customCols]);

  useEffect(() => {
    Promise.all([fetchContacts(), fetchProjects()])
      .then(([contacts, projects]) => {
        setContactList(contacts);
        const latest: Record<string, { company: string; date: string; count: number }> = {};
        for (const p of projects) {
          if (!p.contact_id) continue;
          const date = p.created_at ?? "";
          const current = latest[p.contact_id];
          if (!current) {
            latest[p.contact_id] = { company: p.company, date, count: 1 };
          } else {
            current.count += 1;
            if (date && date > current.date) {
              current.company = p.company;
              current.date = date;
            }
          }
        }
        setLastProjectByContact(latest);
        if (initialContactId) {
          const found = contacts.find((c) => c.id === initialContactId);
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

  // Filtro/paginación ANTES de los returns tempranos (los hooks deben
  // ejecutarse siempre en el mismo orden).
  const filteredContacts = contactList.filter((contact) => {
    const fullName = `${contact.name} ${contact.surname}`.toLowerCase();
    const q = searchQuery.toLowerCase();
    return (
      fullName.includes(q) ||
      contact.company.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedContacts = filteredContacts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (visibleCustom.length === 0 || paginatedContacts.length === 0) return;
    let alive = true;
    Promise.all(paginatedContacts.map(async (c) => [c.id, await fetchCustomValues("contact", c.id).catch(() => ({}))] as const))
      .then((rows) => { if (alive) setCustomValues(Object.fromEntries(rows)); })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePage, filteredContacts.length, visibleCustom.length]);

  const addCustomColumn = () => {
    if (!cfLabel.trim()) { toast.error("Ponle un nombre a la columna"); return; }
    const all = loadCustomFields();
    const id = slugField(cfLabel);
    if ([...all.deals, ...all.contacts].some((f) => f.id === id)) { toast.error("Ya existe una columna similar"); return; }
    const nf = { id, label: cfLabel.trim(), type: cfType, options: cfType === "lista" ? cfOpts.split(",").map((s) => s.trim()).filter(Boolean) : undefined };
    const next = { ...all, contacts: [...all.contacts, nf] };
    saveCustomFields(next);
    setCustomFields(next.contacts);
    setCustomCols((prev) => ({ ...prev, [id]: true }));
    setCfLabel(""); setCfOpts("");
    toast.success(`Columna "${nf.label}" creada`);
  };

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

  const handleDelete = async (id: string) => {
    const target = contactList.find((c) => c.id === id);
    if (!confirm(`¿Eliminar el contacto "${target ? `${target.name} ${target.surname}` : id}"? Esta acción no se puede deshacer.`)) return;
    try {
      await supabase.from("contacts").delete().eq("id", id);
      setContactList((prev) => prev.filter((c) => c.id !== id));
      setMenuTarget(null);
      toast.success("Contacto eliminado");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar el contacto");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {canSeeBlock("contacts", role, "buscador") && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={ct("search")}
            aria-label={ct("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 h-9 pl-9 pr-4 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all duration-200"
          />
        </div>
        )}
        {canSeeBlock("contacts", role, "acciones") && (
      <div className="flex items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                <Columns3 className="w-4 h-4" />
                {ct("columns")}
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Columnas visibles</span>
                <span className="flex items-center gap-2 text-xs font-normal">
                  <button
                    onClick={showAllContactColumns}
                    className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Todas
                  </button>
                  <span className="text-border">|</span>
                  <button
                    onClick={hideAllContactColumns}
                    className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Ninguna
                  </button>
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {CONTACT_COLUMNS.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={visibleColumns[c.id]}
                  onCheckedChange={(v) => toggleContactColumn(c.id, v === true)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
              {customFields.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Personalizadas</DropdownMenuLabel>
                  {customFields.map((f) => (
                    <DropdownMenuCheckboxItem
                      key={f.id}
                      checked={customCols[f.id] !== false}
                      onCheckedChange={(v) => setCustomCols((prev) => ({ ...prev, [f.id]: v === true }))}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {f.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}
              <DropdownMenuSeparator />
              <div className="px-2 py-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                <p className="text-xs font-medium">Añadir columna</p>
                <input placeholder="Nombre (ej. Cumpleaños)" value={cfLabel} onChange={(e) => setCfLabel(e.target.value)}
                  className="w-full h-8 px-2 rounded-md bg-secondary border border-border text-xs" />
                <div className="flex gap-2">
                  <select value={cfType} onChange={(e) => setCfType(e.target.value as CustomFieldType)}
                    className="h-8 px-1 rounded-md bg-secondary border border-border text-xs flex-1">
                    <option value="texto">Texto</option>
                    <option value="numero">Número</option>
                    <option value="fecha">Fecha</option>
                    <option value="lista">Lista</option>
                    <option value="si_no">Sí/No</option>
                  </select>
                  <button onClick={addCustomColumn}
                    className="h-8 px-3 rounded-md bg-accent text-accent-foreground text-xs font-medium">Añadir</button>
                </div>
                {cfType === "lista" && (
                  <input placeholder="Opciones separadas por coma" value={cfOpts} onChange={(e) => setCfOpts(e.target.value)}
                    className="w-full h-8 px-2 rounded-md bg-secondary border border-border text-xs" />
                )}
                <p className="text-[11px] text-muted-foreground">Se rellena en el detalle del contacto.</p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity duration-200"
          >
            <Plus className="w-4 h-4" />
            {ct("add")}
          </button>
      </div>
        )}
      </div>

      {canSeeBlock("contacts", role, "tabla") && (
      <div className="bg-card border border-border rounded-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                {corderedVisible.map((id) => (
                  <th key={id} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {ct(`col_${id}`)}
                  </th>
                ))}
                {visibleCustom.map((f) => (
                  <th key={f.id} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</th>
                ))}
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedContacts.length === 0 ? (
                <tr><td colSpan={(visibleContactCount + customCount + 1)} className="text-center py-12 text-muted-foreground text-sm">No se encontraron contactos</td></tr>
              ) : (
              paginatedContacts.map((contact, index) => {
                return (
                  <tr
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedContact(contact); } }}
                    tabIndex={0}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                  >
                    {corderedVisible.map((id) => (
                    <td key={id} className="py-4 px-4">
                      {id === "name" ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground">
                          {contact.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{contact.name} {contact.surname}</p>
                          <p className="text-xs text-muted-foreground">{contact.email}</p>
                          {(lastProjectByContact[contact.id]?.count ?? 0) > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {lastProjectByContact[contact.id].count} {lastProjectByContact[contact.id].count === 1 ? "proyecto" : "proyectos"}
                            </p>
                          )}
                        </div>
                      </div>
                      ) : id === "phone" ? (
                      <span className="text-sm text-muted-foreground">{contact.phone}</span>
                      ) : id === "direccion" ? (
                      <span className="text-sm text-muted-foreground">{contact.direccion}</span>
                      ) : (
                      lastProjectByContact[contact.id] ? (
                        <div>
                          <p className="text-sm text-foreground">{lastProjectByContact[contact.id].company}</p>
                          <p className="text-xs text-muted-foreground">{formatProjectDate(lastProjectByContact[contact.id].date)}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )
                      )}
                    </td>
                    ))}
                    {visibleCustom.map((f) => (
                      <td key={f.id} className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">{customValues[contact.id]?.[f.id] || "—"}</span>
                      </td>
                    ))}
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
              })
              )}
            </tbody>
          </table>

        {canSeeBlock("contacts", role, "paginacion") && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/30">
          <span className="text-sm text-muted-foreground">
            Mostrando {Math.min(safePage * PAGE_SIZE, filteredContacts.length)} de {filteredContacts.length} contactos
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
              Anterior
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
              Siguiente
            </button>
          </div>
        </div>
        )}
      </div>
      )}

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