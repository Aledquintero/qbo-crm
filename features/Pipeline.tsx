"use client";

// ============================================================
// PÁGINA: PIPELINE (Tablero de visualización)
// Solo visualiza los proyectos agrupados por etapa.
// - Sin montos, sin buscador.
// - Los proyectos no se editan aquí (se gestionan en Proyectos);
//   clic en una tarjeta abre su detalle.
// - Etapas = estados (lib/pipeline-stages.ts): añadir, editar
//   (clic en el nombre), eliminar y reordenar (agarre ⋮⋮).
//   Viven en Supabase si se ejecutó supabase/pipeline-setup.sql,
//   si no en este navegador.
// - kind won/lost = etapa de cierre: al soltar ahí también
//   marca el resultado del proyecto.
// - Los días en etapa se ponen rojos tras STALE_DAYS días.
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Trash2, X, GripVertical, CheckCircle2, XCircle, Timer, CalendarClock, Wrench } from "lucide-react";
import {
  fetchProjects,
  updateProject,
  fetchStages,
  seedStages,
  createStage,
  updateStage,
  deleteStage as deleteStageRow,
} from "@/lib/api";
import { ProjectDetail } from "@/features/ProjectDetail";
import {
  loadPipelineStages,
  savePipelineStages,
  slugStageId,
  stageAge,
  STALE_DAYS,
  DEFAULT_PIPELINE_STAGES,
  type PipelineStage as Stage,
  type StageKind,
} from "@/lib/pipeline-stages";
import type { Project } from "@/data/deals";
import { canSeeBlock } from "@/lib/constructor/store";
import { getSession } from "@/lib/auth/store";
import type { Role } from "@/lib/auth/types";

const COLORS = ["#38bdf8", "#a78bfa", "#f59e0b", "#34d399", "#f87171", "#fb923c", "#22d3ee", "#e879f9"];

