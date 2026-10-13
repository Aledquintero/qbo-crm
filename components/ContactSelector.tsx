"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus } from "lucide-react";
import { contacts as initialContacts } from "@/data/contacts";

interface ContactSelectorProps {
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
}

export function ContactSelector({ value, onChange, placeholder = "Buscar o crear contacto..." }: ContactSelectorProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [contactNames, setContactNames] = useState<string[]>(() =>
    initialContacts.map((c) => `${c.name} ${c.surname}`)
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = contactNames.filter((n) =>
    n.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (name: string) => {
    onChange(name);
    setSearch("");
    setOpen(false);
  };

  const handleCreate = () => {
    if (!search.trim()) return;
    setContactNames((prev) => [...prev, search.trim()]);
    onChange(search.trim());
    setOpen(false);
  };

  return (
    <div className="space-y-1.5 relative" ref={ref}>
      <label className="text-xs font-medium text-foreground">Cliente del Proyecto</label>

      {value ? (
        <div className="flex items-center justify-between h-9 px-3 rounded-lg bg-accent/10 border border-accent/20 text-sm text-foreground">
          <span className="font-medium">{value}</span>
          <button type="button" onClick={() => onChange("")}
            className="text-xs text-muted-foreground hover:text-destructive underline focus:outline-none">
            Cambiar
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search}
            onFocus={() => setOpen(true)}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all duration-200" />
        </div>
      )}

      {!value && open && (
        <div className="absolute top-full left-0 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto z-50 p-1">
          {filtered.length > 0 ? (
            filtered.map((name) => (
              <button key={name} type="button" onClick={() => handleSelect(name)}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md transition-colors block">
                {name}
              </button>
            ))
          ) : (
            <div className="p-2 text-center text-xs text-muted-foreground">
              No se encontraron contactos.
            </div>
          )}

          {search.trim() && !contactNames.includes(search.trim()) && (
            <button type="button" onClick={handleCreate}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent hover:bg-accent/10 border-t border-border mt-1 font-medium text-left text-blue-400">
              <Plus className="w-4 h-4 inline" />
              Crear contacto &quot;{search}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}