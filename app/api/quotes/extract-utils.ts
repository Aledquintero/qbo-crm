import { spawnSync } from "child_process";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

type PdfJsItem = { str?: string };
type PdfJsPage = { getTextContent: () => Promise<{ items: PdfJsItem[] }> };
type PdfJsDoc = { numPages: number; getPage: (n: number) => Promise<PdfJsPage> };

/**
 * Extracción optimizada para PDFs DIGITALES del mismo formato (presupuestos QBO).
 * - Prioridad a pdfjs (texto digital, alta resolución, funciona en Vercel).
 * - pdftotext solo como fallback opcional (binario externo, no siempre instalado).
 * - Nunca devuelve binario como texto: si no hay texto, lanza error.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  // 1) pdfjs: todas las páginas (los presupuestos pueden traer anexo de contrato)
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = (pdfjs as unknown as { getDocument: (o: unknown) => { promise: Promise<PdfJsDoc> } }).getDocument({
      data: new Uint8Array(buffer),
    });
    const pdf = await loadingTask.promise;
    const lines: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      lines.push(content.items.map((item) => item.str ?? "").join(" "));
    }
    const text = lines.join("\n").trim();
    if (text.length > 50) return text;
  } catch {
    // cae al fallback
  }

  // 2) pdftotext fallback (sin shell: args separados, sin interpolación)
  const tmpDir = mkdtempSync(join(tmpdir(), "pdf-"));
  const pdfPath = join(tmpDir, "input.pdf");
  const txtPath = join(tmpDir, "output.txt");
  try {
    writeFileSync(pdfPath, buffer);
    const r = spawnSync("pdftotext", ["-layout", pdfPath, txtPath], { timeout: 10000 });
    if (r.status === 0) {
      const text = readFileSync(txtPath, "utf-8").trim();
      if (text.length > 50) return text;
    }
  } catch {
    // binario no instalado: se ignora
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }

  throw new Error("No se pudo extraer texto digital del PDF (¿es escaneado o está vacío?).");
}

export function extractField(text: string, patterns: RegExp[]): string {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1].trim();
  }
  return "";
}

export function extractNumber(text: string, patterns: RegExp[]): number | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return parseNumber(m[1]);
  }
  return null;
}

/** Formato chileno 1.234.567 (puntos miles, coma decimal opcional). */
export function parseNumber(s: string): number | null {
  const t = s.trim().replace(/\$/g, "").replace(/\s/g, "");
  // 1.234.567,89 -> 1234567.89 | 1.234.567 -> 1234567 | 1234,56 -> 1234.56
  const cleaned = t.includes(",")
    ? t.replace(/\./g, "").replace(",", ".")
    : t.replace(/\./g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : Math.round(n);
}

export function extractFolioFromFilename(name: string): string {
  const m = name.match(/(\d{4,})/);
  return m ? m[1] : "";
}
