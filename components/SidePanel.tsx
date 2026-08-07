"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  titleId?: string;
  className?: string;
}

export function SidePanel({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  titleId = "side-panel-title",
  className,
}: SidePanelProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/15"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed right-4 top-20 z-50 flex w-full max-w-[380px] max-h-[calc(100vh-6rem)] flex-col rounded-xl border border-border bg-card shadow-xl animate-in slide-in-from-right fade-in duration-300",
          className
        )}
        role="dialog"
        aria-labelledby={titleId}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div>
            <h2 id={titleId} className="text-sm font-semibold text-foreground">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-200"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-border px-5 py-4">{footer}</div>
        )}
      </aside>
    </>
  );
}
