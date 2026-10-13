"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ROLES, type Role } from "@/lib/auth/types";
import { loadView, saveView, SECTIONS, type SectionId } from "@/lib/auth/permissions";
import {
  PROJECT_FIELDS, CONTACT_FIELDS, loadFields, saveFields,
  loadCustomFields, saveCustomFields, slugField, type CustomFieldType,
  loadAutomations, saveAutomations, loadColumnOrder, moveColumn,
} from "@/lib/constructor/store";
import { fetchProjects } from "@/lib/api/projects";
import { fetchStages, createStage, updateStage, deleteStage } from "@/lib/api/stages";
import { loadPipelineStages, savePipelineStages, type PipelineStage } from "@/lib/pipeline-stages";

function slug(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 30) || `etapa-${Date.now()}`;
}

export function Constructor() {
  const [tab, setTab] = useState<"secciones" | "campos" | "etapas" | "personalizados" | "autos">("secciones");
  const [view, setView] = useState(loadView);
  const [fields, setFields] = useState(loadFields);
  const [stages, setStages] = useState<PipelineStage[]>(() => loadPipelineStages());
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#38bdf8");
  const [custom, setCustom] = useState(loadCustomFields);
  const [autos, setAutos] = useState(loadAutomations);
  const [cfLabel, setCfLabel] = useState("");
  const [cfType, setCfType] = useState<CustomFieldType>("texto");
  const [cfOpts, setCfOpts] = useState("");
  const [cfSection, setCfSection] = useState<"deals" | "contacts">("deals");
  const [tick, setTick] = useState(0);
  void tick;

  useEffect(() => {
    fetchStages().then((s) => {
      if (s.length > 0) {
        const m = s.map((r) => ({ id: r.id, name: r.name, color: r.color ?? "#38bdf8", kind: (r.kind ?? "open") as PipelineStage["kind"] }));
        setStages(m); savePipelineStages(m);
      }
    }).catch(() => {});
    fetchProjects().then((p) => {
      const c: Record<string, number> = {};
      for (const d of p) c[d.stage] = (c[d.stage] ?? 0) + 1;
      setUsage(c);
    }).catch(() => {});
  }, []);

  const toggleSection = (r: Role, s: SectionId) => {
    if (r === "Admin" && s === "settings") return;
    const nv = { ...view, [r]: { ...view[r], [s]: !view[r][s] } };
    setView(nv); saveView(nv);
    toast.success("Sección actualizada en vivo");
  };

  const toggleField = (sec: "deals" | "contacts", r: Role, f: string) => {
    const nf = { ...fields, [sec]: { ...fields[sec], [r]: { ...fields[sec][r], [f]: !fields[sec][r][f] } } };
    setFields(nf); saveFields(nf);
  };

  const addStage = async () => {
    if (!newName.trim()) return;
    const id = slug(newName);
    if (stages.some((s) => s.id === id)) { toast.error("Ya existe una etapa con ese nombre"); return; }
    try {
      const row = await createStage({ id, name: newName.trim(), color: newColor, position: stages.length, kind: "open" });
      const ns = [...stages, { id: row.id, name: row.name, color: row.color, kind: row.kind ?? "open" }];
      setStages(ns); savePipelineStages(ns); setNewName("");
      toast.success("Etapa creada");
    } catch (e) { console.error(e); toast.error("No se pudo crear (¿ejecutaste supabase/0002_reconcile.sql?)"); }
  };

  const renameStage = async (id: string, name: string) => {
    try {
      await updateStage(id, { name });
      const ns = stages.map((s) => (s.id === id ? { ...s, name } : s));
      setStages(ns); savePipelineStages(ns);
    } catch (e) { console.error(e); toast.error("No se pudo renombrar"); }
  };

  const removeStage = async (id: string) => {
    if ((usage[id] ?? 0) > 0) { toast.error(`No se puede borrar: ${usage[id]} proyecto(s) están en esta etapa. Muévelos primero.`); return; }
    if (!confirm("¿Eliminar esta etapa?")) return;
    try {
      await deleteStage(id);
      const ns = stages.filter((s) => s.id !== id);
      setStages(ns); savePipelineStages(ns);
      toast.success("Etapa eliminada");
    } catch (e) { console.error(e); toast.error("No se pudo eliminar"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["secciones", "campos", "personalizados", "etapas", "autos"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 h-8 rounded-lg text-sm border ${tab === t ? "bg-accent text-accent-foreground border-accent" : "bg-secondary border-border text-muted-foreground"}`}>
            {t === "secciones" ? "Secciones por rol" : t === "campos" ? "Campos por rol" : t === "personalizados" ? "Personalizados" : t === "etapas" ? "Etapas" : "Automatizaciones"}
          </button>
        ))}
      </div>

      {tab === "secciones" && (
        <div className="rounded-xl border border-border bg-card p-4 overflow-auto">
          <p className="text-xs text-muted-foreground mb-2">Qué páginas ve cada rol. Se aplica al instante. Ocultar no borra datos.</p>
          <table className="text-xs w-full">
            <thead><tr><th className="text-left p-2">Sección</th>{ROLES.map((r) => <th key={r} className="p-2">{r}</th>)}</tr></thead>
            <tbody>
              {SECTIONS.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="p-2">{s.label}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="p-2 text-center">
                      <input type="checkbox" checked={r === "Admin" && s.id === "settings" ? true : !!view[r]?.[s.id]}
                        disabled={r === "Admin" && s.id === "settings"}
                        onChange={() => toggleSection(r, s.id)} aria-label={`${s.label} visible para ${r}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "campos" && (
        <div className="grid md:grid-cols-2 gap-4">
          {([{ sec: "deals", label: "Proyectos", list: PROJECT_FIELDS }, { sec: "contacts", label: "Contactos", list: CONTACT_FIELDS }] as const).map(({ sec, label, list }) => {
            const order = loadColumnOrder()[sec];
            const ordered = [...order.filter((id) => list.some((f) => f.id === id)), ...list.filter((f) => !order.includes(f.id)).map((f) => f.id)];
            return (
            <div key={sec} className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-medium text-sm mb-2">{label} — campos por rol (↑↓ ordena columnas)</h3>
              {ordered.map((fid, i) => {
                const f = list.find((x) => x.id === fid)!;
                return (
                <div key={f.id} className="flex items-center gap-1 py-1 text-sm border-b border-border last:border-0">
                  <button onClick={() => { moveColumn(sec, f.id, -1); setTick((x) => x + 1); }} disabled={i === 0}
                    aria-label={`Subir ${f.label}`} className="px-1 text-muted-foreground disabled:opacity-30">↑</button>
                  <button onClick={() => { moveColumn(sec, f.id, 1); setTick((x) => x + 1); }} disabled={i === ordered.length - 1}
                    aria-label={`Bajar ${f.label}`} className="px-1 text-muted-foreground disabled:opacity-30">↓</button>
                  <span className="flex-1">{f.label}</span>
                  {ROLES.map((r) => (
                    <label key={r} className="text-xs text-muted-foreground flex items-center gap-1">
                      {r.slice(0, 3)}
                      <input type="checkbox" checked={!!fields[sec]?.[r]?.[f.id]}
                        onChange={() => toggleField(sec, r, f.id)} aria-label={`${f.label} para ${r}`} />
                    </label>
                  ))}
                </div>
                );
              })}
            </div>
            );
          })}
          <p className="text-xs text-muted-foreground md:col-span-2">Ocultar un campo no borra su dato, solo deja de mostrarse a ese rol. Las flechas cambian el orden de las columnas en la tabla.</p>
        </div>
      )}

      {tab === "etapas" && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Etapas del kanban. No se puede borrar una etapa con proyectos (muévelos primero).</p>
          {stages.map((s) => (
            <div key={s.id} className="flex items-center gap-2 py-1 border-b border-border last:border-0 text-sm">
              <input type="color" value={s.color} onChange={async (e) => {
                const color = e.target.value;
                try { await updateStage(s.id, { color }); } catch {}
                const ns = stages.map((x) => (x.id === s.id ? { ...x, color } : x));
                setStages(ns); savePipelineStages(ns);
              }} aria-label={`Color de ${s.name}`} className="w-8 h-8 rounded" />
              <input defaultValue={s.name} onBlur={(e) => { if (e.target.value.trim() && e.target.value !== s.name) renameStage(s.id, e.target.value.trim()); }}
                className="h-8 px-2 rounded bg-secondary border border-border text-sm flex-1" aria-label="Nombre de etapa" />
              <span className="text-xs text-muted-foreground">{usage[s.id] ?? 0} proy.</span>
              <button onClick={() => removeStage(s.id)} className="text-xs text-red-500 px-2 h-8">Eliminar</button>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <input placeholder="Nueva etapa (ej. Visita)" value={newName} onChange={(e) => setNewName(e.target.value)}
              className="h-9 px-3 rounded-lg bg-secondary border border-border text-sm flex-1" />
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-10 h-9 rounded" aria-label="Color nueva etapa" />
            <button onClick={addStage} className="h-9 px-3 rounded-lg bg-accent text-accent-foreground text-sm">Agregar</button>
          </div>
        </div>
      )}

      {tab === "personalizados" && (
        <div className="grid md:grid-cols-2 gap-4">
          {(["deals", "contacts"] as const).map((sec) => (
            <div key={sec} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <h3 className="font-medium text-sm">{sec === "deals" ? "Proyectos" : "Contactos"} — campos personalizados ({custom[sec].length})</h3>
              {custom[sec].map((f) => (
                <div key={f.id} className="flex items-center gap-2 text-sm py-1 border-b border-border last:border-0">
                  <span className="flex-1">{f.label} <span className="text-xs text-muted-foreground">({f.type}{f.type === "lista" && f.options ? `: ${f.options.join(", ")}` : ""})</span></span>
                  <button onClick={() => {
                    const nc = { ...custom, [sec]: custom[sec].filter((x) => x.id !== f.id) };
                    setCustom(nc); saveCustomFields(nc); toast.success("Campo eliminado (los valores quedan guardados)");
                  }} className="text-xs text-red-500">Quitar</button>
                </div>
              ))}
              {custom[sec].length === 0 && <p className="text-xs text-muted-foreground">Sin campos. Crea el primero abajo.</p>}
            </div>
          ))}
          <div className="rounded-xl border border-border bg-card p-4 md:col-span-2">
            <h3 className="font-medium text-sm mb-2">Nuevo campo</h3>
            <div className="flex flex-wrap gap-2">
              <select value={cfSection} onChange={(e) => setCfSection(e.target.value as "deals" | "contacts")}
                className="h-9 px-2 rounded-lg bg-secondary border border-border text-sm">
                <option value="deals">Proyectos</option>
                <option value="contacts">Contactos</option>
              </select>
              <input placeholder="Etiqueta (ej. Origen)" value={cfLabel} onChange={(e) => setCfLabel(e.target.value)}
                className="h-9 px-3 rounded-lg bg-secondary border border-border text-sm flex-1 min-w-40" />
              <select value={cfType} onChange={(e) => setCfType(e.target.value as "texto" | "numero" | "fecha" | "lista" | "si_no")}
                className="h-9 px-2 rounded-lg bg-secondary border border-border text-sm">
                <option value="texto">Texto</option>
                <option value="numero">Número</option>
                <option value="fecha">Fecha</option>
                <option value="lista">Lista</option>
                <option value="si_no">Sí/No</option>
              </select>
              {cfType === "lista" && (
                <input placeholder="Opciones separadas por coma" value={cfOpts} onChange={(e) => setCfOpts(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-secondary border border-border text-sm flex-1 min-w-40" />
              )}
              <button onClick={() => {
                if (!cfLabel.trim()) { toast.error("Ponle una etiqueta"); return; }
                const id = slugField(cfLabel);
                if (custom[cfSection].some((f) => f.id === id)) { toast.error("Ya existe un campo similar"); return; }
                const nc = { ...custom, [cfSection]: [...custom[cfSection], { id, label: cfLabel.trim(), type: cfType, options: cfType === "lista" ? cfOpts.split(",").map((s) => s.trim()).filter(Boolean) : undefined }] };
                setCustom(nc); saveCustomFields(nc); setCfLabel(""); setCfOpts("");
                toast.success("Campo creado en vivo");
              }} className="h-9 px-3 rounded-lg bg-accent text-accent-foreground text-sm">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {tab === "autos" && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          {([
            ["auto_contrato", "Aprobar → contrato", "Al aprobar cotizaciones se genera/actualiza el contrato PDF automáticamente. Si se apaga, aprobar solo cambia el estado."],
            ["pago_nota", "Pago → nota", "Al registrar un pago se deja una nota automática en el proyecto con el monto."],
            ["pago_cierre", "Pago total → sugerir cierre", "Si lo pagado cubre el valor, se sugiere marcar el proyecto como ganado."],
          ] as const).map(([id, label, desc]) => (
            <div key={id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
              <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <input type="checkbox" checked={autos[id]} onChange={() => {
                const na = { ...autos, [id]: !autos[id] };
                setAutos(na); saveAutomations(na); toast.success("Automatización actualizada");
              }} aria-label={label} className="mt-1" />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
