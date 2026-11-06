import { createServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { SideBySideViewer } from "@/components/review/side-by-side-viewer";
import { DocumentoFiscalProcesado } from "@/types/fiscal-document";
import { obtenerUrlFirmada } from "@/lib/storage/supabase-storage";

export default async function DetalleRevisionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: docDb } = await supabase
    .from("documentos")
    .select("*")
    .eq("id", id)
    .single();

  if (!docDb) notFound();

  let signedFileUrl: string | undefined;
  if (docDb.storage_path) {
    try {
      signedFileUrl = await obtenerUrlFirmada(docDb.storage_path);
    } catch (e) {
      console.warn("No se pudo obtener URL firmada de storage:", e);
    }
  }

  // Convertir registro DB a DocumentoFiscalProcesado
  const docProcesado: DocumentoFiscalProcesado = docDb.metadatos_extraccion || {
    id: docDb.id,
    empresa_id: docDb.empresa_id,
    user_id: docDb.user_id,
    nombre_archivo: docDb.nombre_archivo,
    tamano_bytes: docDb.tamano_bytes,
    hash_sha256: docDb.hash_sha256,
    storage_path: docDb.storage_path,
    tipo_documento: docDb.tipo_documento,
    formato_sugerido: docDb.formato_sugerido || "606",
    estado_general: docDb.estado,
    advertencias: [],
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <SideBySideViewer
        documento={docProcesado}
        fileUrl={signedFileUrl}
      />
    </div>
  );
}
