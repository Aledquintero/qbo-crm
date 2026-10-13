"use client";

import { cn } from "@/lib/utils";
import { ArrowUpRight, Clock, CheckCircle2, XCircle } from "lucide-react";

export type RecentDeal = {
  id: string;
  company: string;
  value: number;
  status: "won" | "pending" | "lost";
  rep: string;
  date: string;
};

const statusConfig = {
  won: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/10",
    label: "Won",
  },
  pending: {
    icon: Clock,
    color: "text-warning",
    bg: "bg-warning/10",
    label: "Pending",
  },
  lost: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    label: "Lost",
  },
};

export function RecentDeals({ deals }: { deals: RecentDeal[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Recent Deals</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Proyectos abiertos</p>
        </div>
        <button className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 font-medium transition-colors group">
          View all
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>

      {deals.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Sin proyectos abiertos.</p>
      ) : (
        <div className="space-y-3">
          {deals.map((deal, index) => {
            const status = statusConfig[deal.status as keyof typeof statusConfig] ?? statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <div
                key={deal.id}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-left-2"
                style={{ animationDelay: `${(index + 3) * 100}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-sm font-semibold text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent transition-all duration-200">
                    {deal.company.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{deal.company}</p>
                    <p className="text-xs text-muted-foreground">{deal.rep} • {deal.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">
                    {deal.value >= 1000 ? `$${deal.value.toLocaleString()}` : "$0"}
                  </span>
                  <div className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium", status.bg, status.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
