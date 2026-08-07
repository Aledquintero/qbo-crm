"use client";

// ============================================================
// PÁGINA: DEALS (Tabla de negocios)
// Para cambiar los negocios, edita: data/deals.ts
// ============================================================

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProjectDetail} from "@/features/ProjectDetail";
import { AddProjectPanel } from "@/components/AddProjectPanel";
import { projects as initialProjects, type Project } from "@/data/deals";
import {
  Search, Filter, ArrowUpDown, CheckCircle2,
  Clock, XCircle, MoreHorizontal, ChevronDown,
  Plus,
} from "lucide-react";

// Configuración visual de cada estado
const statusConfig = {
  won:     { icon: CheckCircle2, color: "text-success",     bg: "bg-success/10",     label: "Won"     },
  pending: { icon: Clock,         color: "text-warning",     bg: "bg-warning/10",     label: "Pending" },
  lost:    { icon: XCircle,       color: "text-destructive", bg: "bg-destructive/10", label: "Lost"    },
};

export function Deals() {
  const [searchQuery, setSearchQuery]     = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedProject, setSelectedProject]   = useState<Project | null>(null);
  const [projectList, setProjectList] = useState<Project[]>(initialProjects);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Si se seleccionó un proyecto, mostrar el detalle
  if (selectedProject) {
    return <ProjectDetail project={selectedProject} onBack={() => setSelectedProject(null)} onSave={(updated) => {
      setProjectList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedProject(updated);
    }} />;
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
              {filteredProjects.map((proj, index) => {
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
                  </tr>
                );
              })}
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
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={(data) => {
          const newProject: Project = {
            id: String(Date.now()),
            company: data.Nombre_proyecto || "—",
            contact: `${data.nombre} ${data.apellido}`,
            email: "",
            value: 0,
            stage: "Lead",
            status: "pending",
            closeDate: new Date().toISOString().slice(0, 10),
            rep: "—",
          };
          setProjectList((prev) => [newProject, ...prev]);
        }}
      />
    </div>
  );
}
