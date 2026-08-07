"use client";

// ============================================================
// PÁGINA: PIPELINE (Tablero Kanban de negocios)
// Carga negocios y etapas reales desde Supabase.
// - Drag-and-drop para mover deals entre etapas (persistente).
// - Editar deal (menú ⋯) y agregar deal con monto personalizado.
// - Editar etapas: renombrar, cambiar color, agregar/eliminar.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Plus, MoreHorizontal, Clock, DollarSign, User, Building2, Settings2, Pencil, Trash2 } from "lucide-react";
import { fetchProjects, updateProject, createProject } from "@/lib/api/projects";
import { fetchStages, updateStage, createStage, deleteStage, type Stage } from "@/lib/api/stages";
import { supabase } from "@/lib/supabase";
import type { Project } from "@/data/deals";
import { AddDealPanel, type DealFormData } from "@/components/AddDealPanel";
import { StageEditorPanel } from "@/components/StageEditorPanel";

const DEFAULT_STAGE_COLOR = "#38bdf8";

function daysSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

// ---- Tarjeta de negocio individual ----
function DealCard({
  deal,
  index,
  color,
  onDragStart,
  onMenu,
}: {
  deal: Project;
  index: number;
  color: string;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onMenu: (e: React.MouseEvent<HTMLButtonElement>, deal: Project) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      className="group bg-background border border-border rounded-lg p-4 cursor-grab active:cursor-grabbing hover:border-accent/50 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 relative overflow-hidden"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Barra de color de la etapa */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: color }} />

      <div className="pl-2">
        {/* Empresa */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground truncate max-w-[120px]">{deal.company}</span>
          </div>
          <button
            onClick={(e) => onMenu(e, deal)}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Valor */}
        <div className="flex items-center gap-2 text-sm text-foreground font-semibold mb-3">
          <DollarSign className="w-3.5 h-3.5 text-accent" />
          {deal.value ? `$${deal.value.toLocaleString()}` : "$0"}
        </div>

        {/* Responsable y días en etapa */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {deal.rep || "Sin asignar"}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {daysSince(deal.fecha_visita ?? null)}d
          </div>
        </div>

        {/* Barra de probabilidad */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Probability</span>
            <span className="text-foreground font-medium">{deal.probability ?? 0}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${deal.probability ?? 0}%`, backgroundColor: color }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Página principal del Pipeline ----
export function Pipeline() {
  const [deals, setDeals] = useState<Project[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Project | null>(null);
  const [addStageId, setAddStageId] = useState<string | null>(null);
  const [isStageEditorOpen, setIsStageEditorOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<{ deal: Project; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const [projects, stageList] = await Promise.all([fetchProjects(), fetchStages()]);
      setDeals(projects);
      setStages(stageList);
      setError(false);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!menuTarget) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuTarget(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuTarget]);

  const stageColor = (stageId: string | null | undefined): string => {
    if (!stageId) return DEFAULT_STAGE_COLOR;
    const s = stages.find((st) => st.id === stageId);
    return s?.color ?? DEFAULT_STAGE_COLOR;
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setOverId(null);
    const dealId = e.dataTransfer.getData("text/plain") || dragId;
    setDragId(null);
    if (!dealId) return;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === targetStage) return;

    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: targetStage } : d)));
    try {
      await updateProject(dealId, { stage: targetStage });
    } catch (err) {
      console.error(err);
      setDeals((prev) => prev.map((d) => (d.id === dealId ? deal : d)));
    }
  };

  const handleDealSave = async (data: DealFormData) => {
    try {
      if (editDeal) {
        const updated = await updateProject(editDeal.id, {
          company: data.company,
          value: Number(data.value) || 0,
          rep: data.rep,
          email: data.email,
          probability: Math.min(100, Math.max(0, Number(data.probability) || 0)),
        });
        setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      } else {
        const created = await createProject({
          company: data.company,
          value: Number(data.value) || 0,
          rep: data.rep,
          email: data.email,
          probability: Math.min(100, Math.max(0, Number(data.probability) || 0)),
          stage: addStageId ?? undefined,
        });
        setDeals((prev) => [created, ...prev]);
      }
      setEditDeal(null);
      setAddStageId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStageUpdate = async (id: string, data: { name?: string; color?: string }) => {
    try {
      const updated = await updateStage(id, data);
      setStages((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleStageCreate = async (data: { name: string; color: string }) => {
    try {
      const id = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const created = await createStage({ id, name: data.name, color: data.color, position: stages.length });
      setStages((prev) => [...prev, created]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStageDelete = async (id: string) => {
    try {
      // Reasignar deals de la etapa a la primera etapa restante
      const remaining = stages.filter((s) => s.id !== id);
      if (remaining.length === 0) return;
      await Promise.all(
        deals.filter((d) => d.stage === id).map((d) => updateProject(d.id, { stage: remaining[0].id }))
      );
      await deleteStage(id);
      setStages(remaining);
      setDeals((prev) =>
        prev.map((d) => (d.stage === id ? { ...d, stage: remaining[0].id } : d))
      );
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[500px] bg-secondary/50 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-muted-foreground">No se pudo cargar el pipeline.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Barra superior */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">
          Pipeline <span className="text-muted-foreground font-normal">({deals.length} negocios)</span>
        </h2>
        <button
          onClick={() => setIsStageEditorOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-accent/50 hover:bg-secondary/50 transition-all duration-200"
        >
          <Settings2 className="w-4 h-4" />
          Configurar etapas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const total = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0);
          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOverId(stage.id);
              }}
              onDragLeave={() => setOverId((cur) => (cur === stage.id ? null : cur))}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={cn(
                "bg-card border rounded-xl p-4 min-h-[500px] transition-colors duration-200",
                overId === stage.id ? "border-accent bg-accent/5" : "border-border"
              )}
            >
              {/* Encabezado de etapa */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="text-sm font-semibold text-foreground">{stage.name}</h3>
                  <span className="px-2 py-0.5 bg-secondary rounded-md text-xs font-medium text-muted-foreground">
                    {stageDeals.length}
                  </span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {total >= 1000 ? `$${(total / 1000).toFixed(0)}k` : "$0"}
                </span>
              </div>

              <div className="space-y-3">
                {stageDeals.map((deal, dealIndex) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    index={dealIndex}
                    color={stage.color}
                    onDragStart={handleDragStart}
                    onMenu={(e, d) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setMenuTarget({ deal: d, x: rect.left - 130, y: rect.bottom + 6 });
                    }}
                  />
                ))}
                {stageDeals.length === 0 && (
                  <div className="border border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
                    Suelta un negocio aquí
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setEditDeal(null);
                  setAddStageId(stage.id);
                  setIsAddOpen(true);
                }}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-accent/50 hover:bg-secondary/50 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add deal
              </button>
            </div>
          );
        })}
      </div>

      {/* Panel de agregar/editar deal */}
      <AddDealPanel
        open={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditDeal(null);
          setAddStageId(null);
        }}
        onSave={handleDealSave}
        initialData={
          editDeal
            ? {
                company: editDeal.company,
                value: editDeal.value ? String(editDeal.value) : "",
                rep: editDeal.rep,
                email: editDeal.email,
                probability: editDeal.probability != null ? String(editDeal.probability) : "",
              }
            : undefined
        }
      />

      {/* Editor de etapas */}
      <StageEditorPanel
        open={isStageEditorOpen}
        onClose={() => setIsStageEditorOpen(false)}
        stages={stages}
        onUpdateStage={handleStageUpdate}
        onCreateStage={handleStageCreate}
        onDeleteStage={handleStageDelete}
      />

      {/* Menú contextual del deal */}
      {menuTarget &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[60] w-40 rounded-lg border border-border bg-card shadow-lg overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150"
            style={{ left: menuTarget.x, top: menuTarget.y }}
          >
            <button
              onClick={() => {
                setEditDeal(menuTarget.deal);
                setAddStageId(null);
                setIsAddOpen(true);
                setMenuTarget(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
            <button
              onClick={async () => {
                const d = menuTarget.deal;
                setMenuTarget(null);
                try {
                  await supabase.from("projects").delete().eq("id", d.id);
                  setDeals((prev) => prev.filter((p) => p.id !== d.id));
                } catch (e) {
                  console.error(e);
                }
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-secondary transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}