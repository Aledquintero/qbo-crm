"use client";

// ============================================================
// PÁGINA: TEAM (Equipo y rendimiento)
// Carga y persiste el equipo desde Supabase (CRUD real)
// ============================================================

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Trophy, Target, TrendingUp, TrendingDown, Mail, Phone, MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react";
import { AddTeamMemberPanel, type TeamFormData } from "@/components/AddTeamMemberPanel";
import {
  fetchTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  type TeamMember,
} from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { canSeeBlock } from "@/lib/constructor/store";
import { getSession } from "@/lib/auth/store";
import type { Role } from "@/lib/auth/types";

function TeamMemberCard({
  member,
  index,
  onMenu,
}: {
  member: TeamMember;
  index: number;
  onMenu: (e: React.MouseEvent<HTMLButtonElement>, member: TeamMember) => void;
}) {
  const quotaPercentage = member.quota > 0 ? (member.revenue / member.quota) * 100 : 0;
  const isAboveQuota = quotaPercentage >= 100;

  return (
    <div
      className="group bg-card border border-border rounded-xl p-5 hover:border-accent/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/80 to-chart-1 flex items-center justify-center text-sm font-bold text-accent-foreground">
              {member.avatar || member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            {member.rank > 0 && member.rank <= 3 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-warning flex items-center justify-center">
                <Trophy className="w-3 h-3 text-background" />
              </div>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{member.name}</h4>
            <p className="text-xs text-muted-foreground">{member.role || "—"}</p>
          </div>
        </div>
        <button
          onClick={(e) => onMenu(e, member)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Revenue</p>
          <p className="text-lg font-bold text-foreground">
            {member.revenue >= 1000 ? `$${(member.revenue / 1000).toFixed(0)}k` : "$0"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Deals Closed</p>
          <p className="text-lg font-bold text-foreground">{member.deals}</p>
        </div>
      </div>

      {/* Quota progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Quota Attainment</span>
          <span className={cn("font-medium", isAboveQuota ? "text-success" : "text-foreground")}>
            {quotaPercentage.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", isAboveQuota ? "bg-success" : "bg-accent")}
            style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Change indicator */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <a
            href={`mailto:${member.email}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Mail className="w-4 h-4" />
          </a>
          <a
            href={`tel:${member.phone}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>
        <div className={cn("flex items-center gap-1 text-sm font-medium", member.change >= 0 ? "text-success" : "text-destructive")}>
          {member.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {member.change >= 0 ? "+" : ""}{member.change}%
        </div>
      </div>
    </div>
  );
}

export function Team({ viewRole }: { viewRole?: Role }) {
  const role = viewRole ?? getSession()?.rol ?? "Vendedor";
  const [chartLoaded, setChartLoaded] = useState(false);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [menuTarget, setMenuTarget] = useState<{ member: TeamMember; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setChartLoaded(true), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchTeam()
      .then(setTeam)
      .catch((e) => {
        console.error(e);
        setError(true);
      })
      .finally(() => setLoading(false));
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

  const handleSave = async (data: TeamFormData) => {
    try {
      if (editMember) {
        const updated = await updateTeamMember(editMember.id, {
          name: data.name,
          role: data.role,
          email: data.email,
          phone: data.phone,
          quota: Number(data.quota) || 0,
        });
        setTeam((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      } else {
        const created = await createTeamMember({
          name: data.name,
          role: data.role,
          email: data.email,
          phone: data.phone,
          quota: Number(data.quota) || 0,
        });
        setTeam((prev) => [...prev, created]);
      }
      setEditMember(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTeamMember(id);
      setTeam((prev) => prev.filter((m) => m.id !== id));
      setMenuTarget(null);
    } catch (e) {
      console.error(e);
    }
  };

  const sortedByRank = [...team].sort((a, b) => {
    const ra = a.rank || Number.MAX_SAFE_INTEGER;
    const rb = b.rank || Number.MAX_SAFE_INTEGER;
    return ra - rb;
  });

  const chartData = team
    .map((m) => ({
      name: m.name.split(" ")[0],
      revenue: Math.round((m.revenue ?? 0) / 1000),
      quota: Math.round((m.quota ?? 0) / 1000),
    }))
    .slice(0, 8);

  const totalRevenue = team.reduce((acc, m) => acc + m.revenue, 0);
  const totalDeals = team.reduce((acc, m) => acc + m.deals, 0);
  const avgQuotaAttainment = team.length
    ? Math.round(team.reduce((acc, m) => acc + (m.quota > 0 ? (m.revenue / m.quota) * 100 : 0), 0) / team.length)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 bg-secondary/50 rounded-xl" />
          ))}
        </div>
        <div className="h-[250px] bg-secondary/50 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-muted-foreground">No se pudo cargar el equipo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header stats */}
      {canSeeBlock("team", role, "stats") && (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground">Team Revenue</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {totalRevenue >= 1000000 ? `$${(totalRevenue / 1000000).toFixed(2)}M` : `$${(totalRevenue / 1000).toFixed(0)}k`}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-chart-1/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-chart-1" />
            </div>
            <span className="text-sm text-muted-foreground">Total Deals</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalDeals}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Avg Quota Attainment</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgQuotaAttainment}%</p>
        </div>
      </div>
      )}

      {/* Performance chart */}
      {canSeeBlock("team", role, "grafico") && (
      <div className="bg-card border border-border rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-foreground">Revenue vs Quota</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Individual performance comparison</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-chart-1" />
              <span className="text-muted-foreground">Revenue (k)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              <span className="text-muted-foreground">Quota (k)</span>
            </div>
          </div>
        </div>
        <div className={`h-[250px] transition-opacity duration-700 ${chartLoaded ? 'opacity-100' : 'opacity-0'}`}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.005 260)" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.65 0 0)", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.65 0 0)", fontSize: 12 }}
                  tickFormatter={(value) => `$${value}k`}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(0.12 0.005 260)",
                    border: "1px solid oklch(0.22 0.005 260)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "oklch(0.95 0 0)", fontWeight: 600 }}
                  itemStyle={{ color: "oklch(0.65 0 0)" }}
                  formatter={(value: number) => [`$${value}k`, ""]}
                />
                <Bar dataKey="quota" fill="oklch(0.65 0 0 / 0.2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill="oklch(0.7 0.18 220)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center pt-20">Sin datos de equipo.</p>
          )}
        </div>
      </div>
      )}

      {/* Team members grid */}
      {canSeeBlock("team", role, "miembros") && (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Team Members</h3>
          <button
            onClick={() => {
              setEditMember(null);
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 text-sm font-medium bg-accent text-accent-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity duration-200"
          >
            <Plus className="w-4 h-4" />
            Agregar miembro
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedByRank.map((member, index) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              index={index}
              onMenu={(e, m) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuTarget({ member: m, x: rect.left - 130, y: rect.bottom + 6 });
              }}
            />
          ))}
          {sortedByRank.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-8 text-center col-span-full">
              <p className="text-muted-foreground">No hay miembros. Agrega el primero.</p>
            </div>
          )}
        </div>
      </div>
      )}

      <AddTeamMemberPanel
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleSave}
        initialData={
          editMember
            ? {
                name: editMember.name,
                role: editMember.role,
                email: editMember.email,
                phone: editMember.phone,
                quota: editMember.quota ? String(editMember.quota) : "",
              }
            : undefined
        }
      />

      {menuTarget &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[60] w-40 rounded-lg border border-border bg-card shadow-lg overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150"
            style={{ left: menuTarget.x, top: menuTarget.y }}
          >
            <button
              onClick={() => {
                setEditMember(menuTarget.member);
                setIsAddOpen(true);
                setMenuTarget(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
            <button
              onClick={() => handleDelete(menuTarget.member.id)}
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