import { NextRequest, NextResponse } from "next/server";
import { extractPdfText, extractField, extractNumber, parseNumber, extractFolioFromFilename } from "../extract-utils";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió el archivo" }, { status: 400 });
    }

    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    if (buffer.length === 0) {
      return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 });
    }

    const text = await extractPdfText(buffer);
    console.log(`PDF extract: file=${file.name}, size=${buffer.length}, textLen=${text.length}`);

    const numero = extractField(text, [
      /presupuesto\s*#\s*([\w\d\-.\\/]+)/i,
      /presupuesto\s*n[°º]?\s*[:\s]*([\w\d\-.\\/]+)/i,
      /cotizacion\s*n[°º]?\s*[:\s]*([\w\d\-.\\/]+)/i,
      /n[°º]\s*(?:presupuesto|cotizacion|folio|pedido)\s*[:\s]*([\w\d\-\\/]+)/i,
      /folio\s*[:\s]*n[°º]?\s*([\w\d\-.\\/]+)/i,
      /folio\s*[:\s]*([\w\d\-.\\/]+)/i,
      /documento\s*[:\s]*n[°º]?\s*([\w\d\-.\\/]+)/i,
      /documento\s*[:\s]*([\w\d\-.\\/]+)/i,
      /numero\s*[:\s]*([\w\d\-\\/]+)/i,
      /nro\.?\s*[:\s]*([\w\d\-\\/]+)/i,
      /(?:^|\n)\s*n[°º]\s*([\d]+)/m,
      /presupuesto[:\s]*([\d]{4,})/i,
    ]) || extractFolioFromFilename(file.name);

    const fecha = extractField(text, [
      /fecha\s*[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /emision\s*[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /(\d{2}[/-]\d{2}[/-]\d{4})/,
    ]) || "";

    let neto = extractNumber(text, [
      /neto\s*\$?\s*([\d.,]+)/i,
      /monto\s*neto\s*\$?\s*([\d.,]+)/i,
    ]);

    let iva = extractNumber(text, [
      /i\.v\.a\.\s*\d{1,3}%\s*\$?\s*([\d.,]+)/i,
      /iva\s*\d{1,3}%\s*\$?\s*([\d.,]+)/i,
      /i\.v\.a\.\s*[:\s]*\$?\s*([\d.,]+)/i,
      /iva\s*[:\s]*\$?\s*([\d.,]+)/i,
      /iva\s*\$?\s*([\d.,]+)/i,
      /impuesto\s*\$?\s*([\d.,]+)/i,
    ]);

    let total = extractNumber(text, [
      /total\s*\$?\s*([\d.,]+)/i,
      /gran\s*total\s*\$?\s*([\d.,]+)/i,
      /monto\s*total\s*\$?\s*([\d.,]+)/i,
    ]);

    if (iva === null && neto !== null && total !== null) {
      iva = total - neto;
    }

    if (total === null && neto === null) {
      const allNumbers = [...text.matchAll(/\$?\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g)]
        .map((m) => parseNumber(m[1]))
        .filter((n): n is number => n !== null && n > 1000)
        .sort((a, b) => b - a);
      total = allNumbers[0] ?? null;
    }

    return NextResponse.json({ numero, fecha, neto, iva, total, filename: file.name, text: text.slice(0, 2000) });
  } catch (e) {
    console.error("Extraction error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
