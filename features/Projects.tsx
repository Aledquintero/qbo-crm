"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { ProjectDetail } from "@/features/ProjectDetail";
import { AddProjectPanel } from "@/components/AddProjectPanel";
import { fetchProjects, createProject, updateProject } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/data/deals";
import {
  Search, ArrowUpDown,
  MoreHorizontal, ChevronDown,
  Plus, Pencil, Trash2, Columns3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  loadPipelineStages,
  stageMeta,
  type PipelineStage,
} from "@/lib/pipeline-stages";
import { getSession } from "@/lib/auth/store";
import type { Role } from "@/lib/auth/types";
import { canSeeField, canSeeBlock, loadCustomFields, saveCustomFields, slugField, loadColumnOrder, customLabel, label, type CustomField, type CustomFieldType } from "@/lib/constructor/store";
import { fetchCustomValues } from "@/lib/custom-values";

/** Convierte un hex (#rgb o #rrggbb) a sus componentes rgb. */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  if (full.length !== 6 || isNaN(num)) return { r: 148, g: 163, b: 184 };
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

type ProjectColumnId =
  | "company"
  | "contact"
  | "value"
  | "saldo"
  | "stage"
  | "closeDate"
  | "fecha_instalacion"
  | "fecha_visita"
  | "created_at";

const PROJECT_COLUMNS: { id: ProjectColumnId; label: string }[] = [
  { id: "company",            label: "Company" },
  { id: "contact",            label: "Contact" },
  { id: "value",              label: "Value" },
  { id: "saldo",              label: "Saldo" },
  { id: "stage",              label: "Stage" },
  { id: "closeDate",          label: "Fecha de Cierre" },
  { id: "fecha_instalacion",  label: "Fecha de Instalación" },
  { id: "fecha_visita",       label: "Fecha de Visita" },
  { id: "created_at",         label: "Fecha de Creación" },
];

const PROJECT_COLUMNS_KEY = "projects-visible-columns";

function getDefaultProjectColumns(): Record<ProjectColumnId, boolean> {
  return {
    company: true,
    contact: true,
    value: true,
    saldo: true,
    stage: true,
    closeDate: true,
    fecha_instalacion: true,
    fecha_visita: true,
    created_at: true,
  };
}

