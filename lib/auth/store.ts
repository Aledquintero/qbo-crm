// Store MVP: localStorage como primario + intento best-effort en Supabase (tabla app_users).
// Así funciona sin migración y cuando exista la tabla, sincroniza.
// TODO migración a bcrypt: reemplazar password plano por password_hash (ver supabase/auth-setup.sql).

import { supabase } from "@/lib/supabase";
import { generateUsername } from "./username";
import type { AuthUser, Role, Session, UserStatus } from "./types";

const USERS_KEY = "qbo_users";
const SESSION_KEY = "qbo_session";
const TABLE = "app_users";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function seedAdmin(): AuthUser {
  return {
    id: "seed-admin-qbo",
    nombre: "QBO Modular",
    username: "qbomodular",
    password: "admin123",
    rol: "Admin",
    estado: "activo",
    createdAt: new Date().toISOString(),
  };
}

export function loadUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      const seed = [seedAdmin()];
      localStorage.setItem(USERS_KEY, JSON.stringify(seed));
      return seed;
    }
    const list = JSON.parse(raw) as AuthUser[];
    // Garantiza que el seed admin exista
    if (!list.some((u) => u.username === "qbomodular")) {
      list.unshift(seedAdmin());
      localStorage.setItem(USERS_KEY, JSON.stringify(list));
    }
    return list;
  } catch {
    return [seedAdmin()];
  }
}

function persist(users: AuthUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  // best-effort supabase (ignora error si la tabla no existe aún)
  try {
    void supabase
      .from(TABLE)
      .upsert(
        users.map((u) => ({
          id: u.id,
          nombre: u.nombre,
          username: u.username,
          password: u.password,
          rol: u.rol,
          estado: u.estado,
        })),
        { onConflict: "username" }
      )
      .then(() => {});
  } catch {}
}

// --- Sesión mínima en localStorage (username + rol + nombre para UI) ---
export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session | null) {
  if (!s) localStorage.removeItem(SESSION_KEY);
  else
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ username: s.username, nombre: s.nombre, rol: s.rol })
    );
}

export type RegisterResult =
  | { ok: true; username: string }
  | { ok: false; error: string };

export type LoginResult =
  | { ok: true; session: Session }
  | { ok: false; error: string };

export async function login(username: string, password: string): Promise<LoginResult> {
  const clean = username.trim();
  const users = loadUsers();
  const u = users.find((x) => x.username.toLowerCase() === clean.toLowerCase());
  if (u && u.password === password) {
    const estadoErr = estadoError(u.estado);
    if (estadoErr) return { ok: false, error: estadoErr };
    const s: Session = { username: u.username, nombre: u.nombre, rol: u.rol };
    setSession(s);
    return { ok: true, session: s };
  }
  // No está (o cambió la clave) en este navegador: buscar en la nube para
  // que las cuentas funcionen en cualquier equipo.
  const cloud = await fetchCloudUser(clean);
  if (cloud && cloud.password === password) {
    const estadoErr = estadoError(cloud.estado);
    if (estadoErr) return { ok: false, error: estadoErr };
    // Cache local para la próxima vez
    const merged = users.some((x) => x.username.toLowerCase() === cloud.username.toLowerCase())
      ? users.map((x) =>
          x.username.toLowerCase() === cloud.username.toLowerCase() ? { ...cloud, password } : x
        )
      : [...users, { ...cloud, password }];
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(merged));
    } catch {
      // almacenamiento no disponible
    }
    const s: Session = { username: cloud.username, nombre: cloud.nombre, rol: cloud.rol };
    setSession(s);
    return { ok: true, session: s };
  }
  if (u || cloud) return { ok: false, error: "Usuario o contraseña incorrectos." };
  return { ok: false, error: "Usuario o contraseña incorrectos." };
}

function estadoError(estado: UserStatus): string | null {
  if (estado === "pendiente") return "Cuenta pendiente de aprobación por Admin.";
  if (estado === "inactivo") return "Cuenta desactivada. Contacta al Admin.";
  return null;
}

type CloudUser = {
  id: string;
  nombre: string;
  username: string;
  password: string;
  rol: Role;
  estado: UserStatus;
  createdAt: string;
};

async function fetchCloudUser(username: string): Promise<CloudUser | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id,nombre,username,password,rol,estado")
      .ilike("username", username);
    if (error || !data || data.length === 0) return null;
    const row = data[0] as {
      id: string;
      nombre: string;
      username: string;
      password: string;
      rol: string;
      estado: string;
    };
    if (row.rol !== "Admin" && row.rol !== "Vendedor" && row.rol !== "Mueblista") return null;
    if (row.estado !== "activo" && row.estado !== "pendiente" && row.estado !== "inactivo") return null;
    return {
      id: row.id,
      nombre: row.nombre,
      username: row.username,
      password: row.password,
      rol: row.rol as Role,
      estado: row.estado as UserStatus,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function logout() {
  setSession(null);
}

// --- Admin ---
export function setEstado(username: string, estado: UserStatus) {
  const users = loadUsers().map((u) =>
    u.username === username ? { ...u, estado } : u
  );
  persist(users);
  // Expulsión inmediata: si era el de la sesión, cerrar
  const s = getSession();
  if (s?.username === username && estado !== "activo") setSession(null);
  return users;
}

export function setRol(username: string, rol: Role) {
  const users = loadUsers().map((u) =>
    u.username === username ? { ...u, rol } : u
  );
  persist(users);
  const s = getSession();
  if (s?.username === username)
    setSession({ username: s.username, nombre: s.nombre, rol });
  return users;
}

export function removeUser(username: string) {
  const users = loadUsers().filter((u) => u.username !== username);
  persist(users);
  const s = getSession();
  if (s?.username === username) setSession(null);
  return users;
}

export function resetPassword(username: string, nueva: string) {
  if (!nueva) return loadUsers();
  const users = loadUsers().map((u) =>
    u.username === username ? { ...u, password: nueva } : u
  );
  persist(users);
  return users;
}

export function createByAdmin(
  nombre: string,
  password: string,
  rol: Role,
  customUsername?: string
): RegisterResult {
  if (!nombre.trim() || !password)
    return { ok: false, error: "Nombre y contraseña obligatorios." };
  const users = loadUsers();
  const base = customUsername?.trim() || nombre.trim();
  const username = generateUsername(
    customUsername?.trim() ? customUsername.trim() : nombre.trim(),
    users.map((u) => u.username)
  );
  void base;
  users.push({
    id: uid(),
    nombre: nombre.trim(),
    username,
    password,
    rol,
    estado: "activo",
    createdAt: new Date().toISOString(),
  });
  persist(users);
  return { ok: true, username };
}
