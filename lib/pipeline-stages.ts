// ============================================================
// Fuente única de ETAPAS = ESTADOS del proyecto.
// La usan Pipeline, ProjectDetail y Overview: no pueden existir
// estados fuera de esta lista.
// - El estado de cada proyecto se guarda en la BD en la columna
//   `projects.stage` (el id de la etapa).
// - El catálogo vive en Supabase (`stages`, ver
//   supabase/pipeline-setup.sql) y se cachea en este navegador.
// - kind: "open" (flujo) | "won"/"lost" (etapas de cierre: al
//   soltar un proyecto ahí también marcan su resultado).
// ============================================================

export type StageKind = "open" | "won" | "lost";

export type PipelineStage = {
  id: string;
  name: string;
  color: string;
  kind: StageKind;
};

const STORAGE_KEY = "qbo-pipeline-stages";

/** Días en etapa a partir de los cuales se marca estancamiento. */
export const STALE_DAYS = 14;

export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { id: "lead", name: "Lead", color: "#38bdf8", kind: "open" },
  { id: "qualified", name: "Qualified", color: "#a78bfa", kind: "open" },
  { id: "proposal", name: "Proposal", color: "#f59e0b", kind: "open" },
  { id: "negotiation", name: "Negotiation", color: "#34d399", kind: "open" },
];

export function normalizeStage(s: { id: string; name: string; color?: string | null; kind?: string | null }): PipelineStage {
  return {
    id: s.id,
    name: s.name,
    color: s.color ?? "#94a3b8",
    kind: s.kind === "won" || s.kind === "lost" ? s.kind : "open",
  };
}

export function loadPipelineStages(): PipelineStage[] {
  if (typeof window === "undefined") return DEFAULT_PIPELINE_STAGES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { id: string; name: string; color?: string; kind?: string }[];
      if (Array.isArray(parsed) && parsed.every((s) => s?.id && s?.name)) {
        return parsed.map(normalizeStage);
      }
    }
  } catch {
    // si falla, se usan las por defecto
  }
  return DEFAULT_PIPELINE_STAGES;
}

export function savePipelineStages(stages: PipelineStage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stages));
  } catch {
    // almacenamiento no disponible, se sigue en memoria
  }
}

/** Nombre y color de una etapa; si el id no existe, se muestra tal cual en gris. */
export function stageMeta(stages: PipelineStage[], id: string | null | undefined): { name: string; color: string } {
  const found = id ? stages.find((s) => s.id === id) : undefined;
  if (found) return { name: found.name, color: found.color };
  const label = id ? id.charAt(0).toUpperCase() + id.slice(1) : "Sin etapa";
  return { name: label, color: "#94a3b8" };
}

/** Días que un proyecto lleva en su etapa actual. */
export function stageAge(p: { stage_updated_at?: string | null; created_at?: string }): number {
  const iso = p.stage_updated_at ?? p.created_at ?? null;
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

export function slugStageId(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30) || "etapa";
  return `${slug}-${Date.now().toString(36)}`;
}
