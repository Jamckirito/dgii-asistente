"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X, Eye, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { DocumentoFiscalProcesado } from "@/types/fiscal-document";
import { procesarDocumentoLocal } from "@/lib/fiscal/document-processor";
import { SideBySideViewer } from "@/components/review/side-by-side-viewer";
import { subirComprobantePrivado } from "@/lib/storage/supabase-storage";

interface BatchUploadModalProps {
  empresaId: string;
  rncEmpresa?: string;
  empresaRnc?: string;
  isOpen: boolean;
  onClose: () => void;
  onDocumentoAprobado?: (doc: DocumentoFiscalProcesado) => Promise<void> | void;
  onDocumentsProcessed?: (docs: DocumentoFiscalProcesado[]) => void;
}

interface ArchivoEnCola {
  file: File;
  progreso: number;
  estadoMsg: string;
  estado: "pendiente" | "procesando" | "completado" | "error";
  resultado?: DocumentoFiscalProcesado;
  errorMsg?: string;
}

export function BatchUploadModal({
  empresaId,
  rncEmpresa,
  empresaRnc,
  isOpen,
  onClose,
  onDocumentoAprobado,
  onDocumentsProcessed,
}: BatchUploadModalProps) {
  const effectiveRnc = rncEmpresa || empresaRnc || "101000000";
  const [archivos, setArchivos] = useState<ArchivoEnCola[]>([]);
  const [docEnRevision, setDocEnRevision] = useState<{ doc: DocumentoFiscalProcesado; file: File } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const nuevos: ArchivoEnCola[] = acceptedFiles.map((file) => ({
      file,
      progreso: 0,
      estadoMsg: "En cola",
      estado: "pendiente",
    }));

    setArchivos((prev) => [...prev, ...nuevos]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 20 * 1024 * 1024,
  });

  async function procesarTodos() {
    for (let i = 0; i < archivos.length; i++) {
      const item = archivos[i];
      if (item.estado === "completado") continue;

      setArchivos((prev) =>
        prev.map((a, idx) =>
          idx === i ? { ...a, estado: "procesando", estadoMsg: "Iniciando procesamiento local..." } : a
        )
      );

      try {
        const resultado = await procesarDocumentoLocal(
          item.file,
          empresaId,
          effectiveRnc,
          (prog, msg) => {
            setArchivos((prev) =>
              prev.map((a, idx) => (idx === i ? { ...a, progreso: prog, estadoMsg: msg } : a))
            );
          }
        );

        // Subir al bucket privado en segundo plano si está disponible
        try {
          const periodo = resultado.comprobante.fecha_emision.valor.substring(0, 7).replace("-", "") || "202603";
          const storageRes = await subirComprobantePrivado(item.file, empresaId, periodo);
          resultado.storage_path = storageRes.storagePath;
          resultado.hash_sha256 = storageRes.sha256;
        } catch {
          // Continuar aunque no haya conexión a Supabase Storage en local
        }

        setArchivos((prev) =>
          prev.map((a, idx) =>
            idx === i ? { ...a, estado: "completado", progreso: 100, estadoMsg: "Listo", resultado } : a
          )
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error al procesar comprobante";
        setArchivos((prev) =>
          prev.map((a, idx) =>
            idx === i ? { ...a, estado: "error", estadoMsg: "Error", errorMsg: msg } : a
          )
        );
      }
    }
    toast.success("Lote de comprobantes procesado.");
  }

  function handleImportarTodosCompletados() {
    const listos = archivos
      .filter((a) => a.estado === "completado" && a.resultado)
      .map((a) => a.resultado!);

    if (listos.length === 0) {
      toast.warning("No hay comprobantes completados para importar.");
      return;
    }

    if (onDocumentsProcessed) {
      onDocumentsProcessed(listos);
    } else if (onDocumentoAprobado) {
      listos.forEach((d) => onDocumentoAprobado(d));
    }
    toast.success(`${listos.length} comprobantes incorporados a la declaración.`);
    onClose();
  }

  if (!isOpen) return null;

  const completadosCount = archivos.filter((a) => a.estado === "completado").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/50">
          <div>
            <h2 className="text-base font-bold text-neutral-100">
              {docEnRevision ? "Revisión Detallada de Comprobante" : "Carga Inteligente de Documentos Fiscales"}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {docEnRevision
                ? "Verifica los datos extraídos contra el documento original"
                : "PDFs y fotografías escaneadas (procesamiento seguro en navegador)"}
            </p>
          </div>
          <button
            onClick={() => {
              if (docEnRevision) setDocEnRevision(null);
              else onClose();
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {docEnRevision ? (
            <SideBySideViewer
              documento={docEnRevision.doc}
              file={docEnRevision.file}
              onGuardarAprobado={async (docActualizado) => {
                await onDocumentoAprobado?.(docActualizado);
                toast.success("Documento aprobado y registrado en la declaración.");
                setDocEnRevision(null);
              }}
              onRechazar={(id) => {
                setArchivos((prev) => prev.filter((a) => a.resultado?.id !== id));
                setDocEnRevision(null);
                toast.info("Documento descartado.");
              }}
            />
          ) : (
            <div className="space-y-6">
              {/* Zona de Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragActive
                    ? "border-blue-500 bg-blue-950/20"
                    : "border-neutral-700 hover:border-neutral-500 bg-neutral-900/40"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-neutral-200">
                  Arrastra aquí tus facturas en PDF o fotografías (JPG, PNG, WEBP)
                </p>
                <p className="text-xs text-neutral-500 mt-1">O haz clic para seleccionar archivos de tu equipo</p>
              </div>

              {/* Lista de Archivos en Cola */}
              {archivos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400">
                      {archivos.length} documento{archivos.length !== 1 ? "s" : ""} en cola ({completadosCount} listos)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={procesarTodos}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                      >
                        Procesar Todo el Lote
                      </button>
                      {completadosCount > 0 && (
                        <button
                          onClick={handleImportarTodosCompletados}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Importar a Declaración ({completadosCount})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border border-neutral-800 rounded-xl divide-y divide-neutral-800/80 bg-neutral-900/30 overflow-hidden">
                    {archivos.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-5 h-5 text-neutral-500 shrink-0" />
                          <div className="truncate">
                            <p className="font-medium text-neutral-200 truncate">{item.file.name}</p>
                            <p className="text-[11px] text-neutral-500">
                              {(item.file.size / 1024).toFixed(1)} KB · {item.estadoMsg}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {item.estado === "procesando" && (
                            <div className="flex items-center gap-2 text-blue-400 font-mono">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>{item.progreso}%</span>
                            </div>
                          )}

                          {item.estado === "completado" && item.resultado && (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] bg-blue-950/60 text-blue-400 px-2 py-0.5 rounded border border-blue-800/40">
                                {item.resultado.formato_sugerido}
                              </span>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <button
                                onClick={() => setDocEnRevision({ doc: item.resultado!, file: item.file })}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                                Revisar
                              </button>
                            </div>
                          )}

                          {item.estado === "error" && (
                            <div className="flex items-center gap-1.5 text-rose-400">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-[11px]">{item.errorMsg || "Error"}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
