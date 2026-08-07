"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronDown,
  StickyNote,
  Mail,
  Phone,
  ListChecks,
  CalendarDays,
  MoreHorizontal,
  Settings2,
  Search,
  Plus,
  Contact as ContactIcon,
  Briefcase,
  FileText,
  Paperclip,
  X,
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

interface ContactDetailProps {
  contact: Contact;
  onBack: () => void;
}

const statusLabel: Record<Contact["status"], string> = {
  active: "En curso",
  pending: "Pendiente",
  inactive: "Inactivo",
};

const quickActions = [
  { icon: StickyNote, label: "Nota" },
  { icon: Mail, label: "Correo" },
  { icon: Phone, label: "Llamar" },
  { icon: ListChecks, label: "Tarea" },
  { icon: CalendarDays, label: "Reunión" },
  { icon: MoreHorizontal, label: "Más" },
];

const activityTabs = ["Todas las actividades", "Notas", "Correos", "Llamadas", "Tareas", "Reuniones"];

const mainTabs = ["Información destacada", "Actividades", "Personalizar"];

export function ContactDetail({ contact, onBack }: ContactDetailProps) {
  const [activeMainTab, setActiveMainTab] = useState("Actividades");
  const [activeActivityTab, setActiveActivityTab] = useState("Todas las actividades");

  const activities = [
    {
      title: "Actividad de Contacto",
      body: (
        <>
          {contact.name} fue movido a Oportunidad.{" "}
          <span className="text-accent font-medium cursor-pointer hover:underline">Ver detalles</span>
        </>
      ),
      time: "20 de jun. de 2026 a la(s) 15:25 GMT-4",
    },
    {
      title: "Actividad de Negocio",
      body: (
        <>
          <span className="text-accent font-medium cursor-pointer hover:underline">{contact.owner}</span> movió{" "}
          <span className="text-accent font-medium cursor-pointer hover:underline">Proyecto 1</span> a Lead.{" "}
          <span className="text-accent font-medium cursor-pointer hover:underline">Ver detalles</span>
        </>
      ),
      time: "20 de jun. de 2026 a la(s) 15:25 GMT-4",
    },
    {
      title: "Actividad de Negocio",
      body: (
        <>
          <span className="text-accent font-medium cursor-pointer hover:underline">{contact.owner}</span> creó negocio{" "}
          <span className="text-accent font-medium cursor-pointer hover:underline">Proyecto 1</span>
        </>
      ),
      time: "20 de jun. de 2026 a la(s) 15:25 GMT-4",
    },
    {
      title: "Actividad de Contacto",
      body: (
        <>
          <span className="text-accent font-medium cursor-pointer hover:underline">{contact.owner}</span> movió {contact.name} a Lead.{" "}
          <span className="text-accent font-medium cursor-pointer hover:underline">Ver detalles</span>
        </>
      ),
      time: "20 de jun. de 2026 a la(s) 15:15 GMT-4",
    },
    {
      title: "Creado",
      body: "Este objeto contacto fue creado a partir de Fuentes sin conexión de Interfaz de usuario del CRM",
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
              Contactos
            </button>
            <button className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent transition-colors">
              Acciones
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <ContactIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">{contact.name}</h2>
              <p className="text-sm text-muted-foreground truncate">{contact.title}</p>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-1 mt-5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className="flex flex-col items-center gap-1 group"
                  title={action.label}
                >
                  <span className="w-9 h-9 rounded-lg border border-border bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-accent group-hover:border-accent/40 transition-all duration-200">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Key info card */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Información clave</h3>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Acciones
                <ChevronDown className="w-3 h-3" />
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-xs text-muted-foreground">Número de teléfono</dt>
              <dd className="text-sm text-accent font-medium mt-0.5">{contact.phone}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Estado del lead</dt>
              <dd className="text-sm text-foreground mt-0.5">{statusLabel[contact.status]}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Dirección</dt>
              <dd className="text-sm text-muted-foreground mt-0.5">--</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Ciudad</dt>
              <dd className="text-sm text-muted-foreground mt-0.5">--</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fecha de creación</dt>
              <dd className="text-sm text-foreground mt-0.5">20/06/2026 15:15 GMT-4</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* ---------- Center column ---------- */}
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
        {/* Projects */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Proyectos (1)</h3>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                <Plus className="w-3 h-3" />
                Agregar
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent cursor-pointer hover:underline">Proyecto 1</span>
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
                <dt className="text-muted-foreground">Etapa del negocio:</dt>
                <dd className="flex items-center gap-1.5 text-foreground">
                  <span className="w-2 h-2 rounded-full bg-chart-1" />
                  Lead
                </dd>
              </div>
            </dl>
            <button className="mt-3 text-xs font-medium text-accent hover:underline">
              Agregar etiqueta de asociación
            </button>
          </div>

          <button className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            Ver todos los elementos asociados del tipo "...
          </button>
        </div>

        {/* Invoices */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Facturas</h3>
            </div>
            <button className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              Agregar
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-3 flex items-start gap-3">
            <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Crea una factura para cobrarle a tu cliente y hacer un seguimiento del pago.
            </p>
          </div>
        </div>

        {/* Attachments */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Archivos adjuntos</h3>
            </div>
            <button className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              Agregar
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-4 flex flex-col items-center text-center py-4">
            <span className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <Paperclip className="w-5 h-5" />
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3 max-w-[220px]">
              Ve los archivos adjuntos a las actividades o subidos en este registro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
