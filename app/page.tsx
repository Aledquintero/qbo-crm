"use client";

import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Overview } from "@/features/Overview";
import { Pipeline } from "@/features/Pipeline";
import { Projects } from "@/features/Projects";
import { Contacts } from "@/features/Contacts";
import { Customers } from "@/features/Customers";
import { Team } from "@/features/Team";
import { Forecasting } from "@/features/Forecasting";
import { Reports } from "@/features/Reports";
import { Settings } from "@/features/Settings";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { PageEditor } from "@/components/PageEditor";
import { getSession, logout } from "@/lib/auth/store";
import { loadView, PERMISSIONS_EVENT, pullPermissions } from "@/lib/auth/permissions";
import { pullFields } from "@/lib/constructor/store";
import type { Session } from "@/lib/auth/types";
import type { Role } from "@/lib/auth/types";
import type { SectionId } from "@/lib/auth/permissions";

export type Section =
  | "overview"
  | "pipeline"
  | "deals"
  | "contacts"
  | "customers"
  | "team"
  | "forecasting"
  | "reports"
  | "settings";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contactId, setContactId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [viewVersion, setViewVersion] = useState(0);
  const [editing, setEditing] = useState(false);
  const [previewRole, setPreviewRole] = useState<Role | null>(null);

  useEffect(() => {
    setSession(getSession());
    setReady(true);
    // Permisos centrales: si el Admin los configuró en otro equipo, se aplican aquí.
    pullPermissions().then((applied) => {
      if (applied) setViewVersion((v) => v + 1);
    });
    pullFields().then((applied) => {
      if (applied) setViewVersion((v) => v + 1);
    });
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section") as Section | null;
    if (section) setActiveSection(section);
    const cid = params.get("contactId");
    if (cid) setContactId(cid);
  }, []);

  // Reacciona al instante cuando se cambian permisos en Settings > Usuarios
  // (incluye auto-ocultado del propio Admin).
  useEffect(() => {
    const bump = () => setViewVersion((v) => v + 1);
    window.addEventListener(PERMISSIONS_EVENT, bump);
    window.addEventListener("qbo:blocks-changed", bump);
    window.addEventListener("qbo:fields-changed", bump);
    window.addEventListener("qbo:labels-changed", bump);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "qbo_role_view") bump();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PERMISSIONS_EVENT, bump);
      window.removeEventListener("qbo:blocks-changed", bump);
      window.removeEventListener("qbo:fields-changed", bump);
      window.removeEventListener("qbo:labels-changed", bump);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const visibleSections = useMemo<Section[]>(() => {
    if (!session) return [];
    void viewVersion;
    const effRole = previewRole ?? session.rol;
    const v = loadView()[effRole];
    const all: Section[] = [
      "overview",
      "pipeline",
      "deals",
      "contacts",
      "customers",
      "team",
      "forecasting",
      "reports",
      "settings",
    ];
    const filtered = all.filter((s) => v?.[s as SectionId] ?? true);
    // Anti-bloqueo: Admin siempre conserva Settings para volver a Usuarios
    if (session.rol === "Admin" && !filtered.includes("settings")) {
      filtered.push("settings");
    }
    return filtered.length > 0 ? filtered : (["settings"] as Section[]);
  }, [session, viewVersion, previewRole]);

  // Rol efectivo: vista previa del editor o tu rol real
  const effRole: Role = previewRole ?? session?.rol ?? "Vendedor";

  // Si le quitan permiso a la sección activa, vuelve a la primera visible
  useEffect(() => {
    if (session && visibleSections.length > 0 && !visibleSections.includes(activeSection)) {
      setActiveSection(visibleSections[0]);
    }
  }, [session, visibleSections, activeSection]);

  const navigateToContact = (cid: string) => {
    setContactId(cid);
    setActiveSection("contacts");
  };

  if (!ready) return null;
  if (!session) return <AuthScreen onAuth={setSession} />;

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <Overview viewRole={effRole} />;
      case "pipeline":
        return <Pipeline viewRole={effRole} />;
      case "deals":
        return <Projects onContactClick={navigateToContact} viewRole={effRole} />;
      case "contacts":
        return <Contacts initialContactId={contactId} viewRole={effRole} />;
      case "customers":
        return <Customers viewRole={effRole} />;
      case "team":
        return <Team viewRole={effRole} />;
      case "forecasting":
        return <Forecasting viewRole={effRole} />;
      case "reports":
        return <Reports viewRole={effRole} />;
      case "settings":
        return <Settings />;
      default:
        return <Overview viewRole={effRole} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        visibleSections={visibleSections}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-out ${
          sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
        }`}
      >
        <Header
          activeSection={activeSection}
          sessionLabel={session.nombre}
          sessionUsername={session.username}
          sessionRole={session.rol}
          isAdmin={session.rol === "Admin"}
          previewRole={previewRole}
          onEdit={() => { setPreviewRole(session.rol); setEditing(true); }}
          onExitPreview={() => setPreviewRole(null)}
          onLogout={() => {
            logout();
            setSession(null);
          }}
        />
        <main className="flex-1 p-6 overflow-auto">
          <div
            key={activeSection}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {renderSection()}
          </div>
        </main>
      </div>
      {editing && activeSection !== "settings" && (
        <PageEditor
          section={activeSection as SectionId}
          viewRole={previewRole ?? session.rol}
          onViewRole={setPreviewRole}
          onClose={() => { setEditing(false); setPreviewRole(null); }}
        />
      )}
    </div>
  );
}
