"use client";

import { useState, useEffect } from "react";

export type PipelineStage = { name: string; value: number; count: number };

export function PipelineChart({
  stages,
  totalValue,
}: {
  stages: PipelineStage[];
  totalValue: number;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const colors = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-accent"];

  return (
    <div className="bg-card border border-border rounded-xl p-5 h-[380px] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-foreground">Pipeline Stages</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Distribution by stage</p>
      </div>

      <div className="space-y-5">
        {stages.map((stage, index) => (
          <div key={stage.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{stage.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{stage.count}</span>
                <span className="text-sm font-semibold text-foreground">{stage.value}%</span>
              </div>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-1000 ease-out`}
                style={{
                  width: isLoaded ? `${stage.value}%` : "0%",
                  transitionDelay: `${index * 150}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total pipeline value */}
      <div className="mt-6 pt-5 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Pipeline Value</span>
          <span className="text-xl font-bold text-foreground">
            {totalValue >= 1_000_000
              ? `$${(totalValue / 1_000_000).toFixed(1)}M`
              : `$${(totalValue / 1000).toFixed(0)}k`}
          </span>
        </div>
      </div>
    </div>
  );
}
