"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { type Project } from "@/data/deals";
import { updateProject } from "@/lib/api/projects";
import { fetchPayments, createPayment, deletePayment } from "@/lib/api/payments";
import { fetchQuotes, deleteQuote, getQuoteUrl } from "@/lib/api/quotes";
import type { DbQuote } from "@/lib/api/quotes";
import { fetchProjectFiles, createProjectFile, deleteProjectFile, getProjectFileUrl } from "@/lib/api/project_files";
import type { DbProjectFile } from "@/lib/api/project_files";
import { fetchProjectPhotos, createProjectPhoto, deleteProjectPhoto, getProjectPhotoUrl } from "@/lib/api/project_photos";
import type { DbProjectPhoto } from "@/lib/api/project_photos";
import { fetchContracts, createContract, deleteContract, getContractUrl } from "@/lib/api/contracts";
import type { DbContract } from "@/lib/api/contracts";
import { fetchDesigns, createDesign, deleteDesign, getDesignUrl } from "@/lib/api/designs";
import type { DbDesign } from "@/lib/api/designs";
import { createPaymentReceipt } from "@/lib/api/payment_receipts";
import type { DbPayment } from "@/lib/api/payments";
import { QuoteApprovalModal } from "@/components/QuoteApprovalModal";
import type { ExtractedQuote } from "@/components/QuoteApprovalModal";
import { ReceiptApprovalModal } from "@/components/ReceiptApprovalModal";
import type { ExtractedReceipt } from "@/components/ReceiptApprovalModal";
import {
  ChevronLeft, ChevronDown, Home, Pencil, Plus,
  Search, X, Save, Trash2, DollarSign, FileText,
} from "lucide-react";

const mainTabs = ["Información destacada", "Actividades", "Personalizar"];
const activityTabs = ["Todas las actividades", "Notas", "Correos", "Llamadas", "Tareas", "Reuniones"];

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onSave?: (updated: Project) => void;
  onContactClick?: (contactId: string) => void;
}

const stageLabel: Record<Project["status"], string> = {
  won: "Cierre",
  pending: "Visita",
  lost: "Perdido",
};

const statusOptions: Project["status"][] = ["won", "pending", "lost"];

