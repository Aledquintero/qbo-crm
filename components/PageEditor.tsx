"use client";

import { toast } from "sonner";
import { X, Eye, EyeOff, RotateCcw } from "lucide-react";
import { ROLES, type Role } from "@/lib/auth/types";
import { BLOCKS, loadBlocks, saveBlocks, loadLabels, saveLabels, LABEL_DEFAULTS } from "@/lib/constructor/store";
import { useState } from "react";
import type { SectionId } from "@/lib/auth/permissions";

const TITLES: Record<string, string> = {
  overview: "Overview", pipeline: "Pipeline", deals: "Proyectos",
  contacts: "Contactos", customers: "Customers", team: "Team",
  forecasting: "Forecasting", reports: "Reports",
};

const TEXT_GROUPS: Record<string, string> = {
  deals: "Proyectos: buscador, botones y columnas",
  contacts: "Contactos: buscador, botones y columnas",
};

export function PageEditor({ section, viewRole, onViewRole, onClose }: {
  section: SectionId; viewRole: Role; onViewRole: (r: Role) => void; onClose: () => void;
}) {
  const [blocks, setBlocks] = useState(loadBlocks);
  const [labels, setLabels] = useState(loadLabels);
  const list = BLOCKS[section] ?? [];
  const textKeys = Object.keys(LABEL_DEFAULTS[section] ?? {});

  const setText = (group: string, key: string, value: string) => {
    const nl = { ...labels, [group]: { ...labels[group], [key]: value } };
    setLabels(nl); saveLabels(nl);
  };

  const toggle = (block: string) => {
    const cur = blocks[section]?.[viewRole]?.[block] ?? true;
    const nb = {
      ...blocks,
      [section]: { ...blocks[section], [viewRole]: { ...blocks[section]?.[viewRole], [block]: !cur } },
    };
    setBlocks(nb); saveBlocks(nb);
  };

  const reset = () => {
    const nb = { ...blocks, [section]: { ...blocks[section], [viewRole]: Object.fromEntries(list.map((b) => [b.id, true])) } };
    setBlocks(nb); saveBlocks(nb);
    toast.success("Página restablecida");
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-[320px] bg-card border-l border-border shadow-xl p-4 space-y-4 overflow-auto animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Editando: {TITLES[section] ?? section}</h2>
            <p className="text-xs text-muted-foreground">Los cambios se ven al instante</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar editor"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <p className="text-xs font-medium mb-1">Estás viendo y editando como:</p>
          <div className="flex gap-1">
            {ROLES.map((r) => (
              <button key={r} onClick={() => onViewRole(r)}
                className={`flex-1 h-8 rounded-lg text-xs border ${viewRole === r ? "bg-accent text-accent-foreground border-accent" : "bg-secondary border-border text-muted-foreground"}`}>
                {r}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Lo que ocultes se oculta solo a ese rol. Tus datos no se borran.</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium">Componentes de esta página</p>
          {list.map((b) => {
            const visible = blocks[section]?.[viewRole]?.[b.id] ?? true;
            return (
              <button key={b.id} onClick={() => toggle(b.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-secondary text-sm text-left">
                {visible ? <Eye className="w-4 h-4 text-success" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                <span className="flex-1">{b.label}</span>
                <span className="text-[11px] text-muted-foreground">{visible ? "Visible" : "Oculto"}</span>
              </button>
            );
          })}
          {list.length === 0 && <p className="text-xs text-muted-foreground">Esta página no tiene componentes editables.</p>}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium">Nombre de las páginas</p>
          {Object.keys(LABEL_DEFAULTS.section).map((id) => (
            <div key={id} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24 truncate">{LABEL_DEFAULTS.section[id]}</span>
              <input value={labels.section[id] ?? ""} onChange={(e) => setText("section", id, e.target.value)}
                placeholder={LABEL_DEFAULTS.section[id]}
                className="flex-1 h-8 px-2 rounded-md bg-secondary border border-border text-xs" />
            </div>
          ))}
        </div>

        {textKeys.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium">Textos de esta página</p>
          <p className="text-[11px] text-muted-foreground">{TEXT_GROUPS[section]}</p>
          {textKeys.map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24 truncate" title={LABEL_DEFAULTS[section][k]}>{LABEL_DEFAULTS[section][k]}</span>
              <input value={labels[section]?.[k] ?? ""} onChange={(e) => setText(section, k, e.target.value)}
                placeholder={LABEL_DEFAULTS[section][k]}
                className="flex-1 h-8 px-2 rounded-md bg-secondary border border-border text-xs" />
            </div>
          ))}
        </div>
        )}

        <button onClick={reset}
          className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-secondary border border-border text-xs">
          <RotateCcw className="w-3.5 h-3.5" /> Mostrar todo de nuevo
        </button>
      </aside>
    </div>
  );
}
