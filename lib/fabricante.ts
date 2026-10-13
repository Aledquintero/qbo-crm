export type Fabricante = {
  razonSocial: string;
  rut: string;
  domicilio: string;
  ciudad: string;
  region: string;
  representante: string;
  rutRepresentante: string;
  plazoDias: number;
  garantiaMeses: number;
};

export const FABRICANTE_DEFAULTS: Fabricante = {
  razonSocial: "AL QBO SpA",
  rut: "77.182.605-9",
  domicilio: "Andrés Murillo 1499, La Serena",
  ciudad: "La Serena",
  region: "Región de Coquimbo",
  representante: "Alejandro Alfonso Quintero Rivero",
  rutRepresentante: "27.174.219-3",
  plazoDias: 20,
  garantiaMeses: 6,
};

const KEY = "qbo-fabricante";

export function loadFabricante(): Fabricante {
  if (typeof window === "undefined") return FABRICANTE_DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return FABRICANTE_DEFAULTS;
    return { ...FABRICANTE_DEFAULTS, ...(JSON.parse(raw) as Partial<Fabricante>) };
  } catch {
    return FABRICANTE_DEFAULTS;
  }
}

export function saveFabricante(f: Fabricante) {
  localStorage.setItem(KEY, JSON.stringify(f));
}

/** "271743335" o "27.174.333-5" -> "27.174.333-5" (verifica/calcula DV con módulo 11). */
export function formatRut(rut: string | null | undefined): string {
  if (!rut) return "—";
  const clean = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 7) return rut;
  const body = clean.slice(0, -1);
  const given = clean.slice(-1);
  const computed = computeDv(body);
  const dv = computed === given ? given : computed;
  const grouped = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${grouped}-${dv}`;
}

function computeDv(num: string): string {
  let sum = 0;
  let mult = 2;
  for (let i = num.length - 1; i >= 0; i--) {
    sum += parseInt(num[i], 10) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const r = 11 - (sum % 11);
  if (r === 11) return "0";
  if (r === 10) return "K";
  return String(r);
}
