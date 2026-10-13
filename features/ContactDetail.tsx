"use client";

import { useState, useEffect } from "react";
import { type Contact } from "@/data/contacts";
import { type Project } from "@/data/deals";
import { createProject, fetchProjectsByContact, updateProject } from "@/lib/api";
import { AddProjectPanel, type ProjectFormData } from "@/components/AddProjectPanel";
import { ContactNotesBoard } from "@/components/ProjectNotesBoard";
import { CustomFieldsCard } from "@/components/CustomFieldsCard";
import { ProjectDetail } from "@/features/ProjectDetail";
import {
  ChevronLeft, ChevronDown, StickyNote, Phone,
  Plus, Contact as ContactIcon,
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
        <CustomFieldsCard entity="contact" entityId={contact.id} section="contacts" />
      </div>

      {/* ---- Columna central (notas) ---- */}
      <div className="space-y-4">
        <ContactNotesBoard contactId={contact.id} />
      </div>

      {/* ---- Columna derecha ---- */}
      <div className="py-1">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            Proyectos ({projectList.length})
          </p>
          <button onClick={() => setIsAddProjectOpen(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>

        {projectList.length === 0 ? (
          <p className="mt-2 px-1 text-xs text-muted-foreground">
            Sin proyectos
          </p>
        ) : (
          <div className="mt-1 divide-y divide-border">
            {projectList.map((proj) => (
              <div key={proj.id}
                onClick={() => setSelectedProject(proj)}
                className="group flex items-center gap-2 px-1 py-2 cursor-pointer">
                <span className="w-1.5 h-1.5 rounded-full bg-chart-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate hover:underline">
                    {proj.company}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {proj.stage} · ${proj.value.toLocaleString()}
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj.id); }}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                  title="Eliminar proyecto">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
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