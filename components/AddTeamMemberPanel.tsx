"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SidePanel } from "@/components/SidePanel";

export type TeamFormData = {
  name: string;
  role: string;
  email: string;
  phone: string;
  quota: string;
};

const emptyForm: TeamFormData = {
  name: "",
  role: "",
  email: "",
  phone: "",
  quota: "",
};

interface AddTeamMemberPanelProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: TeamFormData) => void;
  initialData?: Partial<TeamFormData>;
}

export function AddTeamMemberPanel({ open, onClose, onSave, initialData }: AddTeamMemberPanelProps) {
  const [form, setForm] = useState<TeamFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<"name", string>>>({});

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setErrors({});
    } else if (initialData) {
      setForm({ ...emptyForm, ...initialData } as TeamFormData);
    }
  }, [open, initialData]);

  const updateField = (field: keyof TeamFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "name") setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: "El nombre es obligatorio" });
      return;
    }
    onSave({
      name: form.name.trim(),
      role: form.role.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      quota: form.quota.trim(),
    });
    onClose();
  };

  const fields: {
    field: keyof TeamFormData;
    label: string;
    placeholder: string;
    type?: string;
  }[] = [
    { field: "name", label: "Nombre", placeholder: "Sarah Chen" },
    { field: "role", label: "Rol", placeholder: "Account Executive" },
    { field: "email", label: "Email", placeholder: "sarah@company.com", type: "email" },
    { field: "phone", label: "Teléfono", placeholder: "+56 9 1234 5678" },
    { field: "quota", label: "Quota (ingresos)", placeholder: "450000", type: "number" },
  ];

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={initialData ? "Editar miembro" : "Nuevo miembro"}
      description="Datos del miembro del equipo"
      titleId="add-team-title"
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
            form="add-team-form"
            className="flex-1 h-9 rounded-lg bg-accent text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity duration-200"
          >
            Guardar
          </button>
        </div>
      }
    >
      <form
        id="add-team-form"
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {fields.map((item) => (
            <div key={item.field} className="space-y-1.5">
              <label htmlFor={`team-${item.field}`} className="text-xs font-medium text-foreground">
                {item.label} {item.field === "name" && <span className="text-destructive">*</span>}
              </label>
              <input
                id={`team-${item.field}`}
                type={item.type ?? "text"}
                value={form[item.field]}
                onChange={(e) => updateField(item.field, e.target.value)}
                aria-invalid={item.field === "name" && !!errors.name}
                className={cn(
                  "w-full h-9 px-3 rounded-lg bg-secondary border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all duration-200",
                  item.field === "name" && errors.name ? "border-destructive" : "border-border"
                )}
                placeholder={item.placeholder}
                autoFocus={item.field === "name"}
              />
              {item.field === "name" && errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
          ))}
        </div>
      </form>
    </SidePanel>
  );
}