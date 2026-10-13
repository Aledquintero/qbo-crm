"use client";

// ============================================================
// PÁGINA: OVERVIEW (Resumen principal)
// Muestra las métricas, gráficas y actividad reciente
// ============================================================

import { useState, useEffect } from "react";
import { MetricCard } from "@/components/MetricCard";
import { RevenueSlideCard } from "@/components/RevenueSlideCard";
import { RevenueChart } from "@/components/RevenueChart";
import { PipelineChart } from "@/components/PipelineChart";
import { RecentDeals } from "@/components/RecentDeals";
import { TopPerformers } from "@/components/TopPerformers";
import { CalendarClock, Wrench, Wallet } from "lucide-react";
import { fetchOverviewData, type OverviewData } from "@/lib/api";
import { canSeeBlock } from "@/lib/constructor/store";
import { getSession } from "@/lib/auth/store";
import type { Role } from "@/lib/auth/types";

const formatCurrency = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}k`;

export function Overview({ viewRole }: { viewRole?: Role }) {
  const role = viewRole ?? getSession()?.rol ?? "Vendedor";
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchOverviewData()
      .then(setData)
      .catch((e) => {
        console.error("Overview:", e instanceof Error ? e.message : JSON.stringify(e));
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-secondary/50 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[380px] bg-secondary/50 rounded-xl" />
          <div className="h-[380px] bg-secondary/50 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <p className="text-muted-foreground">No se pudo cargar el resumen.</p>
      </div>
    );
  }

  const metrics = [
    {
      title: "Por cobrar",
      value: formatCurrency(data.pendingBalance),
      change:
        data.proyectosConSaldo > 0
          ? `en ${data.proyectosConSaldo} proyecto${data.proyectosConSaldo === 1 ? "" : "s"}`
          : "sin saldos",
      changeType: "neutral" as const,
      icon: Wallet,
    },
    {
      title: "Visitas pendientes",
      value: String(data.visitasPendientes),
      change: data.visitasPendientes > 0 ? "por agendar" : "todo agendado",
      changeType: "neutral" as const,
      icon: CalendarClock,
    },
    {
      title: "Instalaciones pendientes",
      value: String(data.instalacionesPendientes),
      change: data.instalacionesPendientes > 0 ? "ganados sin fecha" : "todo programado",
      changeType: "neutral" as const,
      icon: Wrench,
    },
  ];

  // Actividades derivadas de los proyectos en `fetchOverviewData`.
  // TODO: aplicar reglas de prioridad definitivas cuando se establezcan.
  const pendingActivities = data.pendingActivities;

  return (
    <div className="space-y-6">
      {/* Tarjetas de métricas principales */}
      {canSeeBlock("overview", role, "metricas") && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RevenueSlideCard
          revenueValue={formatCurrency(data.totalRevenue)}
          revenueChange={data.activeDeals > 0 ? `de ${data.activeDeals} negocios` : "sin datos"}
          pendingValue={formatCurrency(data.pendingBalance)}
          delay={0}
        />
        {metrics.map((m, i) => (
          <MetricCard
            key={m.title}
            title={m.title}
            value={m.value}
            change={m.change}
            changeType={m.changeType}
            icon={m.icon}
            delay={i + 1}
          />
        ))}
      </div>
      )}

      {/* Gráficas */}
      {canSeeBlock("overview", role, "graficas") && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={data.revenueByMonth} />
        </div>
        <PipelineChart
          stages={data.pipelineMatches}
          totalValue={data.totalPipelineValue}
        />
      </div>
      )}

      {/* Actividades pendientes y deals recientes (orden invertido) */}
      {canSeeBlock("overview", role, "actividad") && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPerformers activities={pendingActivities} />
        <RecentDeals deals={data.recentDeals} />
      </div>
      )}
    </div>
  );
}