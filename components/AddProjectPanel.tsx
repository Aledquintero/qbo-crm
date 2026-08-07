"use client";

import { useEffect, useState } from "react";
import { SidePanel } from "@/components/SidePanel";
import { ContactSelector } from "@/components/ContactSelector";

// Contactos extraídos de tu CRM para el desplegable
const contactosExistentesCRM = [
  "John Smith",
  "Lisa Wong",
  "Robert Davis",
  "Emma Wilson",
  "Michael Chen",
  "Jennifer Park"
];

export type ProjectFormData = {
  nombre: string;
  apellido: string;
  Nombre_proyecto: string;
  direccion: string;
  ciudad: string;
  rut: string;
  cliente_proyecto: string; // Añadido para el desplegable
};

const emptyForm: ProjectFormData = {
  nombre: "",
  apellido: "",
  Nombre_proyecto: "",
  direccion: "",
  ciudad: "",
  rut: "",
  cliente_proyecto: "",
};

interface AddProjectPanelProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ProjectFormData) => void;
  initialData?: Partial<ProjectFormData>;
}

export function AddProjectPanel({ open, onClose, onSave, initialData }: AddProjectPanelProps) {
  const [form, setForm] = useState<ProjectFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<"nombre" | "apellido", string>>>({});

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setErrors({});
    } else if (initialData) {
      setForm({ ...emptyForm, ...initialData });
    }
  }, [open, initialData]);

  const updateField = (field: keyof ProjectFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "nombre" || field === "apellido") {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Partial<Record<"nombre" | "apellido", string>> = {};
    if (!form.nombre.trim()) nextErrors.nombre = "El nombre es obligatorio";
    if (!form.apellido.trim()) nextErrors.apellido = "El apellido es obligatorio";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      Nombre_proyecto: form.Nombre_proyecto.trim(),
      direccion: form.direccion.trim(),
      ciudad: form.ciudad.trim(),
      rut: form.rut.trim(),
      cliente_proyecto: form.cliente_proyecto.trim(),
    });
    onClose();
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Nuevo Projecto"
      description="Solo nombre y apellido son obligatorios"
      titleId="add-Project-title"
      footer={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-9 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="add-Project-form"
            className="flex-1 h-9 rounded-lg bg-accent text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity duration-200"
          >
            Guardar
          </button>
        </div>
      }
    >
      <form
        id="add-Project-form"
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {([
            { id: "Project-Nombre_proyecto", field: "Nombre_proyecto" as const, label: "Nombre del Proyecto", placeholder: "Cocina de María Pérez" },
            { id: "Project-direccion_proyecto", field: "direccion" as const, label: "Dirección del Proyecto", placeholder: "Av. Providencia 123" },
          ]).map(({ id, field, label, placeholder }) => (
            <div key={field} className="space-y-1.5">
              <label htmlFor={id} className="text-xs font-medium text-foreground">
                {label}
              </label>
              <input
                id={id}
                type="text"
                value={form[field]}
                onChange={(e) => updateField(field, e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all duration-200"
                placeholder={placeholder}
              />
            </div>
          ))}

          {/* ContactSelector reutilizable */}
          <ContactSelector
            value={form.cliente_proyecto}
            onChange={(name) => updateField("cliente_proyecto", name)}
          />
        </div>
      </form>
    </SidePanel>
  );
}