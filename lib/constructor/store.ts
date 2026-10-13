// Constructor: el Admin edita las páginas existentes.
// Secciones visibles por rol, campos por rol, campos personalizados,
// etapas del pipeline y automatizaciones. Cambios en vivo.
import type { Role } from "@/lib/auth/types";
import { supabase } from "@/lib/supabase";

export type FieldDef = { id: string; label: string };

export const PROJECT_FIELDS: FieldDef[] = [
  { id: "company", label: "Empresa" },
  { id: "contact", label: "Contacto" },
  { id: "value", label: "Valor" },
  { id: "saldo", label: "Saldo" },
  { id: "stage", label: "Etapa" },
  { id: "closeDate", label: "Fecha de cierre" },
  { id: "fecha_instalacion", label: "Fecha de instalación" },
  { id: "fecha_visita", label: "Fecha de visita" },
  { id: "created_at", label: "Fecha de creación" },
];

export const CONTACT_FIELDS: FieldDef[] = [
  { id: "name", label: "Nombre" },
  { id: "phone", label: "Teléfono" },
  { id: "direccion", label: "Dirección" },
  { id: "lastProject", label: "Último proyecto" },
];

const FIELDS_KEY = "qbo_fields_by_role";

type FieldsMap = Record<string, Record<string, Record<string, boolean>>>;

function allTrue(ids: string[]): Record<string, boolean> {
  return Object.fromEntries(ids.map((id) => [id, true]));
}

export function loadFields(): FieldsMap {
  const def = {
    deals: {
      Admin: allTrue(PROJECT_FIELDS.map((f) => f.id)),
      Vendedor: allTrue(PROJECT_FIELDS.map((f) => f.id)),
      Mueblista: allTrue(PROJECT_FIELDS.map((f) => f.id)),
    },
    contacts: {
      Admin: allTrue(CONTACT_FIELDS.map((f) => f.id)),
      Vendedor: allTrue(CONTACT_FIELDS.map((f) => f.id)),
      Mueblista: allTrue(CONTACT_FIELDS.map((f) => f.id)),
    },
  };
  try {
    const raw = localStorage.getItem(FIELDS_KEY);
    if (!raw) return def;
    const p = JSON.parse(raw) as FieldsMap;
    return {
      deals: {
        Admin: { ...def.deals.Admin, ...(p.deals?.Admin ?? {}) },
        Vendedor: { ...def.deals.Vendedor, ...(p.deals?.Vendedor ?? {}) },
        Mueblista: { ...def.deals.Mueblista, ...(p.deals?.Mueblista ?? {}) },
      },
      contacts: {
        Admin: { ...def.contacts.Admin, ...(p.contacts.Admin ?? {}) },
        Vendedor: { ...def.contacts.Vendedor, ...(p.contacts.Vendedor ?? {}) },
        Mueblista: { ...def.contacts.Mueblista, ...(p.contacts.Mueblista ?? {}) },
      },
    };
  } catch {
    return def;
  }
}

export function saveFields(m: FieldsMap) {
  localStorage.setItem(FIELDS_KEY, JSON.stringify(m));
  try { window.dispatchEvent(new Event("qbo:fields-changed")); } catch {}
  void pushFieldsToCloud(m);
}

const FIELDS_CLOUD_KEY = "fields_by_role";

/** Sube los campos por rol a la nube (best-effort). */
async function pushFieldsToCloud(m: FieldsMap) {
  try {
    const { error } = await supabase
      .from("app_config")
      .upsert({ key: FIELDS_CLOUD_KEY, value: m }, { onConflict: "key" });
    if (error) throw error;
  } catch {
    // sin nube: lo local sigue valiendo en este navegador
  }
}

/**
 * Baja los campos por rol de la nube y los aplica localmente.
 * Devuelve true si aplicó algo. Si la nube está vacía o inaccesible,
 * se conserva lo local.
 */
export async function pullFields(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", FIELDS_CLOUD_KEY)
      .maybeSingle();
    if (error || !data?.value || typeof data.value !== "object") return false;
    localStorage.setItem(FIELDS_KEY, JSON.stringify(data.value));
    try { window.dispatchEvent(new Event("qbo:fields-changed")); } catch {}
    return true;
  } catch {
    return false;
  }
}

/** ¿Ve este rol este campo? (defecto: sí) */
export function canSeeField(section: "deals" | "contacts", rol: Role, field: string): boolean {
  try {
    const m = loadFields();
    return m[section]?.[rol]?.[field] ?? true;
  } catch {
    return true;
  }
}

