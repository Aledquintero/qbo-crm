import { supabase } from "@/lib/supabase";
import { loadPipelineStages, stageMeta, type PipelineStage } from "@/lib/pipeline-stages";

export type PendingActivityKind = "visita" | "materiales" | "instalacion" | "cobro" | "seguimiento";

export type OverviewActivity = {
  id: string;
  title: string;
  detail?: string;
  priority: "alta" | "media" | "baja";
  kind: PendingActivityKind;
  projectId: string;
};

export type OverviewData = {
  totalRevenue: number;
  pendingBalance: number;
  visitasPendientes: number;
  instalacionesPendientes: number;
  proyectosConSaldo: number;
  conversionRate: number;
  activeDeals: number;
  newLeads: number;
  revenueByMonth: { month: string; revenue: number; target: number }[];
  pipelineMatches: { name: string; value: number; count: number }[];
  totalPipelineValue: number;
  recentDeals: {
    id: string;
    company: string;
    value: number;
    status: "won" | "pending" | "lost";
    rep: string;
    date: string;
  }[];
  pendingActivities: OverviewActivity[];
  topPerformers: {
    name: string;
    deals: number;
    revenue: number;
    change: number;
    rank: number;
  }[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function fetchOverviewData(): Promise<OverviewData> {
  // `stage_updated_at` / `fecha_visita` / `fecha_instalacion` pueden no existir
  // en la BD (SQL pendiente): se reintenta sin esas columnas en vez de romper.
  // Todo en paralelo: antes los proyectos bloqueaban al resto.
  const [projectsRes, contactsRes, pendingRes] = await Promise.all([
    fetchProjectRows(),
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase.from("payments").select("project_id,monto").eq("estado", "pendiente"),
  ]);

  if (contactsRes.error) throw contactsRes.error;
  // Si la tabla payments no existe o falla, no rompemos el overview
  const pendingRows = (pendingRes.error ? [] : (pendingRes.data ?? [])) as {
    project_id: string | null;
    monto: number | null;
  }[];

  const projects = projectsRes;

  const won = projects.filter((p) => p.status === "won");
  const totalRevenue = Math.round(won.reduce((s, p) => s + (p.value ?? 0), 0));
  const pendingBalance = Math.round(
    pendingRows.reduce((s, p) => s + (p.monto ?? 0), 0)
  );
  const pendingByProject: Record<string, number> = {};
  for (const row of pendingRows) {
    if (!row.project_id) continue;
    pendingByProject[row.project_id] = (pendingByProject[row.project_id] ?? 0) + (row.monto ?? 0);
  }

  const isOpen = (p: { status: string | null }) => p.status !== "won" && p.status !== "lost";
  const openProjects = [...projects].filter(isOpen);
  const visitasPendientes = openProjects.filter(
    (p) => !(p as { fecha_visita?: string | null }).fecha_visita
  ).length;
  const instalacionesPendientes = won.filter(
    (p) => !(p as { fecha_instalacion?: string | null }).fecha_instalacion
  ).length;
  const proyectosConSaldo = Object.keys(pendingByProject).length;
  const activeDeals = projects.length;
  const newLeads = contactsRes.count ?? 0;
  const conversionRate = activeDeals > 0 ? Math.round((won.length / activeDeals) * 1000) / 10 : 0;

  const revenueByMonth = MONTHS.map((month, i) => ({
    month,
    revenue: 0,
    target: 0,
  }));
  won.forEach((p) => {
    const d = p.close_date ? new Date(p.close_date) : p.created_at ? new Date(p.created_at) : null;
    if (!d) return;
    const idx = d.getMonth();
    revenueByMonth[idx].revenue += p.value ?? 0;
    revenueByMonth[idx].target += 0;
  });

  // Etapas = estados: se agrupa por el `stage` real de la BD y el
  // nombre visible sale del catálogo de Supabase (o del caché local).
  let knownStages: PipelineStage[] = [];
  try {
    const { data, error } = await supabase.from("stages").select("id,name,color");
    if (!error && data && data.length > 0) {
      knownStages = (data as { id: string; name: string; color: string }[]).map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color ?? "#94a3b8",
        kind: "open" as const,
      }));
    } else if (typeof window !== "undefined") {
      knownStages = loadPipelineStages();
    }
  } catch {
    knownStages = [];
  }
  const stageMap: Record<string, { value: number; count: number }> = {};
  projects.forEach((p) => {
    const stage = (p.stage ?? "lead") as string;
    if (!stageMap[stage]) stageMap[stage] = { value: 0, count: 0 };
    stageMap[stage].count += 1;
    stageMap[stage].value += p.value ?? 0;
  });

  const total = projects.length || 1;
  const pipelineMatches = Object.keys(stageMap).map((id) => ({
    name: stageMeta(knownStages, id).name,
    value: Math.round((stageMap[id].count / total) * 100),
    count: stageMap[id].count,
  }));
  if (pipelineMatches.length === 0) {
    pipelineMatches.push({ name: "Lead", value: 0, count: 0 });
  }

  const totalPipelineValue = Math.round(projects.reduce((s, p) => s + (p.value ?? 0), 0));

  // Proyectos abiertos = todo lo que no está ganado ni perdido.
  const openSorted = [...openProjects].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  );
  const recentDeals = openSorted.slice(0, 5).map((p) => ({
    id: p.id,
    company: p.company,
    value: p.value ?? 0,
    status: (p.status as "won" | "pending" | "lost") || "pending",
    rep: p.rep ?? "",
    date: p.created_at ? timeAgo(p.created_at) : "",
  }));

  // Actividades pendientes derivadas de los proyectos.
  // TODO: picks/reemplazar por reglas de prioridad definidas con el usuario.
  const pendingActivities: OverviewActivity[] = [];
  const pushActivity = (a: OverviewActivity) => {
    if (pendingActivities.length < 6) pendingActivities.push(a);
  };
  for (const p of openSorted) {
    const company = p.company ?? "Proyecto";
    if (!p.fecha_visita) {
      pushActivity({
        id: `${p.id}-visita`,
        title: "Agendar visita",
        detail: company,
        priority: "media",
        kind: "visita",
        projectId: p.id,
      });
    }
    const saldo = pendingByProject[p.id] ?? 0;
    if (saldo > 0) {
      pushActivity({
        id: `${p.id}-cobro`,
        title: "Cobrar saldo",
        detail: `${company} • $${saldo.toLocaleString()}`,
        priority: "alta",
        kind: "cobro",
        projectId: p.id,
      });
    }
    const ref = (p as { stage_updated_at?: string | null }).stage_updated_at ?? p.created_at;
    const ageDays = ref ? Math.floor((Date.now() - new Date(ref).getTime()) / 86400000) : 0;
    if (ageDays >= 14) {
      pushActivity({
        id: `${p.id}-seguimiento`,
        title: "Dar seguimiento",
        detail: `${company} • hace ${ageDays} d`,
        priority: "alta",
        kind: "seguimiento",
        projectId: p.id,
      });
    }
  }
  for (const p of won) {
    if (!p.fecha_instalacion) {
      pushActivity({
        id: `${p.id}-materiales`,
        title: "Comprar materiales",
        detail: p.company ?? "Proyecto",
        priority: "media",
        kind: "materiales",
        projectId: p.id,
      });
      pushActivity({
        id: `${p.id}-instalacion`,
        title: "Agendar instalación",
        detail: p.company ?? "Proyecto",
        priority: "media",
        kind: "instalacion",
        projectId: p.id,
      });
    }
  }

  const byRep: Record<string, { deals: number; revenue: number }> = {};
  won.forEach((p) => {
    const rep = p.rep ?? "Sin asignar";
    if (!byRep[rep]) byRep[rep] = { deals: 0, revenue: 0 };
    byRep[rep].deals += 1;
    byRep[rep].revenue += p.value ?? 0;
  });

  const topPerformers = Object.entries(byRep)
    .map(([name, v]) => ({ name, deals: v.deals, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p, i) => ({
      ...p,
      change: i === 0 ? 15 : Math.max(5, 15 - i * 3),
      rank: i + 1,
    }));

  return {
    totalRevenue,
    pendingBalance,
    visitasPendientes,
    instalacionesPendientes,
    proyectosConSaldo,
    conversionRate,
    activeDeals,
    newLeads,
    revenueByMonth,
    pipelineMatches,
    totalPipelineValue,
    recentDeals,
    pendingActivities,
    topPerformers,
  };
}