function loadProjectColumns(): Record<ProjectColumnId, boolean> {
  const defaults = getDefaultProjectColumns();
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(PROJECT_COLUMNS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Record<ProjectColumnId, boolean>>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function Projects({ onContactClick, viewRole }: { onContactClick?: (id: string) => void; viewRole?: Role }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject]   = useState<Project | null>(null);
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<{ project: Project; x: number; y: number } | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<ProjectColumnId, boolean>>(loadProjectColumns);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(() => loadPipelineStages());
  const [paidByProject, setPaidByProject] = useState<Record<string, number>>({});
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<"company" | "value" | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const PAGE_SIZE = 10;
  const role = viewRole ?? getSession()?.rol ?? "Vendedor";
  const col = (id: ProjectColumnId) => visibleColumns[id] && canSeeField("deals", role, id);
  const colOrder = loadColumnOrder().deals;
  const orderedVisible = colOrder.filter((id) => (PROJECT_COLUMNS.some((c) => c.id === id) ? col(id as ProjectColumnId) : false));
  const t = (key: string) => customLabel("deals", key) ?? label("deals", key);
  const CUSTOM_COLS_KEY = "projects-custom-columns";
  const [customFields, setCustomFields] = useState<CustomField[]>(() => {
    try { return loadCustomFields().deals; } catch { return []; }
  });
  const [customCols, setCustomCols] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(CUSTOM_COLS_KEY) ?? "{}") as Record<string, boolean>; } catch { return {}; }
  });
  const [customValues, setCustomValues] = useState<Record<string, Record<string, string>>>({});
  const [cfLabel, setCfLabel] = useState("");
  const [cfType, setCfType] = useState<CustomFieldType>("texto");
  const [cfOpts, setCfOpts] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Recargar las etapas (nombre y color) cada vez que se monta la vista,
  // por si se editaron en el Pipeline.
  useEffect(() => {
    setPipelineStages(loadPipelineStages());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROJECT_COLUMNS_KEY, JSON.stringify(visibleColumns));
    } catch {
      // ignorar errores de almacenamiento
    }
  }, [visibleColumns]);

  useEffect(() => {
    try { window.localStorage.setItem(CUSTOM_COLS_KEY, JSON.stringify(customCols)); } catch {}
  }, [customCols]);

  const visibleCustom = customFields.filter((f) => customCols[f.id] !== false);
  const customCount = visibleCustom.length;

  const toggleProjectColumn = (id: ProjectColumnId, value: boolean) =>
    setVisibleColumns((prev) => ({ ...prev, [id]: value }));
  const showAllProjectColumns = () =>
    setVisibleColumns(getDefaultProjectColumns());
  const hideAllProjectColumns = () =>
    setVisibleColumns((prev) => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<ProjectColumnId, boolean>));
  const visibleProjectCount = PROJECT_COLUMNS.filter((c) => col(c.id)).length;

  useEffect(() => {
    Promise.all([
      fetchProjects(),
      supabase.from("payments").select("project_id, monto, estado"),
    ])
      .then(([projects, paymentsRes]) => {
        setProjectList(projects);
        setLoadError(false);
        if (!paymentsRes.error && Array.isArray(paymentsRes.data)) {
          const paid: Record<string, number> = {};
          for (const pay of paymentsRes.data as { project_id: string | null; monto: number | null; estado: string | null }[]) {
            if (!pay.project_id || pay.estado !== "pagado") continue;
            paid[pay.project_id] = (paid[pay.project_id] ?? 0) + (pay.monto ?? 0);
          }
          setPaidByProject(paid);
        }
      })
      .catch((e) => {
        console.error(e);
        setLoadError(true);
        toast.error("No se pudieron cargar los proyectos");
      })
      .finally(() => setLoading(false));
  }, []);

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

  const handleDelete = async (id: string) => {
    const target = projectList.find((p) => p.id === id);
    if (!confirm(`¿Eliminar el proyecto "${target?.company ?? id}"? Esta acción no se puede deshacer.`)) return;
    try {
      await supabase.from("projects").delete().eq("id", id);
      setProjectList((prev) => prev.filter((p) => p.id !== id));
      setMenuTarget(null);
      toast.success("Proyecto eliminado");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar el proyecto");
    }
  };

  // Filtro/orden/paginación ANTES del return temprano (los hooks deben
  // ejecutarse siempre en el mismo orden).
  const q = searchQuery.toLowerCase();
  const baseFiltered = projectList.filter((proj) => {
    return (
      proj.company.toLowerCase().includes(q) ||
      proj.contact.toLowerCase().includes(q)
    );
  });
  const filteredProjects = !sortKey ? baseFiltered : [...baseFiltered].sort((a, b) => {
    if (sortKey === "company") return a.company.localeCompare(b.company) * sortDir;
    return (a.value - b.value) * sortDir;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedProjects = filteredProjects.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (visibleCustom.length === 0 || paginatedProjects.length === 0) return;
    let alive = true;
    Promise.all(paginatedProjects.map(async (p) => [p.id, await fetchCustomValues("project", p.id).catch(() => ({}))] as const))
      .then((rows) => { if (alive) setCustomValues(Object.fromEntries(rows)); })
      .catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safePage, filteredProjects.length, visibleCustom.length]);

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onContactClick={onContactClick}
        onSave={async (updated) => {
          try {
            const saved = await updateProject(updated.id, {
              company: updated.company,
              email: updated.email,
              value: updated.value,
              stage: updated.stage,
              status: updated.status,
              close_date: updated.closeDate,
              rep: updated.rep,
            });
            setProjectList((prev) =>
              prev.map((p) => (p.id === saved.id ? saved : p))
            );
            setSelectedProject(saved);
            toast.success("Proyecto guardado");
          } catch (e) {
            console.error(e);
            toast.error("No se pudo guardar el proyecto");
          }
        }}
      />
    );
  }

  const toggleSort = (key: "company" | "value") => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir(1);
    } else {
      setSortDir((d) => (d === 1 ? -1 : 1));
    }
  };

  const addCustomColumn = () => {
    if (!cfLabel.trim()) { toast.error("Ponle un nombre a la columna"); return; }
    const all = loadCustomFields();
    const id = slugField(cfLabel);
    if ([...all.deals, ...all.contacts].some((f) => f.id === id)) { toast.error("Ya existe una columna similar"); return; }
    const nf = { id, label: cfLabel.trim(), type: cfType, options: cfType === "lista" ? cfOpts.split(",").map((s) => s.trim()).filter(Boolean) : undefined };
    const next = { ...all, deals: [...all.deals, nf] };
    saveCustomFields(next);
    setCustomFields(next.deals);
    setCustomCols((prev) => ({ ...prev, [id]: true }));
    setCfLabel(""); setCfOpts("");
    toast.success(`Columna "${nf.label}" creada`);
  };

  const projectSaldo = (id: string, value: number) =>
    Math.max(0, value - (paidByProject[id] ?? 0));

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda y acciones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {canSeeBlock("deals", role, "buscador") && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("search")}
            aria-label={t("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 h-9 pl-9 pr-4 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all duration-200"
          />
        </div>
        )}
        {canSeeBlock("deals", role, "acciones") && (
      <div className="flex items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">
                <Columns3 className="w-4 h-4" />
                {t("columns")}
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Columnas visibles</span>
                <span className="flex items-center gap-2 text-xs font-normal">
                  <button
                    onClick={showAllProjectColumns}
                    className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Todas
                  </button>
                  <span className="text-border">|</span>
                  <button
                    onClick={hideAllProjectColumns}
                    className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Ninguna
                  </button>
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {PROJECT_COLUMNS.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={visibleColumns[c.id]}
                  onCheckedChange={(v) => toggleProjectColumn(c.id, v === true)}
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
                <input placeholder="Nombre (ej. Origen)" value={cfLabel} onChange={(e) => setCfLabel(e.target.value)}
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
                <p className="text-[11px] text-muted-foreground">Se rellena en el detalle del proyecto.</p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity duration-200"
          >
            <Plus className="w-4 h-4" />
            {t("add")}
          </button>
      </div>
        )}
      </div>

      {/* Resumen */}
      {canSeeBlock("deals", role, "resumen") && (
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">
          {filteredProjects.length} {filteredProjects.length === 1 ? "proyecto" : "proyectos"}
        </span>
      </div>
      )}

      {/* Tabla de proyectos */}
      {canSeeBlock("deals", role, "tabla") && (
      <div className="bg-card border border-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                {orderedVisible.map((id) => (
                  <th key={id} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {id === "company" ? (
                      <button onClick={() => toggleSort("company")} aria-label="Ordenar por empresa" className="flex items-center gap-1 hover:text-foreground transition-colors">
                        {t("col_company")} <ArrowUpDown className="w-3 h-3" />
                      </button>
                    ) : id === "value" ? (
                      <button onClick={() => toggleSort("value")} aria-label="Ordenar por valor" className="flex items-center gap-1 hover:text-foreground transition-colors">
                        {t("col_value")} <ArrowUpDown className="w-3 h-3" />
                      </button>
                    ) : (
                      t(`col_${id}`)
                    )}
                  </th>
                ))}
                {visibleCustom.map((f) => (
                  <th key={f.id} className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{f.label}</th>
                ))}
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={(visibleProjectCount + customCount + 1)} className="text-center py-12 text-muted-foreground text-sm">Cargando proyectos...</td></tr>
              ) : loadError ? (
                <tr><td colSpan={(visibleProjectCount + customCount + 1)} className="text-center py-12 text-sm">
                  <p className="text-muted-foreground">No se pudieron cargar los proyectos</p>
                  <button onClick={() => window.location.reload()} className="mt-2 px-3 py-1.5 rounded-lg bg-secondary text-sm">Reintentar</button>
                </td></tr>
              ) : filteredProjects.length === 0 ? (
                <tr><td colSpan={(visibleProjectCount + customCount + 1)} className="text-center py-12 text-muted-foreground text-sm">No se encontraron proyectos</td></tr>
              ) : (
                paginatedProjects.map((proj, index) => {
                  const meta = stageMeta(pipelineStages, proj.stage);
                  const { r, g, b } = hexToRgb(meta.color);

                  return (
                    <tr
                      key={proj.id}
                      onClick={() => setSelectedProject(proj)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedProject(proj); } }}
                      tabIndex={0}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer animate-in fade-in slide-in-from-left-2"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                    >
                      {orderedVisible.map((id) => (
                      <td key={id} className="py-4 px-4">
                        {id === "company" ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground">
                            {proj.company.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-foreground">{proj.company}</span>
                        </div>
                        ) : id === "contact" ? (
                        <div>
                          <p className="text-sm text-foreground">{proj.contact}</p>
                          <p className="text-xs text-muted-foreground">{proj.email}</p>
                        </div>
                        ) : id === "value" ? (
                        <span className="text-sm font-semibold text-foreground">
                          ${proj.value.toLocaleString()}
                        </span>
                        ) : id === "saldo" ? (
                        <span className="text-sm font-semibold text-foreground">
                          ${projectSaldo(proj.id, proj.value).toLocaleString()}
                        </span>
                        ) : id === "stage" ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium backdrop-blur-sm"
                          style={{
                            backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
                            borderColor: `rgba(${r}, ${g}, ${b}, 0.35)`,
                            color: meta.color,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: meta.color }}
                          />
                          {meta.name}
                        </span>
                        ) : id === "closeDate" ? (
                        <span className="text-sm text-muted-foreground">{proj.closeDate || "—"}</span>
                        ) : id === "fecha_instalacion" ? (
                        <span className="text-sm text-muted-foreground">{proj.fecha_instalacion || "—"}</span>
                        ) : id === "fecha_visita" ? (
                        <span className="text-sm text-muted-foreground">{proj.fecha_visita || "—"}</span>
                        ) : (
                        <span className="text-sm text-muted-foreground">{proj.created_at ? new Date(proj.created_at).toLocaleDateString() : "—"}</span>
                        )}
                      </td>
                      ))}
                      {visibleCustom.map((f) => (
                        <td key={f.id} className="py-4 px-4">
                          <span className="text-sm text-muted-foreground">{customValues[proj.id]?.[f.id] || "—"}</span>
                        </td>
                      ))}
                      <td className="py-4 px-4 relative">
                        <button
                          aria-label={`Opciones de ${proj.company}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setMenuTarget(menuTarget?.project.id === proj.id ? null : { project: proj, x: rect.right - 144, y: rect.bottom + 4 });
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
        </div>

        {/* Paginación */}
        {canSeeBlock("deals", role, "paginacion") && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/30">
          <span className="text-sm text-muted-foreground">
            Mostrando {paginatedProjects.length} de {filteredProjects.length} proyectos
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200 disabled:opacity-40">Anterior</button>
            <button className="px-3 py-1.5 rounded-lg text-sm bg-accent text-accent-foreground font-medium">{safePage}</button>
            <span className="text-sm text-muted-foreground">de {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200 disabled:opacity-40">Siguiente</button>
          </div>
        </div>
        )}
      </div>
      )}

      <AddProjectPanel
        open={isAddOpen || !!editProject}
        onClose={() => { setIsAddOpen(false); setEditProject(null); }}
        initialData={editProject ? {
          nombre: editProject.contact.split(" ")[0] || "",
          apellido: editProject.contact.split(" ").slice(1).join(" ") || "",
          Nombre_proyecto: editProject.company,
          direccion: editProject.direccion ?? "",
          ciudad: "",
          rut: "",
          cliente_proyecto: editProject.contact,
        } : undefined}
        onSave={async (data) => {
          try {
            if (editProject) {
              const saved = await updateProject(editProject.id, {
                company: data.Nombre_proyecto || "—",
                direccion: data.direccion || undefined,
              });
              setProjectList((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
              setEditProject(null);
              toast.success("Proyecto actualizado");
            } else {
              const { supabase } = await import("@/lib/supabase");
              const { data: contact } = await supabase
                .from("contacts")
                .select("id")
                .eq("name", data.cliente_proyecto)
                .maybeSingle();

              const saved = await createProject({
                contact_id: contact?.id ?? "",
                company: data.Nombre_proyecto || "—",
                direccion: data.direccion || undefined,
              });
              setProjectList((prev) => [saved, ...prev]);
              toast.success("Proyecto creado");
            }
          } catch (e) {
            console.error(e);
            toast.error("No se pudo guardar el proyecto");
          }
        }}
      />

      {menuTarget && createPortal(
        <div ref={menuRef}
          style={{ position: "fixed", left: menuTarget.x, top: menuTarget.y, zIndex: 9999 }}
          className="w-36 rounded-xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            onClick={() => { setEditProject(menuTarget.project); setMenuTarget(null); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors rounded-t-xl"
          >
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
          <button
            onClick={() => { handleDelete(menuTarget.project.id); }}
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
