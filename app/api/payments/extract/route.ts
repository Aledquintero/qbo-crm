import { NextRequest, NextResponse } from "next/server";
import Tesseract from "tesseract.js";

function extractField(text: string, patterns: RegExp[]): string {
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

function extractNumber(text: string, patterns: RegExp[]): number | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) {
      const cleaned = m[1].replace(/[^0-9.,]/g, "").replace(/\./g, "").replace(",", ".");
      const n = parseFloat(cleaned);
      if (!isNaN(n)) return n;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió el archivo" }, { status: 400 });
    }

    const arrayBuf = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuf);

    const { data } = await Tesseract.recognize(buf, "spa", {
      logger: () => {},
    });

    const text = data.text;
    console.log(`Payment receipt OCR: file=${file.name}, textLen=${text.length}`);

    const monto = extractNumber(text, [
      /(?:monto|total|valor)\s*[:$]\s*([0-9.,]+)/i,
      /(?:monto|total|valor)\s+([0-9.,]+)/i,
      /\$\s*([0-9.,]+)/,
      /([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]+))/,
    ]);

    const fecha = extractField(text, [
      /(?:fecha|fec|emisi[oó]n)\s*[:.]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
      /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,
    ]);

    const pagadoPor = extractField(text, [
      /(?:remitente|ordenante|deudor|pagad[oó] por|cliente)\s*[:.]?\s*(.+)/i,
      /(?:nombre|titular)\s*[:.]?\s*(.+)/i,
    ]);

    const numTransferencia = extractField(text, [
      /(?:n[°º]?\s*(?:de\s*)?transferencia|folio|comprobante|operaci[oó]n)\s*[:.]?\s*([\w\d-]+)/i,
      /(?:n[°º]?\s*|id\s*|nro\s*)[:.]?\s*(\d{6,})/i,
    ]);

    return NextResponse.json({
      monto,
      fecha,
      pagado_por: pagadoPor,
      num_transferencia: numTransferencia,
      text: text.slice(0, 2000),
    });
  } catch (e) {
    console.error("Payment extract error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al procesar el comprobante" },
      { status: 500 }
    );
  }
}
