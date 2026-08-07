"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section") as Section | null;
    if (section) setActiveSection(section);
    const cid = params.get("contactId");
    if (cid) setContactId(cid);
  }, []);

  const navigateToContact = (cid: string) => {
    setContactId(cid);
    setActiveSection("contacts");
  };

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <Overview />;
      case "pipeline":
        return <Pipeline />;
      case "deals":
        return <Projects onContactClick={navigateToContact} />;
      case "contacts":
        return <Contacts initialContactId={contactId} />;
      case "customers":
        return <Customers />;
      case "team":
        return <Team />;
      case "forecasting":
        return <Forecasting />;
      case "reports":
        return <Reports />;
      case "settings":
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-out ${
          sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
        }`}
      >
        <Header activeSection={activeSection} />
        <main className="flex-1 p-6 overflow-auto">
          <div
            key={activeSection}
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
