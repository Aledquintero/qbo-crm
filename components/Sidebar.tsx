"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { customLabel } from "@/lib/constructor/store";
import type { Section } from "@/app/page";
import {
  LayoutDashboard,
  GitBranch,
  Handshake,
  Contact,
  Users,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Building2,
  TrendingUp,
  Settings,
} from "lucide-react";

interface SidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  visibleSections?: Section[];
}

const allNavItems: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "pipeline", label: "Pipeline", icon: GitBranch },
  { id: "deals", label: "Proyectos", icon: Handshake },
  { id: "contacts", label: "Contactos", icon: Contact },
  { id: "customers", label: "Customers", icon: Building2 },
  { id: "team", label: "Team", icon: Users },
  { id: "forecasting", label: "Forecasting", icon: TrendingUp },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  activeSection,
  onSectionChange,
  collapsed,
  onCollapsedChange,
  visibleSections,
}: SidebarProps) {
  const navItems = visibleSections
    ? allNavItems.filter((i) => visibleSections.includes(i.id))
    : allNavItems;
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out flex flex-col",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Collapse flotante esquina superior derecha (estilo OpenCode) */}
      <button
        onClick={() => onCollapsedChange(!collapsed)}
        title={collapsed ? "Expandir" : "Colapsar"}
        aria-label={collapsed ? "Expandir" : "Colapsar"}
        className="absolute -right-3 top-5 z-50 w-6 h-6 flex items-center justify-center rounded-full bg-card border border-border shadow-sm text-muted-foreground hover:text-foreground hover:border-accent transition-all"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-white">
            <CircleDollarSign className="w-5 h-5 text-accent-foreground" />
          </div>
          <span
            className={cn(
              "font-semibold text-lg text-sidebar-foreground whitespace-nowrap transition-all duration-300",
              collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
            )}
          >
            QBO modular
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              {/* Active indicator */}
              <span
                className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-accent transition-all duration-300",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              />
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-transform duration-200",
                  isActive ? "text-accent" : "group-hover:scale-110"
                )}
              />
              <span
                className={cn(
                  "whitespace-nowrap transition-all duration-300",
                  collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                )}
              >
                {customLabel("section", item.id) ?? item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
