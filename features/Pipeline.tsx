"use client";

// ============================================================
// PÁGINA: PIPELINE (Tablero Kanban de negocios)
// Carga negocios reales desde Supabase y permite moverlos
// entre etapas con drag-and-drop (persistente).
// ============================================================

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Plus, MoreHorizontal, Clock, DollarSign, User, Building2 } from "lucide-react";
import { fetchProjects, updateProject } from "@/lib/api/projects";
import type { Project } from "@/data/deals";

const STAGE_ORDER: { id: string; name: string }[] = [
  { id: "Lead", name: "Lead" },
  { id: "Qualified", name: "Qualified" },
  { id: "Proposal", name: "Proposal" },
  { id: "Negotiation", name: "Negotiation" },
];

const PROBABILITY: Record<string, number> = {
  Lead: 20,
  Qualified: 40,
  Proposal: 60,
  Negotiation: 80,
};

function daysSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

// ---- Tarjeta de negocio individual ----
function DealCard({
  deal,
  index,
  onDragStart,
}: {
  deal: Project;
  index: number;
  onDragStart: (e: React.DragEvent, id: string) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      className="group bg-background border border-border rounded-lg p-4 cursor-grab active:cursor-grabbing hover:border-accent/50 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Empresa */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground truncate max-w-[120px]">{deal.company}</span>
        </div>
        <button className={cn(
          "w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
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
          <span className="text-foreground font-medium">{PROBABILITY[deal.stage] ?? 20}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${PROBABILITY[deal.stage] ?? 20}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ---- Página principal del Pipeline ----
export function Pipeline() {
  const [deals, setDeals] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchProjects()
      .then(setDeals)
      .catch((e) => {
        console.error(e);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const stages = STAGE_ORDER.map((s) => ({
    ...s,
    deals: deals.filter((d) => d.stage === s.name),
  }));

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

    // Actualizar UI optimista
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: targetStage } : d)));
    try {
      await updateProject(dealId, { stage: targetStage });
    } catch (err) {
      console.error(err);
      setDeals((prev) => prev.map((d) => (d.id === dealId ? deal : d)));
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage, stageIndex) => {
          const total = stage.deals.reduce((s, d) => s + (d.value ?? 0), 0);
          return (
            <div
              key={stage.name}
              onDragOver={(e) => {
                e.preventDefault();
                setOverId(stage.name);
              }}
              onDragLeave={() => setOverId((cur) => (cur === stage.name ? null : cur))}
              onDrop={(e) => handleDrop(e, stage.name)}
              className={cn(
                "bg-card border rounded-xl p-4 min-h-[500px] transition-colors duration-200",
                overId === stage.name ? "border-accent bg-accent/5" : "border-border"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{stage.name}</h3>
                  <span className="px-2 py-0.5 bg-secondary rounded-md text-xs font-medium text-muted-foreground">
                    {stage.deals.length}
                  </span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {total >= 1000 ? `$${(total / 1000).toFixed(0)}k` : "$0"}
                </span>
              </div>

              <div className="space-y-3">
                {stage.deals.map((deal, dealIndex) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    index={dealIndex}
                    onDragStart={handleDragStart}
                  />
                ))}
                {stage.deals.length === 0 && (
                  <div className="border border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
                    Suelta un negocio aquí
                  </div>
                )}
              </div>

              <button
                onClick={() => (window.location.href = "/?section=deals")}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-accent/50 hover:bg-secondary/50 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add deal
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}