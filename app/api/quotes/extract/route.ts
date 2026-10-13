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
    if (buffer.length > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF muy grande (máx 15 MB)" }, { status: 400 });
    }
    if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Solo se aceptan PDFs" }, { status: 400 });
    }
    if (buffer.subarray(0, 4).toString() !== "%PDF") {
      return NextResponse.json({ error: "El archivo no es un PDF válido" }, { status: 400 });
    }

    const text = await extractPdfText(buffer);

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
      // Tabla ANEXO: "241897 23/01/2026 $0 $0 $235.850 TOTAL $235.850"
      /total\s*\$?\s*([\d.]+)\s*$/im,
    ]);

    if (iva === null && neto !== null && total !== null) {
      iva = total - neto;
    }
    // Validación: si neto+iva no cuadra con total (±$1 por redondeo), desconfiar del iva inventado
    let confidence: "alta" | "media" | "baja" = "alta";
    if (neto !== null && iva !== null && total !== null) {
      if (Math.abs(neto + iva - total) > 1) confidence = "media";
    } else if (numero === "" || total === null) {
      confidence = "baja";
    }

    return NextResponse.json({ numero, fecha, neto, iva, total, confidence, filename: file.name });
  } catch (e) {
    console.error("Extraction error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
