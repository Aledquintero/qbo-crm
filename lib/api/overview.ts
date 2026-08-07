import { supabase } from "@/lib/supabase";

export type OverviewData = {
  totalRevenue: number;
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
  const [projectsRes, contactsRes] = await Promise.all([
    supabase.from("projects").select("id,company,value,stage,status,rep,close_date,created_at"),
    supabase.from("contacts").select("id", { count: "exact", head: true }),
  ]);

  if (projectsRes.error) throw projectsRes.error;
  if (contactsRes.error) throw contactsRes.error;

  const projects = projectsRes.data ?? [];

  const won = projects.filter((p) => p.status === "won");
  const totalRevenue = Math.round(won.reduce((s, p) => s + (p.value ?? 0), 0));
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

  const stageMap: Record<string, { value: number; count: number }> = {};
  projects.forEach((p) => {
    const stage = p.stage ?? "Lead";
    if (!stageMap[stage]) stageMap[stage] = { value: 0, count: 0 };
    stageMap[stage].count += 1;
    stageMap[stage].value += p.value ?? 0;
  });

  const order = ["Lead", "Qualified", "Proposal", "Negotiation"];
  const pipelineMatches = order
    .filter((s) => stageMap[s])
    .map((s, i) => {
      const total = projects.length || 1;
      return {
        name: s,
        value: Math.round((stageMap[s].count / total) * 100),
        count: stageMap[s].count,
      };
    });
  if (pipelineMatches.length === 0) {
    pipelineMatches.push({ name: "Lead", value: 0, count: 0 });
  }

  const totalPipelineValue = Math.round(projects.reduce((s, p) => s + (p.value ?? 0), 0));

  const sorted = [...projects].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  );
  const recentDeals = sorted.slice(0, 5).map((p) => ({
    id: p.id,
    company: p.company,
    value: p.value ?? 0,
    status: (p.status as "won" | "pending" | "lost") || "pending",
    rep: p.rep ?? "",
    date: p.created_at ? timeAgo(p.created_at) : "",
  }));

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
    conversionRate,
    activeDeals,
    newLeads,
    revenueByMonth,
    pipelineMatches,
    totalPipelineValue,
    recentDeals,
    topPerformers,
  };
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