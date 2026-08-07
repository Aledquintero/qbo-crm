"use client";

// ============================================================
// PÁGINA: OVERVIEW (Resumen principal)
// Muestra las métricas, gráficas y actividad reciente
// ============================================================

import { MetricCard } from "@/components/MetricCard";
import { RevenueChart } from "@/components/RevenueChart";
import { PipelineChart } from "@/components/PipelineChart";
import { RecentDeals } from "@/components/RecentDeals";
import { TopPerformers } from "@/components/TopPerformers";
import { DollarSign, TrendingUp, Users, Target } from "lucide-react";

export function Overview() {
  return (
    <div className="space-y-6">
      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value="$2.4M"
          change="+12.5%"
          changeType="positive"
          icon={DollarSign}
          delay={0}
        />
        <MetricCard
          title="Conversion Rate"
          value="24.8%"
          change="+3.2%"
          changeType="positive"
          icon={TrendingUp}
          delay={1}
        />
        <MetricCard
          title="Active Deals"
          value="147"
          change="-5"
          changeType="negative"
          icon={Target}
          delay={2}
        />
        <MetricCard
          title="New Leads"
          value="892"
          change="+18.3%"
          changeType="positive"
          icon={Users}
          delay={3}
        />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <PipelineChart />
      </div>

      {/* Deals recientes y top vendedores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentDeals />
        <TopPerformers />
      </div>
    </div>
  );
}