// ---- Campos personalizados ----
export type CustomFieldType = "texto" | "numero" | "fecha" | "lista" | "si_no";
export type CustomField = { id: string; label: string; type: CustomFieldType; options?: string[] };

const CUSTOM_KEY = "qbo_custom_fields";

export function loadCustomFields(): Record<"deals" | "contacts", CustomField[]> {
  const def = { deals: [] as CustomField[], contacts: [] as CustomField[] };
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return def;
    const p = JSON.parse(raw) as Record<"deals" | "contacts", CustomField[]>;
    return { deals: Array.isArray(p.deals) ? p.deals : [], contacts: Array.isArray(p.contacts) ? p.contacts : [] };
  } catch {
    return def;
  }
}

export function saveCustomFields(m: Record<"deals" | "contacts", CustomField[]>) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(m));
  try { window.dispatchEvent(new Event("qbo:fields-changed")); } catch {}
}

export function slugField(label: string) {
  return ("cf_" + label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "").slice(0, 30)) || `cf_${Date.now()}`;
}

// ---- Bloques por página (edición en contexto desde el Header) ----
import type { SectionId } from "@/lib/auth/permissions";

export type BlockDef = { id: string; label: string };

export const BLOCKS: Record<SectionId, BlockDef[]> = {
  overview: [
    { id: "metricas", label: "Tarjetas de métricas" },
    { id: "graficas", label: "Gráficas" },
    { id: "actividad", label: "Actividades y deals recientes" },
  ],
  pipeline: [
    { id: "alertas", label: "Alertas operativas" },
    { id: "tablero", label: "Tablero kanban" },
  ],
  deals: [
    { id: "buscador", label: "Buscador" },
    { id: "acciones", label: "Botones (Columnas / Agregar)" },
    { id: "resumen", label: "Conteo" },
    { id: "tabla", label: "Tabla" },
    { id: "paginacion", label: "Paginación" },
  ],
  contacts: [
    { id: "buscador", label: "Buscador" },
    { id: "acciones", label: "Botones (Columnas / Agregar)" },
    { id: "tabla", label: "Tabla" },
    { id: "paginacion", label: "Paginación" },
  ],
  customers: [
    { id: "resumen", label: "Tarjetas resumen" },
    { id: "filtros", label: "Filtros y búsqueda" },
    { id: "tarjetas", label: "Tarjetas de clientes" },
  ],
  team: [
    { id: "stats", label: "Estadísticas" },
    { id: "grafico", label: "Gráfica de rendimiento" },
    { id: "miembros", label: "Miembros del equipo" },
  ],
  forecasting: [
    { id: "controles", label: "Controles" },
    { id: "kpis", label: "Indicadores" },
    { id: "grafico", label: "Gráfica principal" },
    { id: "riesgos", label: "Riesgos y escenarios" },
  ],
  reports: [
    { id: "tarjetas", label: "Tarjetas de reportes" },
    { id: "graficos", label: "Gráficas" },
    { id: "tabla", label: "Tabla de reportes" },
  ],
  settings: [],
};

const BLOCKS_KEY = "qbo_blocks_by_role";

type BlocksMap = Record<string, Record<string, Record<string, boolean>>>;

export function loadBlocks(): BlocksMap {
  const def: BlocksMap = {};
  for (const [sec, list] of Object.entries(BLOCKS)) {
    def[sec] = {};
    for (const r of ["Admin", "Vendedor", "Mueblista"]) {
      def[sec][r] = Object.fromEntries(list.map((b) => [b.id, true]));
    }
  }
  try {
    const raw = localStorage.getItem(BLOCKS_KEY);
    if (!raw) return def;
    const p = JSON.parse(raw) as BlocksMap;
    for (const sec of Object.keys(def)) {
      for (const r of Object.keys(def[sec])) {
        def[sec][r] = { ...def[sec][r], ...(p[sec]?.[r] ?? {}) };
      }
    }
    return def;
  } catch {
    return def;
  }
}

export function saveBlocks(m: BlocksMap) {
  localStorage.setItem(BLOCKS_KEY, JSON.stringify(m));
  try { window.dispatchEvent(new Event("qbo:blocks-changed")); } catch {}
}

/** ¿Ve este rol este bloque? (defecto: sí) */
export function canSeeBlock(section: SectionId, rol: Role, block: string): boolean {
  try {
    return loadBlocks()[section]?.[rol]?.[block] ?? true;
  } catch {
    return true;
  }
}

// ---- Textos editables (renombrar títulos, botones, columnas) ----
const LABELS_KEY = "qbo_labels";

