"use client";

import { useState } from "react";
import { DocumentoFiscalProcesado, FormatoDGII } from "@/types/fiscal-document";
import { DocumentPreview } from "@/components/upload/document-preview";
import { ConfidenceBadge } from "./confidence-badge";
import {
  Check,
  RotateCcw,
  AlertTriangle,
  Building2,
  Receipt,
  DollarSign,
  Send,
  Trash2,
} from "lucide-react";

interface SideBySideViewerProps {
  documento: DocumentoFiscalProcesado;
  file?: File;
  fileUrl?: string;
  onGuardarAprobado?: (doc: DocumentoFiscalProcesado) => Promise<void>;
  onRechazar?: (docId: string) => void;
}

export function SideBySideViewer({
  documento: initialDoc,
  file,
  fileUrl,
  onGuardarAprobado,
  onRechazar,
}: SideBySideViewerProps) {
  const [doc, setDoc] = useState<DocumentoFiscalProcesado>(initialDoc);
  const [saving, setSaving] = useState(false);

  function handleFieldChange(
    path: string,
    value: string | number
  ) {
    setDoc((prev) => {
      const copy = structuredClone(prev);
      const parts = path.split(".");

      let target: Record<string, unknown> = copy as unknown as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        target = target[parts[i]] as Record<string, unknown>;
      }

      const lastKey = parts[parts.length - 1];
      const campo = target[lastKey] as {
        valor: unknown;
        valor_original?: unknown;
        fue_modificado_manualmente?: boolean;
        estado: string;
      } | undefined;

      if (campo) {
        if (!campo.fue_modificado_manualmente) {
          campo.valor_original = campo.valor;
          campo.fue_modificado_manualmente = true;
        }
        campo.valor = value;
        campo.estado = "validado";
      }

      return copy;
    });
  }

  function revertField(path: string) {
    setDoc((prev) => {
      const copy = structuredClone(prev);
      const parts = path.split(".");

      let target: Record<string, unknown> = copy as unknown as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        target = target[parts[i]] as Record<string, unknown>;
      }

      const lastKey = parts[parts.length - 1];
      const campo = target[lastKey] as {
        valor: unknown;
        valor_original?: unknown;
        fue_modificado_manualmente?: boolean;
        estado: string;
      } | undefined;

      if (campo && campo.fue_modificado_manualmente) {
        campo.valor = campo.valor_original;
        campo.fue_modificado_manualmente = false;
      }

      return copy;
    });
  }

  async function handleAprobar() {
    setSaving(true);
    try {
      await onGuardarAprobado?.({
        ...doc,
        estado_general: "validado",
      });
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 text-xs font-mono focus:outline-none focus:border-blue-500 transition-colors";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
      {/* Panel Izquierdo: Visor de Documento */}
      <div className="h-full">
        <DocumentPreview file={file} fileUrl={fileUrl} className="h-full" />
      </div>

      {/* Panel Derecho: Formulario Estructurado Human-in-the-loop */}
      <div className="flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
        {/* Cabecera del Panel */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-neutral-900 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                Formato {doc.formato_sugerido}
              </span>
              <span className="text-xs text-neutral-400 capitalize">
                {doc.tipo_documento.replace(/_/g, " ")}
              </span>
            </div>
            <h2 className="text-sm font-bold text-neutral-100 mt-1 truncate max-w-[280px]">
              {doc.nombre_archivo}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={doc.formato_sugerido}
              onChange={(e) =>
                setDoc({ ...doc, formato_sugerido: e.target.value as FormatoDGII })
              }
              className="bg-neutral-900 text-neutral-200 border border-neutral-700 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none"
            >
              <option value="606">Formato 606 (Compras)</option>
              <option value="607">Formato 607 (Ventas)</option>
              <option value="608">Formato 608 (Anulados)</option>
              <option value="609">Formato 609 (Exterior)</option>
            </select>
          </div>
        </div>

        {/* Advertencias Fiscales */}
        {doc.advertencias.length > 0 && (
          <div className="bg-amber-950/30 border-b border-amber-800/30 px-5 py-2.5 space-y-1">
            {doc.advertencias.map((adv, idx) => (
              <p key={idx} className="flex items-center gap-2 text-xs text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                {adv}
              </p>
            ))}
          </div>
        )}

        {/* Campos Editables */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Sección 1: Sujetos Fiscales */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-neutral-500" />
              Emisor y Comprador
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-neutral-400 font-medium">RNC Emisor</label>
                  <ConfidenceBadge
                    confianza={doc.emisor.rnc.confianza}
                    estado={doc.emisor.rnc.estado}
                    fueModificado={doc.emisor.rnc.fue_modificado_manualmente}
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={doc.emisor.rnc.valor}
                    onChange={(e) => handleFieldChange("emisor.rnc", e.target.value)}
                    className={inputCls}
                  />
                  {doc.emisor.rnc.fue_modificado_manualmente && (
                    <button
                      onClick={() => revertField("emisor.rnc")}
                      title="Revertir a valor extraído"
                      className="absolute right-2 top-2 text-neutral-500 hover:text-neutral-300"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-neutral-400 font-medium">Razón Social</label>
                  <ConfidenceBadge
                    confianza={doc.emisor.razon_social.confianza}
                    estado={doc.emisor.razon_social.estado}
                    fueModificado={doc.emisor.razon_social.fue_modificado_manualmente}
                  />
                </div>
                <input
                  type="text"
                  value={doc.emisor.razon_social.valor}
                  onChange={(e) => handleFieldChange("emisor.razon_social", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Comprobante Fiscal */}
          <div className="space-y-3 pt-3 border-t border-neutral-800/80">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <Receipt className="w-3.5 h-3.5 text-neutral-500" />
              Datos del Comprobante
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-neutral-400 font-medium">NCF / e-CF</label>
                  <ConfidenceBadge
                    confianza={doc.comprobante.ncf.confianza}
                    estado={doc.comprobante.ncf.estado}
                    fueModificado={doc.comprobante.ncf.fue_modificado_manualmente}
                  />
                </div>
                <input
                  type="text"
                  value={doc.comprobante.ncf.valor}
                  onChange={(e) => handleFieldChange("comprobante.ncf", e.target.value.toUpperCase())}
                  className={inputCls}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-neutral-400 font-medium">F. Emisión</label>
                  <ConfidenceBadge
                    confianza={doc.comprobante.fecha_emision.confianza}
                    estado={doc.comprobante.fecha_emision.estado}
                    fueModificado={doc.comprobante.fecha_emision.fue_modificado_manualmente}
                  />
                </div>
                <input
                  type="text"
                  placeholder="AAAAMMDD"
                  maxLength={8}
                  value={doc.comprobante.fecha_emision.valor}
                  onChange={(e) => handleFieldChange("comprobante.fecha_emision", e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-neutral-400 font-medium">F. Pago</label>
                  {doc.comprobante.fecha_pago && (
                    <ConfidenceBadge
                      confianza={doc.comprobante.fecha_pago.confianza}
                      estado={doc.comprobante.fecha_pago.estado}
                      fueModificado={doc.comprobante.fecha_pago.fue_modificado_manualmente}
                    />
                  )}
                </div>
                <input
                  type="text"
                  placeholder="AAAAMMDD"
                  maxLength={8}
                  value={doc.comprobante.fecha_pago?.valor || ""}
                  onChange={(e) => handleFieldChange("comprobante.fecha_pago", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Datos Económicos */}
          <div className="space-y-3 pt-3 border-t border-neutral-800/80">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5 text-neutral-500" />
              Importes e Impuestos
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-neutral-400 font-medium">Total Facturado</label>
                  <ConfidenceBadge
                    confianza={doc.economia.total_facturado.confianza}
                    estado={doc.economia.total_facturado.estado}
                    fueModificado={doc.economia.total_facturado.fue_modificado_manualmente}
                  />
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={doc.economia.total_facturado.valor}
                  onChange={(e) => handleFieldChange("economia.total_facturado", parseFloat(e.target.value) || 0)}
                  className={inputCls}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-neutral-400 font-medium">ITBIS Facturado</label>
                  <ConfidenceBadge
                    confianza={doc.economia.itbis_facturado.confianza}
                    estado={doc.economia.itbis_facturado.estado}
                    fueModificado={doc.economia.itbis_facturado.fue_modificado_manualmente}
                  />
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={doc.economia.itbis_facturado.valor}
                  onChange={(e) => handleFieldChange("economia.itbis_facturado", parseFloat(e.target.value) || 0)}
                  className={inputCls}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-neutral-400 font-medium">ITBIS Retenido</label>
                  <ConfidenceBadge
                    confianza={doc.economia.itbis_retenido.confianza}
                    estado={doc.economia.itbis_retenido.estado}
                    fueModificado={doc.economia.itbis_retenido.fue_modificado_manualmente}
                  />
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={doc.economia.itbis_retenido.valor}
                  onChange={(e) => handleFieldChange("economia.itbis_retenido", parseFloat(e.target.value) || 0)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Acciones */}
        <div className="flex items-center justify-between p-4 bg-neutral-900 border-t border-neutral-800">
          <button
            onClick={() => onRechazar?.(doc.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Descartar
          </button>

          <button
            onClick={handleAprobar}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
          >
            {saving ? <Send className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Aprobar y Vincular a {doc.formato_sugerido}
          </button>
        </div>
      </div>
    </div>
  );
}