export function Pipeline({ viewRole }: { viewRole?: Role }) {
  const role = viewRole ?? getSession()?.rol ?? "Vendedor";
  const [deals, setDeals] = useState<Project[]>([]);
  // Etapas locales primero (pintado instantáneo); la nube las corrige si trae datos.
  const [stages, setStages] = useState<Stage[]>(() => {
    const local = loadPipelineStages();
    return local.length > 0 ? local : DEFAULT_PIPELINE_STAGES;
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragStage, setDragStage] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [alertFilter, setAlertFilter] = useState<"stale" | "no-visita" | "no-instalacion" | null>(null);
  const warnedCloud = useRef(false);

  const [addStageOpen, setAddStageOpen] = useState(false);
  const [editStage, setEditStage] = useState<Stage | null>(null);
  const [deleteStageId, setDeleteStageId] = useState<string | null>(null);
  const cloudRef = useRef(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const justDragged = useRef(false);

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    // Proyectos y etapas en paralelo (antes eran secuenciales).
    const [dealsRes, stagesRes] = await Promise.allSettled([fetchProjects(), fetchStages()]);
    if (dealsRes.status === "rejected") {
      console.error(dealsRes.reason);
      setLoadError(true);
      setLoading(false);
      return;
    }
    setDeals(dealsRes.value);
    // Etapas: Supabase primero (requiere supabase/pipeline-setup.sql),
    // navegador como respaldo si la BD aún no permite escribir.
    if (stagesRes.status === "fulfilled" && stagesRes.value.length > 0) {
      const mapped: Stage[] = stagesRes.value.map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color ?? "#38bdf8",
        kind: r.kind ?? "open",
      }));
      setStages(mapped);
      savePipelineStages(mapped);
      cloudRef.current = true;
    } else {
      // Solo se avisa si la nube falló de verdad (vacía = normal: se intenta sembrar).
      if (
        stagesRes.status === "rejected" &&
        !(stagesRes.reason instanceof Error && stagesRes.reason.message === "stages-cloud-off")
      ) {
        console.warn(
          "Pipeline: etapas en la nube no disponibles, usando locales.",
          stagesRes.reason instanceof Error ? stagesRes.reason.message : stagesRes.reason
        );
      }
      try {
        const seeded = await seedCloudStages();
        const mapped: Stage[] = seeded.map((r) => ({
          id: r.id,
          name: r.name,
          color: r.color ?? "#38bdf8",
          kind: r.kind ?? "open",
        }));
        setStages(mapped);
        savePipelineStages(mapped);
        cloudRef.current = true;
      } catch {
        // La nube no permite sembrar (falta supabase/pipeline-setup.sql):
        // respaldo local. Solo se avisa una vez por sesión (ver `warnedCloud`).
        if (!warnedCloud.current) {
          warnedCloud.current = true;
          console.warn(
            "Pipeline: no se pudo sembrar etapas en la nube (ejecuta supabase/pipeline-setup.sql). Usando locales."
          );
        }
        setStages(loadPipelineStages());
        cloudRef.current = false;
      }
    }
    setLoading(false);
  };

  // Siembra inicial en la nube en un solo INSERT (respeta las etapas
  // que ya tengas en este navegador). Lanza si la BD no permite escribir.
  const seedCloudStages = async () => {
    const local = loadPipelineStages();
    const source = local.length > 0 ? local : DEFAULT_PIPELINE_STAGES;
    return seedStages(
      source.map((s, i) => ({ id: s.id, name: s.name, color: s.color, position: i, kind: s.kind ?? "open" }))
    );
  };

  useEffect(() => {
    load();
  }, []);

  // Columnas: tus etapas + cualquier stage huérfano que traigan los proyectos
  const columns: Stage[] = useMemo(() => {
    const ids = new Set(stages.map((s) => s.id));
    const orphans = [...new Set(deals.map((d) => d.stage).filter(Boolean))].filter(
      (id) => !ids.has(id as string)
    ) as string[];
    return [
      ...stages,
      ...orphans.map((id) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        color: "#94a3b8",
        kind: "open" as StageKind,
      })),
    ];
  }, [stages, deals]);

  const orphanIds = useMemo(() => {
    const ids = new Set(stages.map((s) => s.id));
    return new Set(
      [...new Set(deals.map((d) => d.stage).filter(Boolean))].filter((id) => !ids.has(id as string)) as string[]
    );
  }, [stages, deals]);

  // Arrastrar entre etapas reclasifica el proyecto (se guarda en la BD)
  const handleDrop = async (targetStage: string) => {
    setOverStage(null);
    if (!dragId) return;
    const deal = deals.find((d) => d.id === dragId);
    setDragId(null);
    if (!deal || deal.stage === targetStage) return;
    const source = columns.find((s) => s.id === deal.stage);
    const target = columns.find((s) => s.id === targetStage);
    const patch: { stage: string; status?: "won" | "pending" | "lost" } = { stage: targetStage };
    if (target && target.kind !== "open") {
      // Etapa de cierre: también marca el resultado del proyecto
      patch.status = target.kind;
    } else if (
      source && source.kind !== "open" &&
      (deal.status === "won" || deal.status === "lost") &&
      deal.status === source.kind
    ) {
      // Sale de una etapa de cierre: se reabre como pendiente
      patch.status = "pending";
    }
    const prev = deal;
    setDeals((ds) => ds.map((d) => (d.id === deal.id ? { ...d, ...patch } : d)));
    try {
      await updateProject(deal.id, patch);
    } catch (e) {
      console.error(e);
      setDeals((ds) => ds.map((d) => (d.id === deal.id ? prev : d)));
    }
  };

  // Reordenar columnas: coloca la etapa arrastrada junto a la destino
  const reorderStage = (draggedId: string, targetId: string) => {
    setOverStage(null);
    setDragStage(null);
    if (draggedId === targetId) return;
    const dragged = stages.find((s) => s.id === draggedId);
    if (!dragged) return;
    const without = stages.filter((s) => s.id !== draggedId);
    const idx = without.findIndex((s) => s.id === targetId);
    const next = [...without];
    next.splice(idx === -1 ? next.length : idx, 0, dragged);
    setStages(next);
    savePipelineStages(next);
    if (cloudRef.current) void persistOrder(next);
  };

  const persistOrder = async (ordered: Stage[]) => {
    try {
      await Promise.all(ordered.map((s, i) => updateStage(s.id, { position: i })));
    } catch (e) {
      console.error(e);
      cloudRef.current = false;
    }
  };

  const addStage = async (name: string, color: string, kind: StageKind) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const item: Stage = { id: slugStageId(trimmed), name: trimmed, color, kind };
    if (cloudRef.current) {
      try {
        await createStage({ id: item.id, name: item.name, color: item.color, position: stages.length, kind });
      } catch (e) {
        console.error(e);
        cloudRef.current = false;
      }
    }
    const next = [...stages, item];
    setStages(next);
    savePipelineStages(next);
    setAddStageOpen(false);
  };

  const saveStageEdit = async (id: string, name: string, color: string, kind: StageKind) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (cloudRef.current && !orphanIds.has(id)) {
      try {
        await updateStage(id, { name: trimmed, color, kind });
      } catch (e) {
        console.error(e);
        cloudRef.current = false;
      }
    }
    const next = stages.map((s) => (s.id === id ? { ...s, name: trimmed, color, kind } : s));
    setStages(next);
    savePipelineStages(next);
    setEditStage(null);
  };

  const confirmDeleteStage = async (moveToId: string) => {
    if (!deleteStageId) return;
    const remaining = columns.filter((s) => s.id !== deleteStageId);
    if (remaining.length === 0) return;
    const target = moveToId || remaining[0].id;
    const affected = deals.filter((d) => d.stage === deleteStageId);
    setDeals((prev) => prev.map((d) => (d.stage === deleteStageId ? { ...d, stage: target } : d)));
    const next = stages.filter((s) => s.id !== deleteStageId);
    setStages(next);
    savePipelineStages(next);
    setDeleteStageId(null);
    if (cloudRef.current && !orphanIds.has(deleteStageId)) {
      try {
        await deleteStageRow(deleteStageId);
        await Promise.all(next.map((s, i) => updateStage(s.id, { position: i })));
      } catch (e) {
        console.error(e);
        cloudRef.current = false;
      }
    }
    try {
      await Promise.all(affected.map((d) => updateProject(d.id, { stage: target })));
    } catch (e) {
      console.error(e);
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-[280px] shrink-0 h-[480px] bg-secondary/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center space-y-3">
        <p className="text-muted-foreground">No se pudo cargar el pipeline.</p>
        <button
          onClick={load}
          className="px-4 h-9 rounded-lg bg-accent text-sm font-medium text-accent-foreground"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onSave={async (updated) => {
          try {
            const saved = await updateProject(updated.id, {
              company: updated.company,
              email: updated.email,
              value: updated.value,
              stage: updated.stage,
              status: updated.status,
              close_date: updated.closeDate,
              rep: updated.rep,
            });
            setDeals((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
            setSelectedProject(saved);
          } catch (e) {
            console.error(e);
          }
        }}
      />
    );
  }

  const stageToDelete = deleteStageId ? columns.find((s) => s.id === deleteStageId) : null;

  // Alertas operativas: lo que necesita acción hoy. Clic = filtrar el tablero.
  const isOpenDeal = (d: Project) => d.status !== "won" && d.status !== "lost";
  const staleDeals = deals.filter((d) => isOpenDeal(d) && stageAge(d) >= STALE_DAYS);
  const noVisitaDeals = deals.filter((d) => isOpenDeal(d) && !d.fecha_visita);
  const noInstalacionDeals = deals.filter((d) => d.status === "won" && !d.fecha_instalacion);
  const alertedIds = !alertFilter
    ? null
    : new Set(
        (alertFilter === "stale" ? staleDeals : alertFilter === "no-visita" ? noVisitaDeals : noInstalacionDeals).map(
          (d) => d.id
        )
      );

  const alerts = [
    {
      id: "stale" as const,
      icon: Timer,
      label: "estancados",
      count: staleDeals.length,
      hint: `Sin moverse ${STALE_DAYS}+ días`,
    },
    {
      id: "no-visita" as const,
      icon: CalendarClock,
      label: "sin visita",
      count: noVisitaDeals.length,
      hint: "Abiertos sin fecha de visita",
    },
    {
      id: "no-instalacion" as const,
      icon: Wrench,
      label: "sin instalación",
      count: noInstalacionDeals.length,
      hint: "Ganados sin fecha de instalación",
    },
  ];
  const allClear = alerts.every((a) => a.count === 0);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">
        Pipeline{" "}
        <span className="text-muted-foreground font-normal">({deals.length} proyectos)</span>
      </h2>

      {/* Alertas operativas: clic para filtrar el tablero */}
      {canSeeBlock("pipeline", role, "alertas") ? (
        <>
          {allClear ? (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="w-4 h-4" />
              Sin alertas — todo al día
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {alerts.map((a) => {
                if (a.count === 0) return null;
                const Icon = a.icon;
                const active = alertFilter === a.id;
                return (
                  <button
                    key={a.id}
                    title={a.hint}
                    onClick={() => setAlertFilter(active ? null : a.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                      active
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {a.count} {a.label}
                    {active && <X className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {/* Tablero con scroll horizontal: soporta N etapas */}

      {/* Tablero con scroll horizontal: soporta N etapas */}
      {canSeeBlock("pipeline", role, "tablero") && (
      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {columns.map((stage) => {
          const cards = deals.filter(
            (d) => d.stage === stage.id && (!alertedIds || alertedIds.has(d.id))
          );
          const isOrphan = orphanIds.has(stage.id);
          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(stage.id);
              }}
              onDragLeave={() => setOverStage((cur) => (cur === stage.id ? null : cur))}
              onDrop={() => {
                if (dragStage) reorderStage(dragStage, stage.id);
                else handleDrop(stage.id);
              }}
              className={cn(
                "w-[280px] shrink-0 bg-card border rounded-xl p-3 transition-colors",
                overStage === stage.id ? "border-accent bg-accent/5" : "border-border"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  {!isOrphan && (
                    <span
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        setDragStage(stage.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        setDragStage(null);
                        setOverStage(null);
                      }}
                      className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground shrink-0"
                      title="Arrastra para reordenar"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                  )}
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                  {!isOrphan ? (
                    <button
                      onClick={() => setEditStage(stage)}
                      title="Editar etapa"
                      className="text-sm font-semibold truncate hover:underline underline-offset-2"
                    >
                      {stage.name}
                    </button>
                  ) : (
                    <span className="text-sm font-semibold truncate">{stage.name}</span>
                  )}
                  {stage.kind === "won" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" aria-label="Cierre ganado" />
                  )}
                  {stage.kind === "lost" && (
                    <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" aria-label="Cierre perdido" />
                  )}
                  <span className="px-1.5 py-0.5 bg-secondary rounded text-xs text-muted-foreground">
                    {cards.length}
                  </span>
                </div>
                {!isOrphan && (
                  <button
                    onClick={() => setDeleteStageId(stage.id)}
                    disabled={columns.length <= 1}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
                    aria-label={`Eliminar ${stage.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-2 min-h-[60px]">
                {cards.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => {
                      justDragged.current = true;
                      setDragId(deal.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", deal.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setTimeout(() => {
                        justDragged.current = false;
                      }, 0);
                    }}
                    onClick={() => {
                      if (!justDragged.current) setSelectedProject(deal);
                    }}
                    className="bg-background border border-border rounded-lg p-3 cursor-pointer hover:border-accent/50 transition-colors"
                  >
                    <p className="text-sm font-medium truncate">{deal.company}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {[deal.contact, deal.rep].filter(Boolean).join(" · ") || "Sin asignar"}
                      <span
                        title="Días en esta etapa"
                        className={stageAge(deal) >= STALE_DAYS ? "text-destructive font-medium" : undefined}
                      >
                        {` · ${stageAge(deal)}d`}
                      </span>
                    </p>
                  </div>
                ))}
                {cards.length === 0 && (
                  <div className="border border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground">
                    Arrastra un proyecto aquí
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {/* Nueva etapa: al lado de la última columna, nunca lejos */}
        <button
          onClick={() => setAddStageOpen(true)}
          className="w-[200px] shrink-0 min-h-[120px] rounded-xl border border-dashed border-border flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-accent/50 hover:bg-secondary/50 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva etapa
        </button>
      </div>
      )}

      {addStageOpen && (
        <StageModal onClose={() => setAddStageOpen(false)} onSave={addStage} />
      )}

      {editStage && (
        <StageModal
          key={editStage.id}
          initial={{ name: editStage.name, color: editStage.color, kind: editStage.kind }}
          onClose={() => setEditStage(null)}
          onSave={(name, color, kind) => saveStageEdit(editStage.id, name, color, kind)}
        />
      )}

      {stageToDelete && (
        <DeleteStageModal
          stage={stageToDelete}
          alternatives={columns.filter((s) => s.id !== stageToDelete.id)}
          count={deals.filter((d) => d.stage === stageToDelete.id).length}
          onClose={() => setDeleteStageId(null)}
          onConfirm={confirmDeleteStage}
        />
      )}
    </div>
  );
}

// ---- Modal: nueva / editar etapa ----
function StageModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: { name: string; color: string; kind: StageKind };
  onClose: () => void;
  onSave: (name: string, color: string, kind: StageKind) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [kind, setKind] = useState<StageKind>(initial?.kind ?? "open");

  return (
    <Modal title={initial ? "Editar etapa" : "Nueva etapa"} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nombre *">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name, color, kind)}
            placeholder="Ej: Visita, Cotizado, Ganado..."
            className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-accent"
          />
        </Field>
        <Field label="Color">
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "w-7 h-7 rounded-full hover:scale-110 transition-transform",
                  color === c && "ring-2 ring-offset-2 ring-offset-card ring-accent"
                )}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </Field>
        <Field label="Al soltar un proyecto aquí">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as StageKind)}
            className="w-full h-9 px-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-accent"
          >
            <option value="open">Etapa abierta (sigue en flujo)</option>
            <option value="won">Cierre ganado</option>
            <option value="lost">Cierre perdido</option>
          </select>
        </Field>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={() => name.trim() && onSave(name, color, kind)}
            className="flex-1 h-9 rounded-lg bg-accent text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ---- Modal: eliminar etapa ----
function DeleteStageModal({
  stage,
  alternatives,
  count,
  onClose,
  onConfirm,
}: {
  stage: Stage;
  alternatives: Stage[];
  count: number;
  onClose: () => void;
  onConfirm: (moveToId: string) => void;
}) {
  const [target, setTarget] = useState(alternatives[0]?.id ?? "");
  return (
    <Modal title={`Eliminar "${stage.name}"`} onClose={onClose}>
      <p className="text-sm text-muted-foreground">
        {count > 0
          ? `Tiene ${count} proyecto(s). Elige a qué etapa moverlos:`
          : "Esta etapa está vacía. ¿Eliminarla?"}
      </p>
      {count > 0 && (
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-full h-9 px-2 rounded-lg bg-secondary border border-border text-sm mt-3"
        >
          {alternatives.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-2 pt-3">
        <button
          onClick={onClose}
          className="flex-1 h-9 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
        <button
          onClick={() => onConfirm(target)}
          className="flex-1 h-9 rounded-lg bg-destructive text-sm font-medium text-white hover:opacity-90"
        >
          Eliminar
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card border border-border rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
