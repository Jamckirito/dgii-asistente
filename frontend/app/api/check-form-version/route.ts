import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const DGII_FORM_URLS: Record<string, string> = {
  "606": "https://dgii.gov.do/herramientas/formularios/formatoEnvioDatos/Documents/Formato606.zip",
  "607": "https://dgii.gov.do/herramientas/formularios/formatoEnvioDatos/Documents/Formato607.zip",
};

export async function GET(req: NextRequest) {
  const form = req.nextUrl.searchParams.get("form") ?? "606";
  const url = DGII_FORM_URLS[form];

  if (!url) {
    return NextResponse.json({ error: "Formulario no soportado" }, { status: 400 });
  }

  try {
    // HEAD request para obtener Last-Modified sin descargar el archivo
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
    const lastModified = res.headers.get("last-modified") ?? "";
    const contentLength = res.headers.get("content-length") ?? "";

    // Comparar con la versión guardada en Supabase
    const supabase = await createServerClient();
    const { data: saved } = await supabase
      .from("form_versions")
      .select("last_modified, content_length")
      .eq("form_id", form)
      .single();

    const updated =
      saved?.last_modified !== lastModified ||
      saved?.content_length !== contentLength;

    if (updated && lastModified) {
      // Actualizar registro
      await supabase.from("form_versions").upsert({
        form_id: form,
        last_modified: lastModified,
        content_length: contentLength,
        checked_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      updated,
      date: lastModified ? new Date(lastModified).toLocaleDateString("es-DO") : null,
      form,
    });
  } catch (err) {
    console.error("Error verificando versión DGII:", err);
    return NextResponse.json({ error: "No se pudo conectar con dgii.gov.do" }, { status: 502 });
  }
}
