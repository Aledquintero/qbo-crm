"use client";

// ============================================================
// PÁGINA: OVERVIEW (Resumen principal)
// Muestra las métricas, gráficas y actividad reciente
// ============================================================

import { useState, useEffect } from "react";
import { MetricCard } from "@/components/MetricCard";
import { RevenueChart } from "@/components/RevenueChart";
import { PipelineChart } from "@/components/PipelineChart";
import { RecentDeals } from "@/components/RecentDeals";
import { TopPerformers } from "@/components/TopPerformers";
import { DollarSign, TrendingUp, Users, Target } from "lucide-react";
import { fetchOverviewData, type OverviewData } from "@/lib/api/overview";

const formatCurrency = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}k`;

export function Overview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchOverviewData()
      .then(setData)
      .catch((e) => {
        console.error(e);
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
      title: "Total Revenue",
      value: formatCurrency(data.totalRevenue),
      change: data.activeDeals > 0 ? `de ${data.activeDeals} negocios` : "sin datos",
      changeType: data.totalRevenue > 0 ? ("positive" as const) : ("neutral" as const),
      icon: DollarSign,
    },
    {
      title: "Conversion Rate",
      value: `${data.conversionRate}%`,
      change: "sobre total de negocios",
      changeType: data.conversionRate > 0 ? ("positive" as const) : ("neutral" as const),
      icon: TrendingUp,
    },
    {
      title: "Active Deals",
      value: String(data.activeDeals),
      change: data.activeDeals > 0 ? "en pipeline" : "sin datos",
      changeType: "neutral" as const,
      icon: Target,
    },
    {
      title: "New Leads",
      value: String(data.newLeads),
      change: data.newLeads > 0 ? "contactos registrados" : "sin datos",
      changeType: "neutral" as const,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <MetricCard
            key={m.title}
            title={m.title}
            value={m.value}
            change={m.change}
            changeType={m.changeType}
            icon={m.icon}
            delay={i}
          />
        ))}
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={data.revenueByMonth} />
        </div>
        <PipelineChart
          stages={data.pipelineMatches}
          totalValue={data.totalPipelineValue}
        />
      </div>

      {/* Deals recientes y top vendedores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentDeals deals={data.recentDeals} />
        <TopPerformers performers={data.topPerformers} />
      </div>
    </div>
  );
}