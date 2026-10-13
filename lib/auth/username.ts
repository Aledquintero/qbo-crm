// Generación de username: "Alejandro Quintero" -> "aquintero"
// Regla: inicial primer nombre + primer apellido, normalizado, único con sufijo numérico.

export function normalizeToken(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos y virgulilla (ñ -> n)
    .replace(/[^a-z0-9]/g, "");
}

export function baseUsernameFromNombre(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "usuario";
  if (parts.length === 1) return normalizeToken(parts[0]) || "usuario";
  const first = normalizeToken(parts[0]);
  const last = normalizeToken(parts[parts.length - 1]);
  const base = `${first.charAt(0)}${last}`;
  return base || "usuario";
}

export function uniqueUsername(base: string, taken: Set<string>): string {
  const clean = normalizeToken(base) || "usuario";
  if (!taken.has(clean)) return clean;
  let i = 1;
  while (taken.has(`${clean}${i}`)) i++;
  return `${clean}${i}`;
}

export function generateUsername(nombre: string, existing: string[]): string {
  return uniqueUsername(
    baseUsernameFromNombre(nombre),
    new Set(existing.map((u) => u.toLowerCase()))
  );
}
