"use client";

import { useState } from "react";
import { X } from "lucide-react";

export type ExtractedQuote = {
  filename: string;
  numero: string;
  fecha: string;
  neto: number | null;
  iva: number | null;
  total: number | null;
};

export function QuoteApprovalModal({
  quote,
  onApprove,
  onCancel,
}: {
  quote: ExtractedQuote;
  onApprove: (edited: ExtractedQuote) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(quote);

  const fmt = (n: number | null) => (n ?? "").toString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Resumen de Cotización</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4 truncate">{quote.filename}</p>

        <div className="space-y-3">
          <Field label="Número / Folio" value={form.numero} onChange={(v) => setForm((f) => ({ ...f, numero: v }))} />
          <Field label="Fecha" value={form.fecha} onChange={(v) => setForm((f) => ({ ...f, fecha: v }))} />
          <FieldNum label="Neto" value={form.neto} onChange={(v) => setForm((f) => ({ ...f, neto: v }))} />
          <FieldNum label="IVA" value={form.iva} onChange={(v) => setForm((f) => ({ ...f, iva: v }))} />
          <FieldNum label="Total" value={form.total} onChange={(v) => setForm((f) => ({ ...f, total: v }))} />
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={() => onApprove(form)}
            className="flex-1 px-3 py-2 rounded-lg bg-accent text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity">
            Aprobar y Subir
          </button>
          <button onClick={onCancel}
            className="px-3 py-2 rounded-lg bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-muted-foreground w-24 shrink-0">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-8 px-2 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
    </div>
  );
}

function FieldNum({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-muted-foreground w-24 shrink-0">{label}</label>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        type="number"
        className="flex-1 h-8 px-2 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
    </div>
  );
}
