import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { Fabricante } from "./fabricante";

export type ContractQuoteInput = {
  numero: string | null;
  fecha: string | null;
  neto: number | null;
  iva: number | null;
  total: number | null;
};

export type ContractInput = {
  fabricante: Fabricante;
  fecha: Date;
  clienteNombre: string;
  clienteRut: string; // ya formateado ("27.174.333-5")
  direccion: string;
  quotes: ContractQuoteInput[];
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function fechaLarga(d: Date): string {
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function money(n: number | null | undefined): string {
  const v = Math.round(n ?? 0);
  return `$${String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

type Run = { text: string; bold: boolean };

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 56;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 56;
const BODY_SIZE = 10.5;
const LINE_H = 15;
const INK = rgb(0.12, 0.12, 0.12);

class Writer {
  doc!: PDFDocument;
  regular!: PDFFont;
  bold!: PDFFont;
  page!: PDFPage;
  y = 0;

  static async create() {
    const w = new Writer();
    w.doc = await PDFDocument.create();
    w.regular = await w.doc.embedFont(StandardFonts.Helvetica);
    w.bold = await w.doc.embedFont(StandardFonts.HelveticaBold);
    w.newPage();
    return w;
  }

  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN_TOP;
  }

  ensure(space: number) {
    if (this.y - space < MARGIN_BOTTOM) this.newPage();
  }

  widthOf(text: string, bold: boolean, size: number): number {
    return (bold ? this.bold : this.regular).widthOfTextAtSize(text, size);
  }

  /** Párrafo con tramos normal/negrita y ajuste de línea. */
  paragraph(runs: Run[], opts: { size?: number; centered?: boolean; gapAfter?: number } = {}) {
    const size = opts.size ?? BODY_SIZE;
    const maxW = PAGE_W - MARGIN_X * 2;
    // Aplana a palabras conservando estilo.
    const words: Run[] = [];
    for (const run of runs) {
      for (const part of run.text.split(/(\s+)/)) {
        if (part === "") continue;
        words.push({ text: part, bold: run.bold });
      }
    }
    const lines: Run[][] = [];
    let line: Run[] = [];
    let lineW = 0;
    for (const w of words) {
      if (/^\s+$/.test(w.text)) {
        line.push(w);
        lineW += this.widthOf(w.text, w.bold, size);
        continue;
      }
      const ww = this.widthOf(w.text, w.bold, size);
      if (lineW + ww > maxW && line.length > 0) {
        lines.push(line);
        line = [w];
        lineW = ww;
      } else {
        line.push(w);
        lineW += ww;
      }
    }
    if (line.length > 0) lines.push(line);

    for (const ln of lines) {
      this.ensure(LINE_H);
      const total = ln.reduce((s, w) => s + this.widthOf(w.text, w.bold, size), 0);
      let x = opts.centered ? (PAGE_W - total) / 2 : MARGIN_X;
      for (const w of ln) {
        this.page.drawText(w.text, {
          x, y: this.y, size,
          font: w.bold ? this.bold : this.regular,
          color: INK,
        });
        x += this.widthOf(w.text, w.bold, size);
      }
      this.y -= LINE_H;
    }
    this.y -= opts.gapAfter ?? 8;
  }

  title(text: string) {
    this.paragraph([{ text, bold: true }], { size: 13, centered: true, gapAfter: 14 });
  }

  clause(head: string, body: string | Run[]) {
    const runs: Run[] = [
      { text: head + " ", bold: true },
      ...(typeof body === "string" ? [{ text: body, bold: false }] : body),
    ];
    this.paragraph(runs, { gapAfter: 8 });
  }

  table(header: string[], rows: string[][], boldLastRow: boolean) {
    const xs = [MARGIN_X, 170, 300, 390, 480];
    const size = 10;
    const rowH = 16;
    const drawRow = (cells: string[], isBold: boolean, lineAbove: boolean) => {
      this.ensure(rowH + 4);
      if (lineAbove) {
        this.page.drawLine({
          start: { x: MARGIN_X, y: this.y + 4 },
          end: { x: PAGE_W - MARGIN_X, y: this.y + 4 },
          thickness: 0.7, color: rgb(0.4, 0.4, 0.4),
        });
      }
      cells.forEach((c, i) => {
        const font = isBold ? this.bold : this.regular;
        const w = font.widthOfTextAtSize(c, size);
        // Números alineados a la derecha dentro de su columna.
        const rightAligned = i >= 2;
        const colW = (i === 0 ? 114 : 90);
        const x = rightAligned ? xs[i] + colW - w : xs[i];
        this.page.drawText(c, { x, y: this.y - 8, size, font, color: INK });
      });
      this.y -= rowH;
    };
    drawRow(header, true, false);
    this.page.drawLine({
      start: { x: MARGIN_X, y: this.y + 6 },
      end: { x: PAGE_W - MARGIN_X, y: this.y + 6 },
      thickness: 0.7, color: rgb(0.4, 0.4, 0.4),
    });
    rows.forEach((r, i) => drawRow(r, boldLastRow && i === rows.length - 1, false));
    this.y -= 6;
  }

  signatures() {
    this.ensure(90);
    const y0 = this.y;
    const cols = [MARGIN_X, PAGE_W / 2 + 10];
    for (const x of cols) {
      this.page.drawText(x === cols[0] ? "EL FABRICANTE" : "EL CLIENTE", {
        x, y: y0, size: BODY_SIZE, font: this.bold, color: INK,
      });
      this.page.drawText("Firma: ___________________________", {
        x, y: y0 - 28, size: BODY_SIZE, font: this.regular, color: INK,
      });
    }
    this.y = y0 - 52;
  }
}

/** Genera el PDF del contrato con el formato estándar. Devuelve los bytes. */
export async function generateContractPdf(input: ContractInput): Promise<Uint8Array> {
  const { fabricante: f, fecha, clienteNombre, clienteRut, direccion, quotes } = input;
  const w = await Writer.create();
  const total = quotes.reduce((s, q) => s + (q.total ?? 0), 0);
  const nums = quotes.map((q) => q.numero ?? "S/N");
  const presupuestosRef =
    nums.length === 1
      ? `el Presupuesto N°${nums[0]}`
      : `los Presupuestos ${nums.map((n) => `N°${n}`).join(" y ")}`;

  w.title("CONTRATO DE FABRICACIÓN DE MUEBLES A MEDIDA");

  w.paragraph([
    { text: `En ${f.ciudad}, a `, bold: false },
    { text: fechaLarga(fecha), bold: true },
    { text: `, comparecen: `, bold: false },
    { text: f.razonSocial, bold: true },
    { text: `, RUT `, bold: false },
    { text: f.rut, bold: true },
    { text: `, con domicilio en `, bold: false },
    { text: `${f.domicilio}, ${f.region}`, bold: true },
    { text: `, representada para estos efectos por `, bold: false },
    { text: f.representante, bold: true },
    { text: `, RUT `, bold: false },
    { text: f.rutRepresentante, bold: true },
    { text: `, quien en adelante se denominará \u201C`, bold: false },
    { text: "EL FABRICANTE", bold: true },
    { text: `\u201D; y por la otra parte, `, bold: false },
    { text: clienteNombre, bold: true },
    { text: `, RUT `, bold: false },
    { text: clienteRut, bold: true },
    { text: `, quien en adelante se denominará \u201C`, bold: false },
    { text: "EL CLIENTE", bold: true },
    { text: `\u201D.`, bold: false },
  ]);

  w.paragraph([
    { text: "Ambas partes acuerdan celebrar el presente ", bold: false },
    { text: "Contrato de Fabricación de Muebles a Medida", bold: true },
    { text: ", el cual se regirá por las siguientes cláusulas:", bold: false },
  ]);

  w.clause(
    "PRIMERA: Objeto del contrato.",
    [
      { text: "EL FABRICANTE se obliga a fabricar, suministrar e instalar los muebles descritos en ", bold: false },
      { text: presupuestosRef, bold: true },
      { text: ", el cual forma parte integrante del presente contrato, conforme a las especificaciones técnicas, medidas, materiales y terminaciones allí indicadas. EL CLIENTE acepta expresamente dichas especificaciones.", bold: false },
    ]
  );
  w.clause(
    "SEGUNDA: Dirección de entrega e instalación.",
    [
      { text: "La fabricación, entrega e instalación de los muebles se realizará en el domicilio ubicado en ", bold: false },
      { text: direccion, bold: true },
      { text: ", o en la dirección que EL CLIENTE indique por escrito antes del inicio de la fabricación.", bold: false },
    ]
  );
  w.clause(
    "TERCERA: Plazo de fabricación e instalación.",
    [
      { text: "El plazo de fabricación e instalación será de ", bold: false },
      { text: `${f.plazoDias} días corridos`, bold: true },
      { text: ", contados desde la fecha en que EL FABRICANTE reciba el ", bold: false },
      { text: "abono inicial", bold: true },
      { text: ", el cual será considerado como ", bold: false },
      { text: "Orden de Producción", bold: true },
      { text: ". Este plazo podrá extenderse por causas de fuerza mayor, atrasos en la entrega de materiales por proveedores o modificaciones solicitadas por EL CLIENTE.", bold: false },
    ]
  );
  w.clause(
    "CUARTA: Precio.",
    [
      { text: "El valor total del presente contrato asciende a la suma de ", bold: false },
      { text: money(total), bold: true },
      { text: ", monto que incluye fabricación e instalación, conforme al Presupuesto.", bold: false },
    ]
  );
  w.clause(
    "QUINTA: Forma de pago.",
    [
      { text: "EL CLIENTE pagará el precio de la siguiente manera: a) ", bold: false },
      { text: "50% del valor total", bold: true },
      { text: " como abono inicial, el cual constituye la Orden de Producción. b) ", bold: false },
      { text: "50% restante", bold: true },
      { text: " al momento de la entrega e instalación conforme de los muebles. EL FABRICANTE no estará obligado a iniciar la fabricación ni a realizar la instalación sin la recepción efectiva del pago correspondiente.", bold: false },
    ]
  );
  w.clause(
    "SEXTA: Costos de producción.",
    "Todos los costos asociados a la producción, incluyendo materiales y mano de obra, serán de cargo exclusivo de EL FABRICANTE, conforme a las especificaciones acordadas."
  );
  w.clause(
    "SÉPTIMA: Obligaciones del Fabricante.",
    "EL FABRICANTE se obliga a: a) Fabricar los muebles conforme a las especificaciones del Presupuesto. b) Utilizar los materiales indicados y aplicar buenas prácticas de fabricación. c) Cumplir con el plazo de entrega establecido, salvo las excepciones señaladas en este contrato. d) Realizar la instalación de los muebles de forma correcta y segura."
  );
  w.clause(
    "OCTAVA: Obligaciones del Cliente.",
    "EL CLIENTE se obliga a: a) Realizar los pagos en los plazos y formas pactados. b) Otorgar acceso expedito al lugar de instalación en la fecha acordada. c) Revisar los muebles al momento de la entrega e instalación y manifestar cualquier observación en ese momento. d) No solicitar modificaciones una vez iniciada la fabricación, salvo acuerdo escrito y reajuste de precio y plazo."
  );
  w.clause(
    "NOVENA: Autonomía contractual.",
    "EL FABRICANTE actúa de manera independiente y autónoma, sin existir vínculo laboral alguno con EL CLIENTE, limitándose sus derechos y obligaciones a los establecidos en el presente contrato."
  );
  w.clause(
    "DÉCIMA: Garantía.",
    [
      { text: "EL FABRICANTE otorga una ", bold: false },
      { text: `garantía de ${f.garantiaMeses} meses`, bold: true },
      { text: " por defectos de fabricación en los muebles y cubiertas de cuarzo o granito, contados desde la fecha de entrega. La garantía ", bold: false },
      { text: "no cubre", bold: true },
      { text: " daños por mal uso, humedad, golpes, desgaste natural, ni la instalación de lavaplatos, electrodomésticos u otros artefactos no fabricados por EL FABRICANTE.", bold: false },
    ]
  );

  w.paragraph([{ text: "ANEXO A: PRESUPUESTOS QUE FORMAN PARTE INTEGRANTE DEL CONTRATO.", bold: true }]);
  w.table(
    ["Presupuesto", "Fecha", "Neto", "IVA", "Total"],
    [
      ...quotes.map((q) => [
        q.numero ?? "S/N",
        q.fecha ?? "—",
        money(q.neto),
        money(q.iva),
        money(q.total),
      ]),
      ["TOTAL", "", "", "", money(total)],
    ],
    true
  );

  w.clause(
    "DÉCIMA PRIMERA: Aceptación.",
    "Leído el presente contrato, las partes declaran estar conformes y lo firman en dos ejemplares del mismo tenor y fecha."
  );
  w.signatures();

  return w.doc.save();
}
