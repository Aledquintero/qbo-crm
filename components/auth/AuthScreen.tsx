"use client";

import { useState } from "react";
import { login } from "@/lib/auth/store";
import type { Session } from "@/lib/auth/types";

export function AuthScreen({ onAuth }: { onAuth: (s: Session) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const doLogin = async () => {
    if (busy) return;
    setMsg(null);
    setBusy(true);
    try {
      const r = await login(username, password);
      if (!r.ok) setMsg(r.error);
      else onAuth(r.session);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">QBO modular</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa con tu nombre de usuario
          </p>
        </div>

        <div className="space-y-3">
          <input
            placeholder="Usuario (ej aquintero)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-accent"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doLogin()}
            className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-accent"
          />
          <button
            onClick={doLogin}
            disabled={busy}
            className="w-full h-10 rounded-lg bg-accent text-accent-foreground text-sm font-medium disabled:opacity-60"
          >
            {busy ? "Entrando…" : "Entrar"}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            ¿Sin cuenta? Pide al Admin que cree tu usuario.
          </p>
        </div>

        {msg && (
          <p className="text-sm text-red-500 text-center">{msg}</p>
        )}
      </div>
    </div>
  );
}
