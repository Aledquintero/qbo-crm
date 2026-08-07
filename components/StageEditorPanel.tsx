"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SidePanel } from "@/components/SidePanel";
import { Plus, Trash2, Palette } from "lucide-react";
import type { Stage } from "@/lib/api/stages";

const PRESET_COLORS = [
  "#38bdf8", "#a78bfa", "#f59e0b", "#34d399", "#f87171",
  "#fb923c", "#22d3ee", "#e879f9", "#a3e635", "#facc15",
];

interface StageEditorPanelProps {
  open: boolean;
  onClose: () => void;
  stages: Stage[];
  onUpdateStage: (id: string, data: { name?: string; color?: string }) => Promise<void>;
  onCreateStage: (data: { name: string; color: string }) => Promise<void>;
  onDeleteStage: (id: string) => Promise<void>;
}

export function StageEditorPanel({
  open,
  onClose,
  stages,
  onUpdateStage,
  onCreateStage,
  onDeleteStage,
}: StageEditorPanelProps) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setNewName("");
      setNewColor(PRESET_COLORS[0]);
    }
  }, [open]);

  const handleUpdate = async (stage: Stage) => {
    if (!stage.name.trim()) return;
    setSavingId(stage.id);
    try {
      await onUpdateStage(stage.id, { name: stage.name, color: stage.color });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="Configurar etapas"
      description="Renombra etapas y cambia su color"
      titleId="stage-editor-title"
      className="max-w-[440px]"
    >
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {/* Lista de etapas */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Etapas ({stages.length})
          </h4>
          {stages.map((stage) => (
            <div key={stage.id} className="border border-border rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: stage.color }}
                />
                <input
                  type="text"
                  value={stage.name}
                  onChange={(e) =>
                    onUpdateStage(stage.id, { name: e.target.value, color: stage.color })
                  }
                  className="flex-1 h-8 px-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all duration-200"
                  aria-label={`Nombre de la etapa ${stage.name}`}
                />
                <button
                  onClick={() => onDeleteStage(stage.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label={`Eliminar etapa ${stage.name}`}
                  disabled={stages.length <= 1}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Selector de color */}
              <div className="flex items-center gap-2 pl-5">
                <Palette className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => onUpdateStage(stage.id, { name: stage.name, color: c })}
                      className={cn(
                        "w-5 h-5 rounded-full transition-transform hover:scale-110",
                        stage.color === c && "ring-2 ring-offset-2 ring-offset-card ring-accent"
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Agregar etapa */}
        <div className="border-t border-border pt-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Agregar etapa
          </h4>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre de la nueva etapa"
            className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all duration-200"
          />
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-1.5 flex-1">
              {PRESET_COLORS.slice(0, 6).map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={cn(
                    "w-5 h-5 rounded-full transition-transform hover:scale-110",
                    newColor === c && "ring-2 ring-offset-2 ring-offset-card ring-accent"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <button
              onClick={() => {
                if (!newName.trim()) return;
                onCreateStage({ name: newName.trim(), color: newColor });
                setNewName("");
              }}
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-accent text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity duration-200"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>
      </div>
    </SidePanel>
  );
}