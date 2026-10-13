import type { Role } from "./types";
import { supabase } from "@/lib/supabase";

export type SectionId =
  | "overview"
  | "pipeline"
  | "deals"
  | "contacts"
  | "customers"
  | "team"
  | "forecasting"
  | "reports"
  | "settings";

export type ActionId =
  | "crear"
  | "editar"
  | "eliminar"
  | "aprobar_cotizacion"
  | "aprobar_pago";

export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "pipeline", label: "Pipeline" },
  { id: "deals", label: "Proyectos" },
  { id: "contacts", label: "Contactos" },
  { id: "customers", label: "Customers" },
  { id: "team", label: "Team" },
  { id: "forecasting", label: "Forecasting" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" },
];

export const ACTIONS: { id: ActionId; label: string }[] = [
  { id: "crear", label: "Crear" },
  { id: "editar", label: "Editar" },
  { id: "eliminar", label: "Eliminar" },
  { id: "aprobar_cotizacion", label: "Aprobar cotización" },
  { id: "aprobar_pago", label: "Aprobar pago" },
];

export type RolePermissions = Record<Role, Record<SectionId, boolean>> &
  Record<string, Record<string, boolean>>;

export type RoleActions = Record<Role, Record<ActionId, boolean>>;

// Día 1: todos ven todo (decisión Q6). Admin recorta desde panel Usuarios.
function allTrue<T extends string>(keys: T[]): Record<T, boolean> {
  return Object.fromEntries(keys.map((k) => [k, true])) as Record<T, boolean>;
}

const sectionIds = SECTIONS.map((s) => s.id);
const actionIds = ACTIONS.map((a) => a.id);

export const DEFAULT_VIEW: Record<Role, Record<SectionId, boolean>> = {
  Admin: allTrue(sectionIds),
  Vendedor: allTrue(sectionIds),
  Mueblista: allTrue(sectionIds),
};

export const DEFAULT_ACTIONS: Record<Role, Record<ActionId, boolean>> = {
  Admin: allTrue(actionIds),
  Vendedor: allTrue(actionIds),
  Mueblista: allTrue(actionIds),
};

const VIEW_KEY = "qbo_role_view";
const ACTIONS_KEY = "qbo_role_actions";

export const PERMISSIONS_EVENT = "qbo:permissions-changed";

function notifyPermissionsChanged() {
  try {
    window.dispatchEvent(new Event(PERMISSIONS_EVENT));
  } catch {}
}

export function loadView(): Record<Role, Record<SectionId, boolean>> {
  try {
    const raw = localStorage.getItem(VIEW_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge profundo por rol para no perder roles ni nuevas secciones
      return {
        Admin: { ...DEFAULT_VIEW.Admin, ...(parsed.Admin ?? {}) },
        Vendedor: { ...DEFAULT_VIEW.Vendedor, ...(parsed.Vendedor ?? {}) },
        Mueblista: { ...DEFAULT_VIEW.Mueblista, ...(parsed.Mueblista ?? {}) },
      };
    }
  } catch {}
  return DEFAULT_VIEW;
}

export function saveView(v: Record<Role, Record<SectionId, boolean>>) {
  // Protección anti-bloqueo: Admin siempre conserva Settings
  // (si no, perdería acceso al panel Usuarios para revertirlo).
  const safe = {
    ...v,
    Admin: { ...v.Admin, settings: true },
  };
  localStorage.setItem(VIEW_KEY, JSON.stringify(safe));
  notifyPermissionsChanged();
  void pushViewToCloud(safe);
}

/** Sube la matriz de secciones a la nube (best-effort: sin tabla no rompe). */
async function pushViewToCloud(v: Record<Role, Record<SectionId, boolean>>) {
  try {
    const rows = (Object.keys(v) as Role[]).map((rol) => ({ rol, ver: v[rol] }));
    const { error } = await supabase
      .from("role_permissions")
      .upsert(rows, { onConflict: "rol" });
    if (error) throw error;
  } catch {
    // sin nube: el permiso local sigue valiendo en este navegador
  }
}

export function loadActions(): Record<Role, Record<ActionId, boolean>> {
  try {
    const raw = localStorage.getItem(ACTIONS_KEY);
    if (raw) return { ...DEFAULT_ACTIONS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_ACTIONS;
}

export function saveActions(a: Record<Role, Record<ActionId, boolean>>) {
  localStorage.setItem(ACTIONS_KEY, JSON.stringify(a));
  notifyPermissionsChanged();
  void pushActionsToCloud(a);
}

/** Sube la matriz de acciones a la nube (best-effort). */
async function pushActionsToCloud(a: Record<Role, Record<ActionId, boolean>>) {
  try {
    const rows = (Object.keys(a) as Role[]).map((rol) => ({ rol, acciones: a[rol] }));
    const { error } = await supabase
      .from("role_permissions")
      .upsert(rows, { onConflict: "rol" });
    if (error) throw error;
  } catch {
    // sin nube: el permiso local sigue valiendo en este navegador
  }
}

/**
 * Baja los permisos de la nube y los aplica localmente.
 * Devuelve true si aplicó algo (para refrescar la UI).
 * Si la nube está vacía o inaccesible, se conserva lo local.
 */
export async function pullPermissions(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select("rol,ver,acciones");
    if (error || !data || data.length === 0) return false;
    let applied = false;
    const view = loadView();
    const actions = loadActions();
    for (const row of data as { rol: string; ver: unknown; acciones: unknown }[]) {
      if (row.rol !== "Admin" && row.rol !== "Vendedor" && row.rol !== "Mueblista") continue;
      if (row.ver && typeof row.ver === "object") {
        view[row.rol as Role] = { ...view[row.rol as Role], ...(row.ver as Record<SectionId, boolean>) };
        applied = true;
      }
      if (row.acciones && typeof row.acciones === "object") {
        actions[row.rol as Role] = {
          ...actions[row.rol as Role],
          ...(row.acciones as Record<ActionId, boolean>),
        };
        applied = true;
      }
    }
    if (!applied) return false;
    // Admin siempre conserva Settings (anti-bloqueo)
    view.Admin = { ...view.Admin, settings: true };
    localStorage.setItem(VIEW_KEY, JSON.stringify(view));
    localStorage.setItem(ACTIONS_KEY, JSON.stringify(actions));
    return true;
  } catch {
    return false;
  }
}

export function canView(rol: Role, section: SectionId): boolean {
  if (rol === "Admin" && section === "settings") return true;
  return loadView()[rol]?.[section] ?? true;
}

export function canDo(rol: Role, action: ActionId): boolean {
  if (rol === "Admin") return true;
  return loadActions()[rol]?.[action] ?? false;
}
