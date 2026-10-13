import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateId } from "@/lib/api";

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("project_id") as string | null;
    const extractedJson = formData.get("extracted") as string | null;

    if (!file || !projectId || !extractedJson) {
      return NextResponse.json({ error: "file, project_id, and extracted are required" }, { status: 400 });
    }

    const extracted = JSON.parse(extractedJson);
    const id = await generateId("QUO");
    const storagePath = `${projectId}/quotes/${id}_${file.name}`;
    const arrayBuf = await file.arrayBuffer();

    const { error: uploadError } = await serviceClient.storage
      .from("project-files")
      .upload(storagePath, arrayBuf, { upsert: true, contentType: file.type });

    if (uploadError) throw new Error("Error subiendo archivo: " + uploadError.message);

    const { data, error: insertError } = await serviceClient
      .from("quotes")
      .insert({
        id,
        project_id: projectId,
        filename: file.name,
        storage_path: storagePath,
        numero: extracted.numero || null,
        fecha: extracted.fecha || null,
        neto: extracted.neto ?? null,
        iva: extracted.iva ?? null,
        total: extracted.total ?? null,
      })
      .select()
      .single();

    if (insertError) {
      await serviceClient.storage.from("project-files").remove([storagePath]);
      throw new Error("Error guardando datos: " + insertError.message);
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("Quote creation error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
