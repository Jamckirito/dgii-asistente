import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FileText, AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function RevisionPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Consultar documentos en estado 'pendiente_revision'
  const { data: documentos } = await supabase
    .from("documentos")
    .select(`
      id,
      nombre_archivo,
      tipo_documento,
      formato_sugerido,
      estado,
      tamano_bytes,
      creado_en,
      empresas ( rnc, nombre )
    `)
    .eq("estado", "pendiente_revision")
    .order("creado_en", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/30">
              HUMAN-IN-THE-LOOP
            </span>
            <span className="text-xs text-neutral-500">Validación y Aprobación Fiscal</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">Documentos Pendientes de Revisión</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Comprobantes con campos dudosos, discrepancias de impuestos o alertas fiscales que requieren validación contable antes del envío a la DGII.
          </p>
        </div>
      </div>

      {/* Lista de Documentos */}
      {!documentos || documentos.length === 0 ? (
        <div className="border border-dashed border-neutral-800 rounded-xl p-16 text-center bg-neutral-900/20">
          <ShieldCheck className="w-12 h-12 text-emerald-500/80 mx-auto mb-3" />
          <p className="text-neutral-300 font-medium">Bandeja de revisión al día</p>
          <p className="text-xs text-neutral-500 mt-1">
            No tienes documentos con advertencias o campos pendientes de confirmar.
          </p>
        </div>
      ) : (
        <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/70 text-xs text-neutral-400">
                <th className="px-4 py-3 text-left font-semibold">Comprobante</th>
                <th className="px-4 py-3 text-left font-semibold">Formato Sugerido</th>
                <th className="px-4 py-3 text-left font-semibold">Tipo Documento</th>
                <th className="px-4 py-3 text-left font-semibold">Fecha Carga</th>
                <th className="px-4 py-3 text-right font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {documentos.map((doc) => (
                <tr key={doc.id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
                      <div className="truncate max-w-xs">
                        <p className="font-medium text-neutral-200 truncate">{doc.nombre_archivo}</p>
                        <p className="text-[11px] text-neutral-500">{(doc.tamano_bytes / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/40">
                      DGII {doc.formato_sugerido}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-400 capitalize">
                    {doc.tipo_documento.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500 font-mono">
                    {new Date(doc.creado_en).toLocaleDateString("es-DO")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/revision/${doc.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                    >
                      <span>Revisar</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