function SectionHeader({ title, collapsible = true, action }: {
  title: string; collapsible?: boolean; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {collapsible && <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function PlusButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
      <Plus className="w-4 h-4" />
    </button>
  );
}

function FileUploadRow({ files, onRemove, getUrl, showValor }: {
  files: { id: string; filename: string; storage_path: string; valor?: number | null }[];
  onRemove: (index: number) => void;
  getUrl: (path: string) => Promise<string>;
  showValor?: boolean;
}) {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const entries = await Promise.all(
        files.map(async (f) => [f.storage_path, await getUrl(f.storage_path)] as const)
      );
      setUrls(Object.fromEntries(entries));
    };
    if (files.length > 0) load();
  }, [files, getUrl]);

  if (files.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {files.map((file, i) => (
        <div key={file.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border text-sm">
          <a href={urls[file.storage_path] || "#"} target="_blank" rel="noopener noreferrer"
            className="text-muted-foreground truncate hover:text-accent underline-offset-2 hover:underline">
            {file.filename}
          </a>
          <div className="flex items-center gap-2 shrink-0">
            {showValor && file.valor != null && (
              <span className="text-xs font-semibold text-accent">${file.valor.toLocaleString()}</span>
            )}
            <button onClick={() => onRemove(i)}
              className="text-muted-foreground hover:text-destructive transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectDetail({ project, onBack, onSave, onContactClick }: ProjectDetailProps) {
  const [activeMainTab, setActiveMainTab] = useState("Actividades");
  const [activeActivityTab, setActiveActivityTab] = useState("Todas las actividades");

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Project>({ ...project });

  const [fechaCreacion] = useState("21/05/2026 15:34 GMT-4");
  const [direccion, setDireccion] = useState(project.direccion ?? "Arquitecto Andres Murillo 1499, La Serena");
  const [fechaVisita, setFechaVisita] = useState(project.fecha_visita ?? "21/05/2026 15:34 GMT-4");
  const [fechaInstalacion, setFechaInstalacion] = useState(project.fecha_instalacion ?? "21/05/2026 15:34 GMT-4");

  useEffect(() => {
    setDraft({ ...project });
    setDireccion(project.direccion ?? "Arquitecto Andres Murillo 1499, La Serena");
    setFechaVisita(project.fecha_visita ?? "21/05/2026 15:34 GMT-4");
    setFechaInstalacion(project.fecha_instalacion ?? "21/05/2026 15:34 GMT-4");
  }, [project]);

  const [fichaFiles, setFichaFiles] = useState<DbProjectFile[]>([]);
  const [fotosFiles, setFotosFiles] = useState<DbProjectPhoto[]>([]);
  const [contratoFiles, setContratoFiles] = useState<DbContract[]>([]);
  const [pagos, setPagos] = useState<DbPayment[]>([]);
  const [disenoFiles, setDisenoFiles] = useState<DbDesign[]>([]);
  const [quotesList, setQuotesList] = useState<DbQuote[]>([]);

  const [quotePending, setQuotePending] = useState<{ quote: ExtractedQuote; file: File } | null>(null);
  const [receiptPending, setReceiptPending] = useState<{ receipt: ExtractedReceipt; file: File } | null>(null);

  useEffect(() => {
    Promise.all([
      fetchPayments(project.id).then(setPagos).catch(() => {}),
      fetchQuotes(project.id).then(setQuotesList).catch(() => {}),
      fetchProjectFiles(project.id).then(setFichaFiles).catch(() => {}),
      fetchProjectPhotos(project.id).then(setFotosFiles).catch(() => {}),
      fetchContracts(project.id).then(setContratoFiles).catch(() => {}),
      fetchDesigns(project.id).then(setDisenoFiles).catch(() => {}),
    ]);
  }, [project.id]);

  const updateDraft = (field: keyof Project, value: string | number) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const saved = await updateProject(project.id, {
        company: draft.company,
        email: draft.email,
        value: draft.value,
        stage: draft.stage,
        status: draft.status,
        close_date: draft.closeDate,
        rep: draft.rep,
        direccion: direccion,
        fecha_visita: fechaVisita,
        fecha_instalacion: fechaInstalacion,
      });
      onSave?.(saved);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = () => {
    setDraft({ ...project });
    setDireccion(project.direccion ?? "Arquitecto Andres Murillo 1499, La Serena");
    setFechaVisita(project.fecha_visita ?? "21/05/2026 15:34 GMT-4");
    setFechaInstalacion(project.fecha_instalacion ?? "21/05/2026 15:34 GMT-4");
    setIsEditing(false);
  };

  const handleAddFile = (type: "ficha" | "fotos" | "contrato" | "diseno" | "cotizacion") => async (files: FileList) => {
    if (type === "cotizacion") {
      const f = files[0];
      if (!f) return;
      const formData = new FormData();
      formData.append("file", f);
      try {
        const res = await fetch("/api/quotes/extract", { method: "POST", body: formData });
        if (!res.ok) {
          const errBody = await res.json();
          alert("Error extrayendo datos del PDF: " + (errBody.error || "Error desconocido"));
          return;
        }
        const data = await res.json();
        setQuotePending({ quote: data, file: f });
      } catch (e) {
        alert("Error de conexión al extraer cotización: " + (e instanceof Error ? e.message : String(e)));
      }
      return;
    }

    for (const f of Array.from(files)) {
      try {
        if (type === "ficha") {
          const saved = await createProjectFile({ project_id: project.id, file: f });
          setFichaFiles((prev) => [...prev, saved]);
        } else if (type === "fotos") {
          const saved = await createProjectPhoto({ project_id: project.id, file: f });
          setFotosFiles((prev) => [...prev, saved]);
        } else if (type === "contrato") {
          const saved = await createContract({ project_id: project.id, file: f });
          setContratoFiles((prev) => [...prev, saved]);
        } else {
          const saved = await createDesign({ project_id: project.id, file: f });
          setDisenoFiles((prev) => [...prev, saved]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRemoveFile = (type: string, setter: any) => async (index: number) => {
    const files = type === "ficha" ? fichaFiles : type === "fotos" ? fotosFiles : type === "contrato" ? contratoFiles : disenoFiles;
    const file: any = files[index];
    if (!file) return;
    try {
      if (type === "ficha") await deleteProjectFile(file.id, file.storage_path);
      else if (type === "fotos") await deleteProjectPhoto(file.id, file.storage_path);
      else if (type === "contrato") await deleteContract(file.id, file.storage_path);
      else await deleteDesign(file.id, file.storage_path);
      setter((prev: any[]) => prev.filter((_: any, i: number) => i !== index));
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveQuote = async (edited: ExtractedQuote) => {
    if (!quotePending) return;
    const { file } = quotePending;
    try {
      const newName = edited.numero
        ? `Presupuesto #${edited.numero}.pdf`
        : file.name;
      const renamed = new File([file], newName, { type: file.type });

      const formData = new FormData();
      formData.append("file", renamed);
      formData.append("project_id", project.id);
      formData.append("extracted", JSON.stringify(edited));
      const res = await fetch("/api/quotes", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al guardar");
      }
      const saved = await res.json();
      setQuotesList((prev) => [saved, ...prev]);
    } catch (e) {
      console.error("Error al subir cotización:", e);
    }
    setQuotePending(null);
  };

  const handleApproveReceipt = async (edited: ExtractedReceipt) => {
    if (!receiptPending) return;
    const { file } = receiptPending;
    try {
      const saved = await createPayment({
        project_id: project.id,
        monto: edited.monto ?? 0,
        fecha: edited.fecha || new Date().toISOString().slice(0, 10),
        pagado_por: edited.pagado_por || undefined,
        num_transferencia: edited.num_transferencia || undefined,
      });
      try {
        await createPaymentReceipt({ payment_id: saved.id, file });
      } catch (e) {
        console.error("Error al subir comprobante:", e);
      }
      setPagos((prev) => [saved, ...prev]);
    } catch (e) {
      console.error("Error al crear pago:", e);
    }
    setReceiptPending(null);
  };

  const d = isEditing ? draft : project;

  const activities = [
    {
      title: "Actividad de Negocio",
      body: (
        <>
          <span className="text-accent font-medium cursor-pointer hover:underline">{d.rep}</span> movió{" "}
          <span className="text-accent font-medium cursor-pointer hover:underline">{d.company}</span> a{" "}
          {stageLabel[d.status]}.{" "}
          <span className="text-accent font-medium cursor-pointer hover:underline">Ver detalles</span>
        </>
      ),
      time: "20 de jun. de 2026 a la(s) 15:25 GMT-4",
    },
    {
      title: "Actividad de Cotización",
      body: (
        <>
          <span className="text-accent font-medium cursor-pointer hover:underline">{d.rep}</span> creó la cotización{" "}
          <span className="text-accent font-medium cursor-pointer hover:underline">Cotización 123</span> por{" "}
          ${d.value.toLocaleString()} CLP.
        </>
      ),
      time: "20 de jun. de 2026 a la(s) 15:25 GMT-4",
    },
    {
      title: "Actividad de Contacto",
      body: (
        <>
          <span className="text-accent font-medium cursor-pointer hover:underline">{d.contact}</span> fue asociado al
          proyecto.{" "}
          <span className="text-accent font-medium cursor-pointer hover:underline">Ver detalles</span>
        </>
      ),
      time: "20 de jun. de 2026 a la(s) 15:15 GMT-4",
    },
    {
      title: "Creado",
      body: "Este negocio fue creado a partir de Fuentes sin conexión de Interfaz de usuario del CRM",
      time: "20 de jun. de 2026 a la(s) 15:15 GMT-4",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ---------- Left column ---------- */}
      <div className="space-y-4">
        {/* Identity card */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <button onClick={onBack}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" /> Proyectos
            </button>
            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <button onClick={handleSave}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-success hover:bg-success/10 transition-colors">
                    <Save className="w-3.5 h-3.5" /> Guardar
                  </button>
                  <button onClick={handleCancel}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-5">
            <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input type="text" value={d.company} onChange={(e) => updateDraft("company", e.target.value)}
                  className="w-full text-lg font-semibold text-foreground bg-secondary border border-border rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-ring/20" />
              ) : (
                <h2 className="text-lg font-semibold text-foreground truncate">{d.company}</h2>
              )}
              <p className="text-sm text-muted-foreground truncate">Saldo pendiente: 50.000$ CLP</p>
            </div>
          </div>

          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-xs text-muted-foreground">Valor Proyecto</dt>
              <dd className="text-sm font-semibold text-accent mt-0.5">
                {isEditing ? (
                  <input type="number" value={d.value} onChange={(e) => updateDraft("value", Number(e.target.value))}
                    className="w-full h-8 px-2 rounded-md bg-secondary border border-border text-sm font-semibold text-accent focus:outline-none focus:ring-2 focus:ring-ring/20" />
                ) : (
                  `$${quotesList.reduce((sum, q) => sum + (q.total ?? 0), 0).toLocaleString()} CLP`
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Contacto</dt>
              <dd className="text-sm text-foreground mt-0.5">
                {d.contact_id ? (
                  <button onClick={() => onContactClick?.(d.contact_id!)}
                    className="hover:text-accent underline-offset-2 hover:underline text-foreground text-sm">
                    {d.contact}
                  </button>
                ) : (
                  <span>{d.contact}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Dirección del Proyecto</dt>
              <dd className="text-sm mt-0.5">
                {isEditing ? (
                  <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)}
                    className="w-full h-8 px-2 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
                ) : (
                  <span className="text-foreground">{direccion}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fecha de Creación</dt>
              <dd className="text-sm text-foreground mt-0.5">{fechaCreacion}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fecha de Visita</dt>
              <dd className="text-sm mt-0.5">
                {isEditing ? (
                  <input type="text" value={fechaVisita} onChange={(e) => setFechaVisita(e.target.value)}
                    className="w-full h-8 px-2 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
                ) : (
                  <span className="text-foreground">{fechaVisita}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fecha de Instalación</dt>
              <dd className="text-sm mt-0.5">
                {isEditing ? (
                  <input type="text" value={fechaInstalacion} onChange={(e) => setFechaInstalacion(e.target.value)}
                    className="w-full h-8 px-2 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
                ) : (
                  <span className="text-foreground">{fechaInstalacion}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fecha de Cierre</dt>
              <dd className="text-sm mt-0.5">
                {isEditing ? (
                  <input type="text" value={d.closeDate} onChange={(e) => updateDraft("closeDate", e.target.value)}
                    className="w-full h-8 px-2 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
                ) : (
                  <span className="text-foreground">{d.closeDate} 15:34 GMT-4</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Estado</dt>
              <dd className="text-sm mt-0.5">
                {isEditing ? (
                  <select value={d.status} onChange={(e) => updateDraft("status", e.target.value)}
                    className="w-full h-8 px-2 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20">
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{stageLabel[s]}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-foreground">{stageLabel[d.status]}</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Ficha de Proyecto */}
        <div className="bg-card border border-border rounded-xl p-4">
          <SectionHeader title="Ficha de Proyecto" collapsible={false}
            action={<PlusButton onClick={() => document.getElementById("file-ficha")?.click()} />}
          />
          <input id="file-ficha" type="file" className="hidden" multiple
            onChange={(e) => { if (e.target.files?.length) handleAddFile("ficha")(e.target.files); e.target.value = ""; }} />
          <FileUploadRow files={fichaFiles} onRemove={handleRemoveFile("ficha", setFichaFiles)} getUrl={getProjectFileUrl} />
        </div>

        {/* Fotos Proyecto Finalizado */}
        <div className="bg-card border border-border rounded-xl p-4">
          <SectionHeader title="Fotos Proyecto Finalizado" collapsible={false}
            action={<PlusButton onClick={() => document.getElementById("file-fotos")?.click()} />}
          />
          <input id="file-fotos" type="file" className="hidden" multiple
            onChange={(e) => { if (e.target.files?.length) handleAddFile("fotos")(e.target.files); e.target.value = ""; }} />
          <FileUploadRow files={fotosFiles} onRemove={handleRemoveFile("fotos", setFotosFiles)} getUrl={getProjectPhotoUrl} />
        </div>
      </div>

      {/* ---------- Center column (activity wall) ---------- */}
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-1.5 flex items-center gap-1">
          {mainTabs.map((tab) => (
            <button key={tab} onClick={() => setActiveMainTab(tab)}
              className={cn(
                "flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeMainTab === tab ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-4 border-b border-border overflow-x-auto">
            {activityTabs.map((tab) => (
              <button key={tab} onClick={() => setActiveActivityTab(tab)}
                className={cn(
                  "relative pb-3 text-sm font-medium whitespace-nowrap transition-colors",
                  activeActivityTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}>
                {tab}
                {activeActivityTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Buscar actividades"
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-accent transition-all" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-foreground">
                Actividad (25/35) <ChevronDown className="w-3 h-3" /> <X className="w-3 h-3 text-muted-foreground" />
              </button>
              <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Todo <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Actividad asignada a <ChevronDown className="w-3 h-3" />
              </button>
              <button className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Borrar todo
              </button>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">junio 2026</p>
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div key={index}
                  className="rounded-lg border border-border bg-secondary/40 p-4 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}>
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{activity.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{activity.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Right column ---------- */}
      <div className="space-y-4">
        {/* Cotizaciones */}
        <div className="bg-card border border-border rounded-xl p-4">
          <SectionHeader title={`Cotizaciones (${quotesList.length})`} collapsible={false}
            action={<PlusButton onClick={() => document.getElementById("file-cotizacion")?.click()} />}
          />
          <input id="file-cotizacion" type="file" className="hidden" multiple
            onChange={(e) => { if (e.target.files?.length) handleAddFile("cotizacion")(e.target.files); e.target.value = ""; }} />

          {quotesList.length > 0 && (
            <div className="mt-3 space-y-2">
              {quotesList.map((q, i) => (
                <QuoteRow key={q.id} quote={q} onRemove={async () => {
                  try {
                    await deleteQuote(q.id, q.storage_path);
                    setQuotesList((prev) => prev.filter((_, j) => j !== i));
                  } catch (e) { console.error(e); }
                }} />
              ))}
            </div>
          )}

          {quotesList.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">Sin cotizaciones</p>
          )}

          <button className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            Aprobar presupuestos
          </button>
        </div>

        {/* Contrato */}
        <div className="bg-card border border-border rounded-xl p-4">
          <SectionHeader title="Contrato" collapsible={false}
            action={<PlusButton onClick={() => document.getElementById("file-contrato")?.click()} />}
          />
          <input id="file-contrato" type="file" className="hidden" multiple
            onChange={(e) => { if (e.target.files?.length) handleAddFile("contrato")(e.target.files); e.target.value = ""; }} />
          <FileUploadRow files={contratoFiles} onRemove={handleRemoveFile("contrato", setContratoFiles)} getUrl={getContractUrl} />
        </div>

        {/* Pagos */}
        <div className="bg-card border border-border rounded-xl p-4">
          <SectionHeader title={`Pagos (${pagos.length})`}
            action={<PlusButton onClick={() => document.getElementById("file-recibo")?.click()} />}
          />
          <input id="file-recibo" type="file" className="hidden" accept="image/*,.pdf"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              e.target.value = "";
              const fd = new FormData();
              fd.append("file", f);
              try {
                const res = await fetch("/api/payments/extract", { method: "POST", body: fd });
                if (!res.ok) {
                  const err = await res.json();
                  alert("Error al procesar comprobante: " + (err.error || "Error desconocido"));
                  return;
                }
                const data = await res.json();
                setReceiptPending({ receipt: data, file: f });
              } catch (e) {
                alert("Error de conexión: " + (e instanceof Error ? e.message : String(e)));
              }
            }} />

          <div className="mt-4 space-y-3">
            {pagos.map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-secondary/40 p-4 relative group">
                <button onClick={async () => {
                  try {
                    await deletePayment(p.id);
                    setPagos((prev) => prev.filter((x) => x.id !== p.id));
                  } catch (e) { console.error(e); }
                }}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                  title="Eliminar">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-accent shrink-0" />
                  <span className="text-sm font-medium text-foreground">${(p.monto ?? 0).toLocaleString()} CLP</span>
                </div>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Fecha:</dt>
                    <dd className="text-foreground">{p.fecha}</dd>
                  </div>
                  {p.pagado_por && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Pagado por:</dt>
                      <dd className="text-foreground">{p.pagado_por}</dd>
                    </div>
                  )}
                  {p.num_transferencia && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">N° Transf.:</dt>
                      <dd className="text-foreground font-mono text-xs">{p.num_transferencia}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Estado:</dt>
                    <dd className={cn("font-medium", p.estado === "pagado" ? "text-success" : "text-warning")}>
                      {p.estado === "pagado" ? "Pagado" : "Pendiente"}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>

        {/* Diseño 3D */}
        <div className="bg-card border border-border rounded-xl p-4">
          <SectionHeader title="Diseño 3D" collapsible={false}
            action={<PlusButton onClick={() => document.getElementById("file-diseno")?.click()} />}
          />
          <input id="file-diseno" type="file" className="hidden" multiple
            onChange={(e) => { if (e.target.files?.length) handleAddFile("diseno")(e.target.files); e.target.value = ""; }} />
          <FileUploadRow files={disenoFiles} onRemove={handleRemoveFile("diseno", setDisenoFiles)} getUrl={getDesignUrl} />
        </div>
      </div>

      {quotePending && (
        <QuoteApprovalModal
          quote={quotePending.quote}
          onApprove={handleApproveQuote}
          onCancel={() => setQuotePending(null)}
        />
      )}
      {receiptPending && (
        <ReceiptApprovalModal
          receipt={receiptPending.receipt}
          onApprove={handleApproveReceipt}
          onCancel={() => setReceiptPending(null)}
        />
      )}
    </div>
  );
}

function QuoteRow({ quote, onRemove }: { quote: DbQuote; onRemove: () => void }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    getQuoteUrl(quote.storage_path).then(setUrl).catch(() => {});
  }, [quote.storage_path]);

  const fmt = (n: number | null) => n != null ? `$${n.toLocaleString()}` : "";

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border text-sm group">
      <div className="flex items-center gap-2 min-w-0">
        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
        <a href={url || "#"} target="_blank" rel="noopener noreferrer"
          className="text-muted-foreground truncate hover:text-accent underline-offset-2 hover:underline">
          {quote.filename}
        </a>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {quote.numero && <span className="text-xs text-muted-foreground">#{quote.numero}</span>}
        {fmt(quote.total) && <span className="text-xs font-semibold text-accent">{fmt(quote.total)}</span>}
        <button onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}