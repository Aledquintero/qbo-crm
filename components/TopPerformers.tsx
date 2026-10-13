"use client";

import { cn } from "@/lib/utils";
import {
  AlertCircle, Clock, MinusCircle, ListTodo,
  CalendarClock, Package, Wrench, Wallet, PhoneCall,
} from "lucide-react";

export type Performer = {
  name: string;
  deals: number;
  revenue: number;
  change: number;
  rank: number;
};

export type PendingActivity = {
  id: string;
  title: string;
  detail?: string;
  priority: "alta" | "media" | "baja";
  kind?: "visita" | "materiales" | "instalacion" | "cobro" | "seguimiento";
  projectId?: string;
};

const priorityConfig = {
  alta: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Alta" },
  media: { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "Media" },
  baja: { icon: MinusCircle, color: "text-muted-foreground", bg: "bg-secondary", label: "Baja" },
} as const;

const kindIcon = {
  visita: CalendarClock,
  materiales: Package,
  instalacion: Wrench,
  cobro: Wallet,
  seguimiento: PhoneCall,
} as const;

const priorityRank: Record<PendingActivity["priority"], number> = { alta: 0, media: 1, baja: 2 };

// TODO: reglas de prioridad pendientes de definir con el usuario.
// Por ahora solo ordena por prioridad declarada (alta > media > baja).
export function sortByPriority<T extends { priority: PendingActivity["priority"] }>(items: T[]): T[] {
  return [...items].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
}

interface TopPerformersProps {
  performers?: Performer[];
  activities?: PendingActivity[];
}

// Tablero de actividades pendientes según prioridad.
// Mantiene el nombre/props legacy para no romper imports; `performers` queda sin uso.
export function TopPerformers({ activities = [] }: TopPerformersProps) {
  const ordered = sortByPriority(activities);

  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Actividades pendientes</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Por prioridad</p>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <ListTodo className="w-5 h-5" />
        </div>
      </div>

      {ordered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Sin actividades pendientes. Las reglas de prioridad se definirán luego.
        </p>
      ) : (
        <div className="space-y-3">
          {ordered.map((a, index) => {
            const cfg = priorityConfig[a.priority];
            const BadgeIcon = cfg.icon;
            const KindIcon = (a.kind && kindIcon[a.kind]) ?? ListTodo;
            return (
              <div
                key={a.id}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-all duration-200 cursor-pointer animate-in fade-in slide-in-from-right-2"
                style={{ animationDelay: `${(index + 4) * 100}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                    <KindIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                    {a.detail && (
                      <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
                    )}
                  </div>
                </div>
                <div className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium shrink-0", cfg.bg, cfg.color)}>
                  <BadgeIcon className="w-3 h-3" />
                  {cfg.label}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
