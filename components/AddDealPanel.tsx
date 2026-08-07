"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SidePanel } from "@/components/SidePanel";

export type DealFormData = {
  company: string;
  value: string;
  rep: string;
  email: string;
  probability: string;
};

const emptyForm: DealFormData = {
  company: "",
  value: "",
  rep: "",
  email: "",
  probability: "",
};

interface AddDealPanelProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: DealFormData) => void;
  initialData?: Partial<DealFormData>;
}

export function AddDealPanel({ open, onClose, onSave, initialData }: AddDealPanelProps) {
  const [form, setForm] = useState<DealFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<"company", string>>>({});

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setErrors({});
    } else if (initialData) {
      setForm({ ...emptyForm, ...initialData } as DealFormData);
    }
  }, [open, initialData]);

  const updateField = (field: keyof DealFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "company") setErrors((prev) => ({ ...prev, company: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company.trim()) {
      setErrors({ company: "El nombre es obligatorio" });
      return;
    }
    onSave({
      company: form.company.trim(),
      value: form.value.trim(),
      rep: form.rep.trim(),
      email: form.email.trim(),
      probability: form.probability.trim(),
    });
    onClose();
  };

  const fields: {
    field: keyof DealFormData;
    label: string;
    placeholder: string;
    type?: string;
    hint?: string;
  }[] = [
    { field: "company", label: "Empresa / Proyecto", placeholder: "Acme Corporation" },
    { field: "value", label: "Monto", placeholder: "250000", type: "number", hint: "Cantidad en tu moneda, sin símbolos" },
    { field: "rep", label: "Responsable", placeholder: "Sarah Chen" },
    { field: "email", label: "Email", placeholder: "cliente@empresa.com", type: "email" },
    { field: "probability", label: "Probabilidad (%)", placeholder: "40", type: "number", hint: "0 a 100" },
  ];

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title={initialData ? "Editar deal" : "Nuevo deal"}
      description="Completa los campos del negocio"
      titleId="add-deal-title"
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
            form="add-deal-form"
            className="flex-1 h-9 rounded-lg bg-accent text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity duration-200"
          >
            Guardar
          </button>
        </div>
      }
    >
      <form
        id="add-deal-form"
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {fields.map((item) => (
            <div key={item.field} className="space-y-1.5">
              <label htmlFor={`deal-${item.field}`} className="text-xs font-medium text-foreground">
                {item.label} {item.field === "company" && <span className="text-destructive">*</span>}
              </label>
              <input
                id={`deal-${item.field}`}
                type={item.type ?? "text"}
                value={form[item.field]}
                onChange={(e) => updateField(item.field, e.target.value)}
                aria-invalid={item.field === "company" && !!errors.company}
                className={cn(
                  "w-full h-9 px-3 rounded-lg bg-secondary border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all duration-200",
                  item.field === "company" && errors.company ? "border-destructive" : "border-border"
                )}
                placeholder={item.placeholder}
                autoFocus={item.field === "company"}
              />
              {item.hint && <p className="text-xs text-muted-foreground">{item.hint}</p>}
              {item.field === "company" && errors.company && (
                <p className="text-xs text-destructive">{errors.company}</p>
              )}
            </div>
          ))}
        </div>
      </form>
    </SidePanel>
  );
}