"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronDown,
  Home,
  Pencil,
  Plus,
  Mail,
  FileText,
  ImageIcon,
  Search,
  X,
} from "lucide-react";

const mainTabs = ["Información destacada", "Actividades", "Personalizar"];
const activityTabs = ["Todas las actividades", "Notas", "Correos", "Llamadas", "Tareas", "Reuniones"];

interface Project {
  id: string;
  company: string;
  contact: string;
  email: string;
  value: number;
  stage: string;
  status: "won" | "pending" | "lost";
  closeDate: string;
  rep: string;
}

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

const stageLabel: Record<Project["status"], string> = {
  won: "Cierre",
  pending: "Visita",
  lost: "Perdido",
};

function UploadRow({ label, icon: Icon }: { label: string; icon: typeof FileText }) {
  return (
    <div className="mt-3 rounded-lg border border-border bg-secondary/40 p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-sm text-muted-foreground truncate">{label}</span>
      </div>
      <button className="px-3 py-1.5 rounded-md bg-secondary text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors shrink-0">
        Seleccionar
      </button>
    </div>
  );
}

function SectionHeader({
  title,
  collapsible = true,
  action,
}: {
  title: string;
  collapsible?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {collapsible && <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {action}
    </div>
  );
}

export function DealDetail({ project, onBack }: ProjectDetailProps) {
  const [activeMainTab, setActiveMainTab] = useState("Actividades");
  const [activeActivityTab, setActiveActivityTab] = useState("Todas las actividades");

  const activities = [
    {
      title: "Actividad de Negocio",
      body: (
        <>
          <span className="text-accent font-medium cursor-pointer hover:underline">{project.rep}</span> movió{" "}
          <span className="text-accent font-medium cursor-pointer hover:underline">{project.company}</span> a{" "}
          {stageLabel[project.status]}.{" "}
          <span className="text-accent font-medium cursor-pointer hover:underline">Ver detalles</span>
        </>
      ),
      time: "20 de jun. de 2026 a la(s) 15:25 GMT-4",
    },
    {
      title: "Actividad de Cotización",
      body: (
        <>
          <span className="text-accent font-medium cursor-pointer hover:underline">{project.rep}</span> creó la cotización{" "}
          <span className="text-accent font-medium cursor-pointer hover:underline">Cotización 123</span> por{" "}
          ${project.value.toLocaleString()} CLP.
        </>
      ),
      time: "20 de jun. de 2026 a la(s) 15:25 GMT-4",
    },
    {
      title: "Actividad de Contacto",
      body: (
        <>
          <span className="text-accent font-medium cursor-pointer hover:underline">{project.contact}</span> fue asociado al
          proyecto.{" "}
          <span className="text-accent font-medium cursor-pointer hover:underline">Ver detalles</span>
        </>
      ),
      time: "20 de jun. de 2026 a la(s) 15:15 GMT-4",
    },
    {
      title: "Creado",
      body: "Este negocio fue creado a partir de Fuentes sin conexión de Interfaz de usuario del CRM",
      time: "20 de jun. de 2026 a la(s) 15:15 GMT-4",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ---------- Left column ---------- */}
      <div className="space-y-4">
        {/* Identity card */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Proyectos
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{project.company}</h2>
              <p className="text-sm text-muted-foreground truncate">Saldo pendiente: 50.000$ CLP</p>
            </div>
          </div>

          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-xs text-muted-foreground">Valor Proyecto</dt>
              <dd className="text-sm font-semibold text-accent mt-0.5">
                ${project.value.toLocaleString()} CLP
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Dirección del Proyecto</dt>
              <dd className="text-sm text-foreground mt-0.5">Arquitecto Andres Murillo 1499, La Serena</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fecha de Creación</dt>
              <dd className="text-sm text-foreground mt-0.5">21/05/2026 15:34 GMT-4</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fecha de Visita</dt>
              <dd className="text-sm text-foreground mt-0.5">21/05/2026 15:34 GMT-4</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fecha de Instalación</dt>
              <dd className="text-sm text-foreground mt-0.5">21/05/2026 15:34 GMT-4</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fecha de Cierre</dt>
                <dd className="text-sm text-foreground mt-0.5">{project.closeDate} 15:34 GMT-4</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Estado</dt>
              <dd className="text-sm text-foreground mt-0.5">{stageLabel[project.status]}</dd>
            </div>
          </dl>
        </div>

        {/* Ficha de Proyecto */}
        <div className="bg-card border border-border rounded-xl p-4">
          <SectionHeader
            title="Ficha de Proyecto"
            collapsible={false}
            action={
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            }
          />
          <UploadRow label="Subir documento" icon={FileText} />
        </div>

        {/* Fotos Proyecto Finalizado */}
        <div className="bg-card border border-border rounded-xl p-4">
          <SectionHeader
            title="Fotos Proyecto Finalizado"
            collapsible={false}
            action={
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            }
          />
          <UploadRow label="Subir imágenes" icon={ImageIcon} />
        </div>
      </div>

      {/* ---------- Center column (activity wall) ---------- */}
      <div className="space-y-4">
        {/* Main tabs */}
        <div className="bg-card border border-border rounded-xl p-1.5 flex items-center gap-1">
          {mainTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMainTab(tab)}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeMainTab === tab
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Activities panel */}
        <div className="bg-card border border-border rounded-xl p-4">
          {/* Activity sub-tabs */}
          <div className="flex items-center gap-4 border-b border-border overflow-x-auto">
            {activityTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveActivityTab(tab)}
                className={cn(
                  "relative pb-3 text-sm font-medium whitespace-nowrap transition-colors",
                  activeActivityTab === tab
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
                {activeActivityTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent" />
                )}
              </button>
            ))}
          </div>

          {/* Search + filters */}
          <div className="mt-4 space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar actividades"
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-foreground">
                Actividad (25/35)
                <ChevronDown className="w-3 h-3" />
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
              <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Todo
                <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Actividad asignada a
                <ChevronDown className="w-3 h-3" />
              </button>
              <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Borrar todo
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              junio 2026
            </p>
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-secondary/40 p-4 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {activity.time}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{activity.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Right column ---------- */}
      <div className="space-y-4">
        {/* Cotizaciones */}
        <div className="bg-card border border-border rounded-xl p-4">
          <SectionHeader
            title="Cotizaciones (1)"
            action={
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <Plus className="w-4 h-4" />
              </button>
            }
          />

          <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">Cotización 123</span>
              </div>
              <input
                type="checkbox"
                aria-label="Seleccionar cotización"
                className="w-4 h-4 rounded border-border accent-[var(--accent)] shrink-0"
              />
            </div>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Valor:</dt>
                <dd className="text-foreground font-medium">123.456 CLP</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Fecha de cierre:</dt>
                <dd className="text-foreground">20 de junio de 2026</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Estado:</dt>
                <dd className="flex items-center gap-1.5 text-foreground">
                  aceptado
                  <span className="w-2 h-2 rounded-full bg-success" />
                </dd>
              </div>
            </dl>
          </div>

          <button className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            Aprobar presupuestos
          </button>
        </div>

        {/* Contrato */}
        <div className="bg-card border border-border rounded-xl p-4">
          <SectionHeader
            title="Contrato"
            action={
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            }
          />
          <UploadRow label="Subir documento" icon={FileText} />
        </div>

        {/* Pagos */}
        <div className="bg-card border border-border rounded-xl p-4">
          <SectionHeader
            title="Pagos"
            action={
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            }
          />
          <UploadRow label="Subir documento" icon={FileText} />
        </div>

        {/* Diseño 3D */}
        <div className="bg-card border border-border rounded-xl p-4">
          <SectionHeader
            title="Diseño 3D"
            action={
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            }
          />
          <UploadRow label="Subir documento" icon={FileText} />
        </div>
      </div>
    </div>
  );
}
