"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { loadCustomFields, type CustomField } from "@/lib/constructor/store";
import { fetchCustomValues, saveCustomValue, type CustomEntity } from "@/lib/custom-values";

function FieldInput({ f, value, onChange }: { f: CustomField; value: string; onChange: (v: string) => void }) {
  if (f.type === "lista") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-2 rounded-md bg-secondary border border-border text-sm">
        <option value="">—</option>
        {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (f.type === "si_no") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-2 rounded-md bg-secondary border border-border text-sm">
        <option value="">—</option>
        <option value="sí">Sí</option>
        <option value="no">No</option>
      </select>
    );
  }
  return (
    <input type={f.type === "numero" ? "number" : f.type === "fecha" ? "date" : "text"}
      value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full h-8 px-2 rounded-md bg-secondary border border-border text-sm" />
  );
}

export function CustomFieldsCard({ entity, entityId, section }: {
  entity: CustomEntity; entityId: string; section: "deals" | "contacts";
}) {
  const [defs, setDefs] = useState<CustomField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setDefs(loadCustomFields()[section]);
    fetchCustomValues(entity, entityId).then(setValues).catch(() => {});
  }, [entity, entityId, section]);

  if (defs.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-foreground">Campos personalizados</h3>
      <div className="mt-3 space-y-3">
        {defs.map((f) => (
          <div key={f.id}>
            <p className="text-xs text-muted-foreground mb-1">{f.label}</p>
            <FieldInput f={f} value={values[f.id] ?? ""}
              onChange={async (v) => {
                setValues((prev) => ({ ...prev, [f.id]: v }));
                try {
                  await saveCustomValue(entity, entityId, f.id, v);
                } catch {
                  toast.error("No se pudo guardar el campo");
                }
              }} />
          </div>
        ))}
      </div>
    </div>
  );
}
