"use client";

import { useState, useEffect } from "react";
import { type Contact } from "@/data/contacts";
import { type Project } from "@/data/deals";
import { createProject, fetchProjectsByContact, updateProject } from "@/lib/api/projects";
import { AddProjectPanel, type ProjectFormData } from "@/components/AddProjectPanel";
import { ProjectDetail } from "@/features/ProjectDetail";
import {
  ChevronLeft, ChevronDown, StickyNote, Phone,
  Settings2, Search, Plus, Contact as ContactIcon, Briefcase,
  Trash2, X, Pencil, Save,
} from "lucide-react";

interface ContactDetailProps {
  contact: Contact;
  onBack: () => void;
  onSaveContact: (updated: Contact) => void;
}

const quickActions = [
  { icon: StickyNote, label: "Nota" },
  { icon: Phone,      label: "Llamar" },
];

export function ContactDetail({ contact, onBack, onSaveContact }: ContactDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Contact>({ ...contact });
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjectsByContact(contact.id)
      .then(setProjectList)
      .catch(console.error);
  }, [contact.id]);

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
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

  const updateDraft = (field: keyof Contact, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSaveContact(draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft({ ...contact });
    setIsEditing(false);
  };

  const handleAddProject = async (data: ProjectFormData) => {
    try {
      const saved = await createProject({
        contact_id: contact.id,
        company: data.Nombre_proyecto || "—",
        direccion: data.direccion || undefined,
      });
      setProjectList((prev) => [saved, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase.from("projects").delete().eq("id", projectId);
      setProjectList((prev) => prev.filter((p) => p.id !== projectId));
    } catch (e) {
      console.error(e);
    }
  };

  const nombre = contact.name;
  const apellido = contact.surname;

  const c = isEditing ? draft : contact;

  const activities = [
    {
      title: "Actividad de Contacto",
      body: (
        <>
          {contact.name} {contact.surname} fue movido a Oportunidad.{" "}
          <span className="text-accent font-medium cursor-pointer hover:underline">Ver detalles</span>
        </>
      ),
      time: "20 de jun. de 2026 a la(s) 15:25 GMT-4",
    },
    {
      title: "Actividad de Negocio",
      body: (
        <>
          <span className="text-accent font-medium cursor-pointer hover:underline">{contact.direccion}</span> movió{" "}
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
          <span className="text-accent font-medium cursor-pointer hover:underline">{contact.direccion}</span> creó negocio{" "}
          <span className="text-accent font-medium cursor-pointer hover:underline">Proyecto 1</span>
        </>
      ),
      time: "20 de jun. de 2026 a la(s) 15:25 GMT-4",
    },
    {
      title: "Actividad de Contacto",
      body: (
        <>
          <span className="text-accent font-medium cursor-pointer hover:underline">{contact.direccion}</span> movió {contact.name} {contact.surname} a Lead.{" "}
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

      {/* ---- Columna izquierda ---- */}
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Contactos
            </button>
            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <button onClick={handleSave}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-success hover:bg-success/10 transition-colors">
                    <Save className="w-3.5 h-3.5" /> Guardar
                  </button>
                  <button onClick={handleCancel}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <ContactIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="flex gap-2">
                  <input type="text" value={c.name} onChange={(e) => updateDraft("name", e.target.value)}
                    className="w-1/2 text-lg font-semibold text-foreground bg-secondary border border-border rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring/20" placeholder="Nombre" />
                  <input type="text" value={c.surname} onChange={(e) => updateDraft("surname", e.target.value)}
                    className="w-1/2 text-lg font-semibold text-foreground bg-secondary border border-border rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring/20" placeholder="Apellido" />
                </div>
              ) : (
                <h2 className="text-lg font-semibold text-foreground truncate">{c.name} {c.surname}</h2>
              )}
              {isEditing ? (
                <input type="text" value={c.title} onChange={(e) => updateDraft("title", e.target.value)}
                  className="w-full text-sm text-muted-foreground bg-secondary border border-border rounded-md px-2 py-0.5 mt-0.5 focus:outline-none focus:ring-2 focus:ring-ring/20"
                  placeholder="Cargo" />
              ) : (
                <p className="text-sm text-muted-foreground truncate">{c.title || "—"}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-6 gap-1 mt-5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button key={action.label} className="flex flex-col items-center gap-1 group" title={action.label}>
                  <span className="w-9 h-9 rounded-lg border border-border bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-accent group-hover:border-accent/40 transition-all duration-200">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Información clave</h3>
            </div>
          </div>

          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-xs text-muted-foreground">Número de teléfono</dt>
              <dd className="text-sm mt-0.5">
                {isEditing ? (
                  <input type="text" value={c.phone} onChange={(e) => updateDraft("phone", e.target.value)}
                    className="w-full h-8 px-2 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent" />
                ) : (
                  <span className="text-accent font-medium">{c.phone}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Dirección</dt>
              <dd className="text-sm mt-0.5">
                {isEditing ? (
                  <input type="text" value={c.address ?? ""} onChange={(e) => updateDraft("address", e.target.value)}
                    className="w-full h-8 px-2 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent" />
                ) : (
                  <span className="text-muted-foreground">{c.address || c.direccion || "—"}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Ciudad</dt>
              <dd className="text-sm mt-0.5">
                {isEditing ? (
                  <input type="text" value={c.city ?? ""} onChange={(e) => updateDraft("city", e.target.value)}
                    className="w-full h-8 px-2 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent" />
                ) : (
                  <span className="text-muted-foreground">{c.city || "—"}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">RUT</dt>
              <dd className="text-sm mt-0.5">
                {isEditing ? (
                  <input type="text" value={c.rut ?? ""} onChange={(e) => updateDraft("rut", e.target.value)}
                    className="w-full h-8 px-2 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent" />
                ) : (
                  <span className="text-foreground">{c.rut || "—"}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fecha de creación</dt>
              <dd className="text-sm text-foreground mt-0.5">{c.lastContact}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* ---- Columna central (actividades) ---- */}
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="mt-4 space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Buscar actividades"
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-foreground">
                Actividad (25/35) <ChevronDown className="w-3 h-3" /> <X className="w-3 h-3 text-muted-foreground" />
              </button>
              <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Todo <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Actividad asignada a <ChevronDown className="w-3 h-3" />
              </button>
              <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Borrar todo
              </button>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">junio 2026</p>
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={index}
                  className="rounded-lg border border-border bg-secondary/40 p-4 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{activity.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{activity.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Columna derecha ---- */}
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Proyectos ({projectList.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsAddProjectOpen(true)}
                className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>
          </div>

          {projectList.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground text-center py-6">
              No hay proyectos asignados a este contacto
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {projectList.map((proj) => (
                <div key={proj.id}
                  onClick={() => setSelectedProject(proj)}
                  className="rounded-lg border border-border bg-secondary/40 p-4 relative group cursor-pointer hover:border-accent/30 transition-colors duration-200">
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj.id); }}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                    title="Eliminar proyecto">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium text-accent cursor-pointer hover:underline">
                      {proj.company}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Valor:</dt>
                      <dd className="text-foreground font-medium">${proj.value.toLocaleString()} CLP</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Etapa:</dt>
                      <dd className="flex items-center gap-1.5 text-foreground">
                        <span className="w-2 h-2 rounded-full bg-chart-1" />
                        {proj.stage}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Estado:</dt>
                      <dd className="text-foreground">{proj.status}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Cierre:</dt>
                      <dd className="text-foreground">{proj.closeDate}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}

          <button className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            Ver todos los elementos asociados del tipo &quot;...
          </button>
        </div>
      </div>

      <AddProjectPanel
        open={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        onSave={handleAddProject}
        initialData={{
          nombre,
          apellido,
          cliente_proyecto: `${contact.name} ${contact.surname}`,
        }}
      />
    </div>
  );
}