"use client";

import { useState } from "react";
import { Sparkles, UploadCloud } from "lucide-react";
import { UploadZone } from "@/components/upload/upload-zone";
import { Form606Table } from "@/components/formulario-606/form-606-table";
import { Form606Header } from "@/components/formulario-606/form-606-header";
import { BatchUploadModal } from "@/components/upload/batch-upload-modal";
import type { Registro606, ExtractResponse } from "@/types/formulario-606";
import { DocumentoFiscalProcesado } from "@/types/fiscal-document";
import { toast } from "sonner";

export default function Formulario606Page() {
  const [registros, setRegistros] = useState<Registro606[]>([]);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [modoCarga, setModoCarga] = useState<"ocr_local" | "gemini_backend">("ocr_local");

  function handleDataExtracted(data: ExtractResponse) {
    const conIds = data.registros.map((r) => ({
      ...r,
      id: crypto.randomUUID(),
      valido: true,
    }));
    setRegistros((prev) => [...prev, ...conIds]);
  }

  function handleDocumentoAprobado(doc: DocumentoFiscalProcesado) {
    const rnc = doc.emisor.rnc.valor.replace(/\D/g, "");
    const nuevo: Registro606 = {
      id: crypto.randomUUID(),
      rnc_proveedor: rnc,
      tipo_id: rnc.length === 9 ? "1" : "2",
      tipo_compra: "02",
      ncf: doc.comprobante.ncf.valor,
      ncf_modificado: doc.comprobante.ncf_modificado?.valor || "",
      fecha_comprobante: doc.comprobante.fecha_emision.valor.replace(/-/g, "") || "20260301",
      fecha_pago: doc.comprobante.fecha_pago?.valor?.replace(/-/g, "") || "",
      monto_servicios: 0,
      monto_bienes: doc.economia.total_facturado.valor || 0,
      total_facturado: doc.economia.total_facturado.valor || 0,
      itbis_facturado: doc.economia.itbis_facturado.valor || 0,
      itbis_retenido: doc.economia.itbis_retenido.valor || 0,
      itbis_proporcional: 0,
      itbis_costo: 0,
      itbis_adelantar: doc.economia.itbis_facturado.valor || 0,
      itbis_percibido: 0,
      tipo_retencion_isr: "",
      monto_retencion_renta: doc.economia.monto_retencion_renta?.valor || 0,
      isr_percibido: 0,
      impuesto_selectivo: doc.economia.impuesto_selectivo?.valor || 0,
      otros_impuestos: doc.economia.otros_impuestos?.valor || 0,
      propina_legal: doc.economia.propina_legal?.valor || 0,
      forma_pago: doc.economia.forma_pago?.valor || "01",
      valido: true,
      errores: doc.advertencias,
    };

    setRegistros((prev) => [...prev, nuevo]);
    toast.success(`Factura ${nuevo.ncf} añadida al Formato 606.`);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Form606Header registros={registros} />

      {/* Selector de Método de Carga */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-neutral-200">Método de Captura de Documentos</p>
          <p className="text-xs text-neutral-500">
            Elige entre procesamiento local privado con OCR en el navegador o extracción con IA backend.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOcrModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Escanear Documentos (OCR Seguro)
          </button>

          <button
            onClick={() => setModoCarga(modoCarga === "gemini_backend" ? "ocr_local" : "gemini_backend")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 border border-neutral-800 hover:border-neutral-700 bg-neutral-950 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            {modoCarga === "gemini_backend" ? "Ocultar Carga IA" : "Carga Rápida con IA"}
          </button>
        </div>
      </div>

      {modoCarga === "gemini_backend" && (
        <UploadZone formulario="606" onDataExtracted={handleDataExtracted} />
      )}

      <Form606Table registros={registros} onRegistrosChange={setRegistros} />

      <BatchUploadModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        empresaId="default-empresa"
        rncEmpresa="101000000"
        onDocumentoAprobado={async (doc) => {
          handleDocumentoAprobado(doc);
        }}
      />
    </div>
  );
}
