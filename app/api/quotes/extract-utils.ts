import { execSync } from "child_process";
import { writeFileSync, unlinkSync, readFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const tmpDir = mkdtempSync(join(tmpdir(), "pdf-"));
  const pdfPath = join(tmpDir, "input.pdf");
  const txtPath = join(tmpDir, "output.txt");

  try {
    writeFileSync(pdfPath, buffer);

    try {
      execSync(`pdftotext -layout "${pdfPath}" "${txtPath}"`, { timeout: 10000, stdio: "pipe" });
      const text = readFileSync(txtPath, "utf-8");
      if (text.trim().length > 0) return text;
    } catch {}

    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      const lines: string[] = [];
      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        lines.push(content.items.map((item: any) => item.str).join(" "));
      }
      if (lines.length > 0) return lines.join("\n");
    } catch {}

    return buffer.toString("utf-8");
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
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

export function parseNumber(s: string): number | null {
  const cleaned = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : Math.round(n);
}

export function extractFolioFromFilename(name: string): string {
  const m = name.match(/(\d{4,})/);
  return m ? m[1] : "";
}
