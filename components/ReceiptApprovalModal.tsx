"use client";

import { useState } from "react";

export type ExtractedReceipt = {
  monto: number | null;
  fecha: string;
  pagado_por: string;
  num_transferencia: string;
  text?: string;
};

interface ReceiptApprovalModalProps {
  receipt: ExtractedReceipt;
  onApprove: (edited: ExtractedReceipt) => void;
  onCancel: () => void;
}

export function ReceiptApprovalModal({ receipt, onApprove, onCancel }: ReceiptApprovalModalProps) {
  const [form, setForm] = useState<ExtractedReceipt>({
    monto: receipt.monto,
    fecha: receipt.fecha,
    pagado_por: receipt.pagado_por,
    num_transferencia: receipt.num_transferencia,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Aprobar Pago</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Revisa y corrige los datos extraídos del comprobante
          </p>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Monto</label>
            <input type="number" value={form.monto ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value ? Number(e.target.value) : null }))}
              className="w-full h-9 px-3 mt-1 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Fecha</label>
            <input type="text" value={form.fecha}
              onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
              className="w-full h-9 px-3 mt-1 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Pagado por</label>
            <input type="text" value={form.pagado_por}
              onChange={(e) => setForm((f) => ({ ...f, pagado_por: e.target.value }))}
              className="w-full h-9 px-3 mt-1 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">N° de transferencia</label>
            <input type="text" value={form.num_transferencia}
              onChange={(e) => setForm((f) => ({ ...f, num_transferencia: e.target.value }))}
              className="w-full h-9 px-3 mt-1 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
        </div>

        <div className="p-5 pt-0 flex items-center gap-2">
          <button onClick={() => onApprove(form)}
            className="flex-1 h-9 rounded-lg bg-accent text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity">
            Aprobar
          </button>
          <button onClick={onCancel}
            className="flex-1 h-9 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
