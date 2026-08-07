"use client";

// ============================================================
// PÁGINA: PIPELINE (Tablero Kanban de negocios)
// Para cambiar los negocios y etapas, edita: data/pipeline.ts
// ============================================================

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, MoreHorizontal, Clock, DollarSign, User, Building2 } from "lucide-react";
import { pipelineStages, type PipelineDeal } from "@/data/pipeline";

// ---- Tarjeta de negocio individual ----
function DealCard({ deal, index }: { deal: PipelineDeal; index: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
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
        ${deal.value.toLocaleString()}
      </div>

      {/* Responsable y días en etapa */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {deal.rep}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {deal.daysInStage}d
        </div>
      </div>

      {/* Barra de probabilidad */}
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Probability</span>
          <span className="text-foreground font-medium">{deal.probability}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${deal.probability}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ---- Página principal del Pipeline ----
export function Pipeline() {
  const [stages] = useState(pipelineStages);

  return (
    <div>

      {/* Tablero kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage, stageIndex) => (
          <div
            key={stage.id}
            className="bg-card border border-border rounded-xl p-4 min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${stageIndex * 100}ms`, animationFillMode: "both" }}
          >
            {/* Encabezado de etapa */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{stage.name}</h3>
                <span className="px-2 py-0.5 bg-secondary rounded-md text-xs font-medium text-muted-foreground">
                  {stage.deals.length}
                </span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                ${(stage.total / 1000).toFixed(0)}k
              </span>
            </div>

            {/* Deals de la etapa */}
            <div className="space-y-3">
              {stage.deals.map((deal, dealIndex) => (
                <DealCard key={deal.id} deal={deal} index={dealIndex} />
              ))}
            </div>

            {/* Botón agregar deal */}
            <button className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-accent/50 hover:bg-secondary/50 transition-all duration-200">
              <Plus className="w-4 h-4" />
              Add deal
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
