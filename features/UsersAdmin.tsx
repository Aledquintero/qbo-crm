"use client";

import { useState } from "react";
import {
  ACTIONS,
  loadActions,
  saveActions,
  type ActionId,
} from "@/lib/auth/permissions";
import type { Role } from "@/lib/auth/types";
import { ROLES } from "@/lib/auth/types";
import {
  createByAdmin,
  loadUsers,
  removeUser,
  resetPassword,
  setEstado,
  setRol as setUserRol,
} from "@/lib/auth/store";
import type { AuthUser } from "@/lib/auth/types";

export function UsersAdmin() {
  const [users, setUsers] = useState<AuthUser[]>(() => loadUsers());
  const [actions, setActions] = useState(loadActions);
  const [nombre, setNombre] = useState("");
  const [pass, setPass] = useState("");
  const [rol, setRol] = useState<Role>("Vendedor");
  const [customUser, setCustomUser] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});

  const refresh = () => setUsers(loadUsers());

  const toggleAction = (r: Role, a: ActionId) => {
    const na = { ...actions, [r]: { ...actions[r], [a]: !actions[r][a] } };
    setActions(na);
    saveActions(na);
  };

  const doCreate = () => {
    setMsg(null);
    const res = createByAdmin(nombre, pass, rol, customUser || undefined);
    if (!res.ok) setMsg(res.error);
    else {
      setMsg(`Usuario creado: ${res.username}`);
      setNombre("");
      setPass("");
      setCustomUser("");
      refresh();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Usuarios y permisos (solo Admin)</h2>

      {/* Crear: solo nombre + contraseña -> username auto */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-medium text-sm">Crear usuario</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input
            placeholder="Nombre (ej Alejandro Quintero)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-sm"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-sm"
          />
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as Role)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            placeholder="Username manual (opcional)"
            value={customUser}
            onChange={(e) => setCustomUser(e.target.value)}
            className="h-9 px-3 rounded-lg bg-secondary border border-border text-sm"
          />
          <button
            onClick={doCreate}
            className="h-9 rounded-lg bg-accent text-accent-foreground text-sm font-medium"
          >
            Crear
          </button>
        </div>
        {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
      </div>

      {/* Lista + aprobar / rol / estado */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <h3 className="font-medium text-sm">
          Cuentas ({users.length}) — pendientes:{" "}
          {users.filter((u) => u.estado === "pendiente").length}
        </h3>
        {users.map((u) => (
          <div
            key={u.id}
            className="flex flex-wrap items-center gap-2 py-2 border-b border-border last:border-0 text-sm"
          >
            <b>{u.username}</b>
            <span className="text-muted-foreground">{u.nombre}</span>
            <button
              onClick={() => setShowPass((p) => ({ ...p, [u.id]: !p[u.id] }))}
              title={showPass[u.id] ? "Ocultar contraseña" : "Ver contraseña"}
              className="px-2 py-0.5 rounded bg-secondary text-xs font-mono"
            >
              {showPass[u.id] ? u.password : "••••••••"}
            </button>
            <span className="px-2 py-0.5 rounded bg-secondary text-xs">
              {u.rol}
            </span>
            <span className="px-2 py-0.5 rounded bg-secondary text-xs">
              {u.estado}
            </span>
            <div className="ml-auto flex gap-1 flex-wrap">
              {u.estado === "pendiente" && (
                <>
                  <button
                    onClick={() => {
                      setEstado(u.username, "activo");
                      refresh();
                    }}
                    className="px-2 h-7 rounded bg-green-600 text-white text-xs"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => {
                      removeUser(u.username);
                      refresh();
                    }}
                    className="px-2 h-7 rounded bg-red-600 text-white text-xs"
                  >
                    Rechazar
                  </button>
                </>
              )}
              <select
                value={u.rol}
                onChange={(e) => {
                  setRol(e.target.value as Role);
                  setUsers(setUserRol(u.username, e.target.value as Role));
                }}
                className="h-7 px-2 rounded bg-secondary border border-border text-xs"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {u.estado === "activo" ? (
                <button
                  onClick={() => {
                    setEstado(u.username, "inactivo");
                    refresh();
                  }}
                  className="px-2 h-7 rounded bg-secondary border border-border text-xs"
                >
                  Desactivar
                </button>
              ) : (
                u.estado === "inactivo" && (
                  <button
                    onClick={() => {
                      setEstado(u.username, "activo");
                      refresh();
                    }}
                    className="px-2 h-7 rounded bg-secondary border border-border text-xs"
                  >
                    Activar
                  </button>
                )
              )}
              <button
                onClick={() => {
                  const np = prompt(`Nueva contraseña para ${u.username}:`);
                  if (np) {
                    resetPassword(u.username, np);
                    refresh();
                  }
                }}
                className="px-2 h-7 rounded bg-secondary border border-border text-xs"
              >
                Reset pass
              </button>
              {u.username !== "qbomodular" && (
                <button
                  onClick={() => {
                    if (confirm(`Eliminar ${u.username}?`)) {
                      removeUser(u.username);
                      refresh();
                    }
                  }}
                  className="px-2 h-7 rounded text-red-500 text-xs"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Matriz acciones (las secciones visibles por rol se gestionan en Settings > Constructor) */}
      <div className="rounded-xl border border-border bg-card p-4 overflow-auto">
        <h3 className="font-medium text-sm mb-2">Acciones por rol</h3>
        <table className="text-xs w-full">
          <thead>
            <tr>
              <th className="text-left p-2">Acción</th>
              {ROLES.map((r) => (
                <th key={r} className="p-2">
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACTIONS.map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="p-2">{a.label}</td>
                {ROLES.map((r) => (
                  <td key={r} className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={r === "Admin" ? true : !!actions[r]?.[a.id]}
                      disabled={r === "Admin"}
                      onChange={() => toggleAction(r, a.id)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted-foreground mt-2">
          Admin siempre conserva todas las acciones. Las páginas sí se pueden
          ocultar (incluso para Admin, salvo Settings). Úsalo con{" "}
          <code>canView(rol, sección)</code> y <code>canDo(rol, acción)</code>.
        </p>
      </div>
    </div>
  );
}
