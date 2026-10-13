"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { DollarSign, Wallet } from "lucide-react";

interface RevenueSlideCardProps {
  revenueValue: string;
  revenueChange: string;
  pendingValue: string;
  delay?: number;
}

// Tarjeta slide minimalista: pág.0 = Total Revenue, pág.1 = Saldos pendientes.
// El hover cambia temporalmente a la otra cara; los puntos solo indican la página.
export function RevenueSlideCard({
  revenueValue,
  revenueChange,
  pendingValue,
  delay = 0,
}: RevenueSlideCardProps) {
  const [page, setPage] = useState(0);

  return (
    <div
      onMouseEnter={() => setPage(1)}
      onMouseLeave={() => setPage(0)}
      className="group relative bg-card border border-border rounded-xl p-5 hover:border-accent/50 transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-4 cursor-default"
      style={{ animationDelay: `${delay * 100}ms`, animationFillMode: "both" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm text-muted-foreground font-medium">
            {page === 0 ? "Total Revenue" : "Saldos pendientes"}
          </span>
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-accent/10 transition-colors duration-300">
            {page === 0 ? (
              <DollarSign className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
            ) : (
              <Wallet className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors duration-300" />
            )}
          </div>
        </div>

        {/* Contenido deslizable */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: page === 0 ? "translateX(0)" : "translateX(-100%)" }}
          >
            <div className="w-full shrink-0">
              <div className="flex items-end gap-3">
                <span className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                  {revenueValue}
                </span>
                <span className="text-sm font-medium mb-1 text-success">{revenueChange}</span>
              </div>
            </div>
            <div className="w-full shrink-0">
              <div className="flex items-end gap-3">
                <span className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
                  {pendingValue}
                </span>
                <span className="text-sm font-medium mb-1 text-muted-foreground">por cobrar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Indicador minimalista de página */}
        <div className="flex items-center gap-1.5 mt-3">
          {[0, 1].map((i) => (
            <button
              key={i}
              type="button"
              aria-label={i === 0 ? "Ver revenue" : "Ver saldos pendientes"}
              onClick={() => setPage(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                page === i ? "w-4 bg-accent" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
