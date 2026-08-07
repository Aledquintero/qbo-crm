"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ProjectDetail } from "@/features/ProjectDetail";
import { AddProjectPanel } from "@/components/AddProjectPanel";
import { fetchProjects, createProject, updateProject } from "@/lib/api/projects";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/data/deals";
import {
  Search, Filter, ArrowUpDown, CheckCircle2,
  Clock, XCircle, MoreHorizontal, ChevronDown,
  Plus, Pencil, Trash2,
} from "lucide-react";

const statusConfig = {
  won:     { icon: CheckCircle2, color: "text-success",     bg: "bg-success/10",     label: "Won"     },
  pending: { icon: Clock,         color: "text-warning",     bg: "bg-warning/10",     label: "Pending" },
  lost:    { icon: XCircle,       color: "text-destructive", bg: "bg-destructive/10", label: "Lost"    },
};

export function Projects({ onContactClick }: { onContactClick?: (id: string) => void }) {
  const [searchQuery, setSearchQuery]     = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject]   = useState<Project | null>(null);
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<{ project: Project; x: number; y: number } | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProjects()
      .then(setProjectList)
      .catch(console.error)
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
    try {
      await supabase.from("projects").delete().eq("id", id);
      setProjectList((prev) => prev.filter((p) => p.id !== id));
      setMenuTarget(null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProjects()
      .then(setProjectList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
          } catch (e) {
            console.error(e);
          }
        }}
      />
    );
  }

  // Filtrar la lista según búsqueda y filtro de estado
  const filteredProjects = projectList.filter((proj) => {
    const matchesSearch =
      proj.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.contact.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || proj.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">View and manage all your projects in one place</p>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 h-9 pl-9 pr-4 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all duration-200"
            />
          </div>
          {/* Botones de filtro por estado */}
          <div className="flex items-center gap-2">
            {["all", "won", "pending", "lost"].map((filter) => (
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

      {/* Tabla de proyectos */}
      <div className="bg-card border border-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Company <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Value <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saldo</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stage</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha de Cierre</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha de Instalación</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha de Visita</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha de Creación</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground text-sm">Cargando proyectos...</td></tr>
              ) : filteredProjects.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-muted-foreground text-sm">No se encontraron proyectos</td></tr>
              ) : (
                filteredProjects.map((proj, index) => {
                  const status = statusConfig[proj.status];
                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={proj.id}
                      onClick={() => setSelectedProject(proj)}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors duration-150 cursor-pointer animate-in fade-in slide-in-from-left-2"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground">
                            {proj.company.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-foreground">{proj.company}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm text-foreground">{proj.contact}</p>
                          <p className="text-xs text-muted-foreground">{proj.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold text-foreground">
                          ${proj.value.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold text-foreground">
                          ${proj.value.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 rounded-md bg-secondary text-xs font-medium text-foreground">
                          {proj.stage}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">{proj.closeDate}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">{proj.closeDate}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">{proj.closeDate}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">{proj.closeDate}</span>
                      </td>
                      <td className="py-4 px-4 relative">
                        <button
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/30">
          <span className="text-sm text-muted-foreground">
            Showing {filteredProjects.length} of {projectList.length} projects
          </span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200">Previous</button>
            <button className="px-3 py-1.5 rounded-lg text-sm bg-accent text-accent-foreground font-medium">1</button>
            <button className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200">2</button>
            <button className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200">Next</button>
          </div>
        </div>
      </div>

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
            }
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