export const LABEL_DEFAULTS: Record<string, Record<string, string>> = {
  section: {
    overview: "Overview", pipeline: "Pipeline", deals: "Proyectos",
    contacts: "Contactos", customers: "Customers", team: "Team",
    forecasting: "Forecasting", reports: "Reports", settings: "Settings",
  },
  deals: {
    search: "Buscar proyectos...", add: "Agregar", columns: "Columnas",
    col_company: "Empresa", col_contact: "Contacto", col_value: "Valor",
    col_saldo: "Saldo", col_stage: "Etapa", col_closeDate: "Fecha de Cierre",
    col_fecha_instalacion: "Fecha de Instalación", col_fecha_visita: "Fecha de Visita",
    col_created_at: "Fecha de Creación",
  },
  contacts: {
    search: "Buscar contactos...", add: "Agregar", columns: "Columnas",
    col_name: "Nombre", col_phone: "Teléfono",
    col_direccion: "Dirección", col_lastProject: "Último proyecto",
  },
};

export function loadLabels(): Record<string, Record<string, string>> {
  const def = JSON.parse(JSON.stringify(LABEL_DEFAULTS)) as Record<string, Record<string, string>>;
  try {
    const raw = localStorage.getItem(LABELS_KEY);
    if (!raw) return def;
    const p = JSON.parse(raw) as Record<string, Record<string, string>>;
    for (const g of Object.keys(def)) def[g] = { ...def[g], ...(p[g] ?? {}) };
    return def;
  } catch {
    return def;
  }
}

export function saveLabels(m: Record<string, Record<string, string>>) {
  localStorage.setItem(LABELS_KEY, JSON.stringify(m));
  try { window.dispatchEvent(new Event("qbo:labels-changed")); } catch {}
}

/** Texto visible (defecto incluido). */
export function label(group: string, key: string): string {
  try {
    return loadLabels()[group]?.[key] ?? LABEL_DEFAULTS[group]?.[key] ?? key;
  } catch {
    return LABEL_DEFAULTS[group]?.[key] ?? key;
  }
}

/** Valor personalizado o undefined (para no pisar textos propios de cada página). */
export function customLabel(group: string, key: string): string | undefined {
  try {
    const raw = localStorage.getItem(LABELS_KEY);
    if (!raw) return undefined;
    const v = (JSON.parse(raw) as Record<string, Record<string, string>>)[group]?.[key];
    return v != null && v !== "" ? v : undefined;
  } catch {
    return undefined;
  }
}

/** Nombre de sección (sidebar + header). */
export function sectionLabel(id: string): string {
  return label("section", id);
}

// ---- Orden de columnas (tablas Proyectos/Contactos) ----
const ORDER_KEY = "qbo_column_order";

const DEFAULT_ORDER: Record<"deals" | "contacts", string[]> = {
  deals: ["company", "contact", "value", "saldo", "stage", "closeDate", "fecha_instalacion", "fecha_visita", "created_at"],
  contacts: ["name", "phone", "direccion", "lastProject"],
};

export function loadColumnOrder(): Record<"deals" | "contacts", string[]> {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Record<"deals" | "contacts", string[]>;
      return {
        deals: [...(p.deals ?? []), ...DEFAULT_ORDER.deals.filter((id) => !(p.deals ?? []).includes(id))],
        contacts: [...(p.contacts ?? []), ...DEFAULT_ORDER.contacts.filter((id) => !(p.contacts ?? []).includes(id))],
      };
    }
  } catch {}
  return JSON.parse(JSON.stringify(DEFAULT_ORDER)) as Record<"deals" | "contacts", string[]>;
}

export function saveColumnOrder(m: Record<"deals" | "contacts", string[]>) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(m));
  try { window.dispatchEvent(new Event("qbo:fields-changed")); } catch {}
}

export function moveColumn(sec: "deals" | "contacts", id: string, dir: -1 | 1) {
  const m = loadColumnOrder();
  const arr = m[sec].includes(id) ? [...m[sec]] : [...m[sec], id];
  const i = arr.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  m[sec] = arr;
  saveColumnOrder(m);
}

// ---- Automatizaciones ----
export type Automations = { auto_contrato: boolean; pago_nota: boolean; pago_cierre: boolean };
const AUTO_KEY = "qbo_automations";

export function loadAutomations(): Automations {
  try {
    const raw = localStorage.getItem(AUTO_KEY);
    if (raw) return { auto_contrato: true, pago_nota: true, pago_cierre: false, ...(JSON.parse(raw) as Partial<Automations>) };
  } catch {}
  return { auto_contrato: true, pago_nota: true, pago_cierre: false };
}

export function saveAutomations(a: Automations) {
  localStorage.setItem(AUTO_KEY, JSON.stringify(a));
}
