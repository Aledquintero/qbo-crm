"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SidePanel } from "@/components/SidePanel";

export type ContactFormData = {
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  rut: string;
};

const emptyForm: ContactFormData = {
  nombre: "",
  apellido: "",
  telefono: "",
  direccion: "",
  ciudad: "",
  rut: "",
};

interface AddContactPanelProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: ContactFormData) => void;
  initialData?: Partial<ContactFormData>;
}

export function AddContactPanel({ open, onClose, onSave, initialData }: AddContactPanelProps) {
  const [form, setForm] = useState<ContactFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<"nombre" | "apellido", string>>>({});

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setErrors({});
    } else if (initialData) {
      setForm({ ...emptyForm, ...initialData } as ContactFormData);
    }
  }, [open, initialData]);

  const updateField = (field: keyof ContactFormData, value: string) => {
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
      telefono: form.telefono.trim(),
      direccion: form.direccion.trim(),
      ciudad: form.ciudad.trim(),
      rut: form.rut.trim(),
    });
    onClose();
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Nuevo contacto"
      description="Solo nombre y apellido son obligatorios"
      titleId="add-contact-title"
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
            form="add-contact-form"
            className="flex-1 h-9 rounded-lg bg-accent text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity duration-200"
          >
            Guardar
          </button>
        </div>
      }
    >
      <form
        id="add-contact-form"
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="contact-nombre" className="text-xs font-medium text-foreground">
                Nombre <span className="text-destructive">*</span>
              </label>
              <input
                id="contact-nombre"
                type="text"
                value={form.nombre}
                onChange={(e) => updateField("nombre", e.target.value)}
                aria-invalid={!!errors.nombre}
                className={cn(
                  "w-full h-9 px-3 rounded-lg bg-secondary border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all duration-200",
                  errors.nombre ? "border-destructive" : "border-border"
                )}
                placeholder="Juan"
                autoFocus
              />
              {errors.nombre && (
                <p className="text-xs text-destructive">{errors.nombre}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="contact-apellido" className="text-xs font-medium text-foreground">
                Apellido <span className="text-destructive">*</span>
              </label>
              <input
                id="contact-apellido"
                type="text"
                value={form.apellido}
                onChange={(e) => updateField("apellido", e.target.value)}
                aria-invalid={!!errors.apellido}
                className={cn(
                  "w-full h-9 px-3 rounded-lg bg-secondary border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all duration-200",
                  errors.apellido ? "border-destructive" : "border-border"
                )}
                placeholder="Pérez"
              />
              {errors.apellido && (
                <p className="text-xs text-destructive">{errors.apellido}</p>
              )}
            </div>
          </div>

          {([
            { id: "contact-telefono", field: "telefono" as const, label: "Teléfono", placeholder: "+56 9 1234 5678", type: "text" },
            { id: "contact-direccion", field: "direccion" as const, label: "Dirección", placeholder: "Av. Providencia 123", type: "text" },
            { 
              id: "contact-ciudad", 
              field: "ciudad" as const, 
              label: "Ciudad", 
              placeholder: "Selecciona una ciudad...",
              type: "select-search", 
              options: [
                { value: "La Serena", label: "La Serena" },
                { value: "Coquimbo", label: "Coquimbo" },
                { value: "Ovalle", label: "Ovalle" }, // <-- Coma corregida aquí
                { value: "Valle de Elqui", label: "Valle de Elqui" }
              ] 
            },
            { id: "contact-rut", field: "rut" as const, label: "RUT", placeholder: "12.345.678-9", type: "text" },
          ]).map((item) => ( // Extraemos el objeto completo como 'item' para acceder a sus propiedades opcionales
            <div key={item.field} className="space-y-1.5">
              <label htmlFor={item.id} className="text-xs font-medium text-foreground">
                {item.label}
              </label>

              {/* Condicional para renderizar el Buscador o el Input nativo */}
              {item.type === "select-search" ? (
                /* Aquí puedes integrar tu componente de búsqueda (ej: react-select) */
                <select
                  id={item.id}
                  value={form[item.field]}
                  onChange={(e) => updateField(item.field, e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all duration-200"
                >
                  <option value="">{item.placeholder}</option>
                  {item.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                /* Input tradicional para el resto de los campos */
                <input
                  id={item.id}
                  type="text"
                  value={form[item.field]}
                  onChange={(e) => updateField(item.field, e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all duration-200"
                  placeholder={item.placeholder}
                />
              )}
            </div>
          ))}
        </div>
      </form>
    </SidePanel>
  );
}
