"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { loadPipelineStages, stageMeta } from "@/lib/pipeline-stages";

type Status = "won" | "pending" | "lost";

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function ProjectStatusBar({
  status,
  stage,
  closeDate,
  createdAt,
  onStageChange,
}: {
  status: Status;
  stage: string;
  closeDate: string;
  createdAt?: string;
  onStageChange?: (stage: string) => void;
}) {
  const [stages] = useState(() => loadPipelineStages());
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const meta = stageMeta(stages, stage);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  const close = closeDate ? new Date(closeDate) : null;
  const validClose = close && !isNaN(close.getTime()) ? close : null;
  const start = createdAt ? new Date(createdAt) : null;
  const validStart = start && !isNaN(start.getTime()) ? start : null;

  const now = new Date();
  const dayMs = 1000 * 60 * 60 * 24;
  const remaining = validClose ? Math.ceil((validClose.getTime() - now.getTime()) / dayMs) : null;

  let pct: number | null = null;
  if (validClose && validStart && validClose.getTime() > validStart.getTime()) {
    pct = Math.min(1, Math.max(0, (now.getTime() - validStart.getTime()) / (validClose.getTime() - validStart.getTime())));
  } else if (remaining !== null) {
    pct = Math.min(1, Math.max(0, 1 - remaining / 60));
  }

  const color =
    status === "won" ? "bg-success"
    : status === "lost" ? "bg-destructive"
    : remaining === null ? "bg-muted-foreground/30"
    : remaining < 0 || remaining <= 7 ? "bg-destructive"
    : remaining <= 14 ? "bg-warning"
    : "bg-success";

  const text =
    status === "won" ? "Concluido"
    : status === "lost" ? "Perdido"
    : remaining === null ? "Sin plazo"
    : remaining < 0 ? `Venció hace ${Math.abs(remaining)} d`
    : remaining === 0 ? "Vence hoy"
    : `Faltan ${remaining} d`;

  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          title="Cambiar etapa"
          className="flex items-center gap-1.5 text-xs font-semibold text-foreground whitespace-nowrap px-1.5 py-1 -ml-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
          {meta.name}
        </button>
        {open && (
          <div className="absolute left-0 top-full z-30 mt-1 w-48 rounded-xl border border-border bg-card shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
            {stages.map((s) => (
              <button
                key={s.id}
                onClick={() => { setOpen(false); onStageChange?.(s.id); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-secondary transition-colors text-left",
                  s.id === stage && "bg-secondary/60"
                )}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-foreground">{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${Math.round((pct ?? 0) * 100)}%` }}
        />
      </div>

      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {text}
        {validClose && <span className="text-foreground font-medium"> · {fmtDate(closeDate)}</span>}
      </span>
    </div>
  );
}