type ProjectRow = {
  id: string;
  company: string;
  value: number | null;
  stage: string | null;
  status: string | null;
  rep: string | null;
  close_date: string | null;
  created_at: string | null;
  fecha_visita?: string | null;
  fecha_instalacion?: string | null;
  stage_updated_at?: string | null;
};

const COLS_KEY = "qbo-overview-cols";

const COLUMN_ATTEMPTS = [
  "id,company,value,stage,status,rep,close_date,created_at,fecha_visita,fecha_instalacion,stage_updated_at",
  "id,company,value,stage,status,rep,close_date,created_at,fecha_visita,fecha_instalacion",
  "id,company,value,stage,status,rep,close_date,created_at",
];

function cachedColumnsFirst(): string[] {
  try {
    const cached = typeof window !== "undefined" ? window.localStorage.getItem(COLS_KEY) : null;
    if (cached && COLUMN_ATTEMPTS.includes(cached)) {
      return [cached, ...COLUMN_ATTEMPTS.filter((c) => c !== cached)];
    }
  } catch {
    // almacenamiento no disponible
  }
  return COLUMN_ATTEMPTS;
}

async function fetchProjectRows(): Promise<ProjectRow[]> {
  let lastError: unknown = null;
  for (const cols of cachedColumnsFirst()) {
    const { data, error } = await supabase.from("projects").select(cols);
    if (!error) {
      try {
        window.localStorage.setItem(COLS_KEY, cols);
      } catch {
        // almacenamiento no disponible
      }
      return (data ?? []) as unknown as ProjectRow[];
    }
    lastError = error;
  }
  throw lastError;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}