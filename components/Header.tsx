"use client";

import type { Section } from "@/app/page";
import { Sun, Moon, LogOut, User, PencilLine } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { customLabel } from "@/lib/constructor/store";
import type { Role } from "@/lib/auth/types";

interface HeaderProps {
  activeSection: Section;
  sessionLabel?: string;
  sessionUsername?: string;
  sessionRole?: string;
  isAdmin?: boolean;
  previewRole?: Role | null;
  onEdit?: () => void;
  onExitPreview?: () => void;
  onLogout?: () => void;
}

const sectionTitles: Record<Section, string> = {
  overview: "Overview",
  pipeline: "Pipeline",
  deals: "Proyectos",
  contacts: "Contacts",
  customers: "Customers",
  team: "Team Performance",
  forecasting: "Forecasting",
  reports: "Reports",
  settings: "Settings",
};

const titleFor = (s: Section) => customLabel("section", s) ?? sectionTitles[s];

export function Header({
  activeSection,
  sessionLabel,
  sessionUsername,
  sessionRole,
  isAdmin,
  previewRole,
  onEdit,
  onExitPreview,
  onLogout,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const initials = (sessionLabel || "JD")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-semibold text-foreground">
          {titleFor(activeSection)}
        </h1>
        {previewRole && (
          <button onClick={onExitPreview} title="Salir de la vista previa"
            className="h-7 px-2 rounded-lg bg-accent/15 border border-accent/40 text-xs text-accent-foreground">
            Viendo como {previewRole} · salir
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Editar página actual (solo Admin, no en Settings) */}
        {isAdmin && activeSection !== "settings" && (
          <button
            onClick={onEdit}
            aria-label="Personalizar esta página"
            title="Personalizar esta página"
            className="h-9 flex items-center gap-2 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 border border-dashed border-border hover:border-accent"
          >
            <PencilLine className="w-4 h-4" />
            <span className="hidden sm:inline">Personalizar</span>
          </button>
        )}
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
        >
          {mounted && theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* User avatar + menú perfil */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Abrir menú de perfil"
            aria-expanded={menuOpen}
            className="w-9 h-9 rounded-lg overflow-hidden bg-secondary ring-2 ring-transparent hover:ring-accent/50 transition-all duration-200"
          >
            <div className="w-full h-full bg-gradient-to-br from-accent/80 to-chart-1 flex items-center justify-center text-xs font-semibold text-accent-foreground">
              {initials}
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-11 w-60 rounded-xl border border-border bg-card shadow-lg p-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground truncate">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{sessionLabel ?? "Usuario"}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground truncate">
                  {sessionUsername ? `@${sessionUsername}` : null}
                  {sessionUsername && sessionRole ? " · " : null}
                  {sessionRole ?? ""}
                </div>
              </div>
              <div className="my-1 h-px bg-border" />
              {onLogout && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                  Salir
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
