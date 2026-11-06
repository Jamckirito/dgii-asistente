"use client";

import { useState } from "react";
import { Download, Upload, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { BatchUploadModal } from "@/components/upload/batch-upload-modal";
import { Registro607 } from "@/types/fiscal-document";
import { createBrowserClient } from "@/lib/supabase/client";

export default function Formulario607Page() {
  const [registros, setRegistros] = useState<Registro607[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rncEmpresa, setRncEmpresa] = useState("101000000");
  const [periodo, setPeriodo] = useState("");

  const totales = registros.reduce(
    (acc, r) => ({
      total: acc.total + r.monto_facturado,
      itbis: acc.itbis + r.itbis_facturado,
      retenido: acc.retenido + r.itbis_retenido_terceros,
    }),
    { total: 0, itbis: 0, retenido: 0 }
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(n);

  async function exportarTxt() {
    if (registros.length === 0 || !periodo || !rncEmpresa) {
      toast.error("Ingresa el RNC, Período y al menos un registro para exportar.");
      return;
    }
    setExporting(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(`${backendUrl}/export/607/txt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ rnc_empresa: rncEmpresa, periodo, registros }),
      });

      if (!res.ok) throw new Error("Error generando el TXT 607");

      const blob = await res.blob();
      const filename = `DGII_F_607_${rncEmpresa}_${periodo}.TXT`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${filename} generado correctamente.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al exportar TXT";
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              FORMATO 607
            </span>
            <span className="text-xs text-neutral-500">Ventas de Bienes y Servicios</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">Declaración de Ventas</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Registro de facturas emitidas, ingresos operacionales y retenciones practicadas por terceros.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            <Upload className="w-4 h-4" />
            Cargar Facturas Emitidas
          </button>

          <button
            onClick={exportarTxt}
            disabled={exporting || registros.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar TXT Oficial 607
          </button>
        </div>
      </div>

      {/* Controles de Período y RNC */}
      <div className="grid grid-cols-2 gap-4 bg-neutral-900/40 border border-neutral-800 p-4 rounded-xl">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">RNC de la Empresa</label>
          <input
            type="text"
            value={rncEmpresa}
            onChange={(e) => setRncEmpresa(e.target.value.replace(/\D/g, ""))}
            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 font-mono text-xs focus:outline-none"
            placeholder="101000000"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">Período Fiscal (AAAAMM)</label>
          <input
            type="text"
            maxLength={6}
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value.replace(/\D/g, ""))}
            className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 font-mono text-xs focus:outline-none"
            placeholder="202607"
          />
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">Total Facturado (Ventas)</p>
          <p className="text-lg font-bold font-mono text-neutral-100">{fmt(totales.total)}</p>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">ITBIS Facturado</p>
          <p className="text-lg font-bold font-mono text-emerald-400">{fmt(totales.itbis)}</p>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">ITBIS Retenido por Clientes</p>
          <p className="text-lg font-bold font-mono text-blue-400">{fmt(totales.retenido)}</p>
        </div>
      </div>

      {/* Tabla de Registros */}
      {registros.length === 0 ? (
        <div className="border border-dashed border-neutral-800 rounded-xl p-16 text-center bg-neutral-900/20">
          <FileText className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-400 font-medium">No hay registros de ventas para este período</p>
          <p className="text-xs text-neutral-600 mt-1">
            Usa el botón &quot;Cargar Facturas Emitidas&quot; para extraerlas automáticamente.
          </p>
        </div>
      ) : (
        <div className="border border-neutral-800 rounded-xl overflow-x-auto bg-neutral-950">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/70 text-neutral-400">
                <th className="px-3 py-2.5 text-left">RNC/Cédula Cliente</th>
                <th className="px-3 py-2.5 text-left">NCF</th>
                <th className="px-3 py-2.5 text-left">Tipo Ingreso</th>
                <th className="px-3 py-2.5 text-left">F. Comprobante</th>
                <th className="px-3 py-2.5 text-right">Monto Facturado</th>
                <th className="px-3 py-2.5 text-right">ITBIS Facturado</th>
                <th className="px-3 py-2.5 text-right">ITBIS Retenido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {registros.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-900/40">
                  <td className="px-3 py-2.5">{r.rnc_cedula_cliente}</td>
                  <td className="px-3 py-2.5 text-blue-400">{r.ncf}</td>
                  <td className="px-3 py-2.5">{r.tipo_ingreso}</td>
                  <td className="px-3 py-2.5 text-neutral-400">{r.fecha_comprobante}</td>
                  <td className="px-3 py-2.5 text-right text-neutral-200">{fmt(r.monto_facturado)}</td>
                  <td className="px-3 py-2.5 text-right text-emerald-400">{fmt(r.itbis_facturado)}</td>
                  <td className="px-3 py-2.5 text-right text-blue-400">{fmt(r.itbis_retenido_terceros)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Carga */}
      <BatchUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        empresaId="default-empresa"
        rncEmpresa={rncEmpresa}
        onDocumentoAprobado={async (doc) => {
          const nuevo: Registro607 = {
            id: crypto.randomUUID(),
            documento_id: doc.id,
            rnc_cedula_cliente: doc.comprador.rnc.valor || "000000000",
            tipo_identificacion: doc.comprador.rnc.valor.length === 11 ? "2" : "1",
            ncf: doc.comprobante.ncf.valor,
            tipo_ingreso: "01",
            fecha_comprobante: doc.comprobante.fecha_emision.valor,
            monto_facturado: doc.economia.total_facturado.valor,
            itbis_facturado: doc.economia.itbis_facturado.valor,
            itbis_retenido_terceros: doc.economia.itbis_retenido.valor,
            itbis_percibido: 0,
            retencion_renta_terceros: doc.economia.monto_retencion_renta.valor,
            isr_percibido: 0,
            impuesto_selectivo: doc.economia.impuesto_selectivo.valor,
            otros_impuestos: doc.economia.otros_impuestos.valor,
            propina_legal: doc.economia.propina_legal.valor,
            monto_efectivo: doc.economia.total_facturado.valor,
            valido: true,
          };
          setRegistros((prev) => [...prev, nuevo]);
        }}
      />
    </div>
  );
}

