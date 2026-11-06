"use client";

import { useState } from "react";
import { Download, Upload, Plus, Trash2, Globe, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { BatchUploadModal } from "@/components/upload/batch-upload-modal";
import { Registro609 } from "@/types/fiscal-document";
import { createBrowserClient } from "@/lib/supabase/client";

const TIPOS_SERVICIO_EXTERIOR: Record<string, string> = {
  "01": "Servicios legales y contables",
  "02": "Asesoría y consultoría técnica",
  "03": "Licencias, software y servicios en la nube",
  "04": "Regalías y derechos de autor",
  "05": "Seguros y reaseguros internacionales",
  "06": "Transporte y fletes internacionales",
  "07": "Intereses y comisiones financieras",
  "08": "Otros servicios del exterior",
};

export default function Formulario609Page() {
  const [registros, setRegistros] = useState<Registro609[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rncEmpresa, setRncEmpresa] = useState("101000000");
  const [periodo, setPeriodo] = useState("");

  // Formulario manual
  const [taxId, setTaxId] = useState("");
  const [beneficiario, setBeneficiario] = useState("");
  const [pais, setPais] = useState("USA");
  const [fechaPago, setFechaPago] = useState("");
  const [tipoServicio, setTipoServicio] = useState("03");
  const [montoExt, setMontoExt] = useState("");
  const [moneda, setMoneda] = useState("USD");
  const [tasaCambio, setTasaCambio] = useState("60.25");
  const [retencionIsr, setRetencionIsr] = useState("");

  const totales = registros.reduce(
    (acc, r) => ({
      extranjero: acc.extranjero + r.monto_moneda_extranjera,
      dop: acc.dop + r.monto_pesos_dominicanos,
      retencion: acc.retencion + r.retencion_isr,
    }),
    { extranjero: 0, dop: 0, retencion: 0 }
  );

  const fmtDop = (n: number) =>
    new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(n);
  const fmtUsd = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  function agregarRegistroManual() {
    if (!taxId || !beneficiario || !fechaPago || !montoExt) {
      toast.error("Por favor completa Tax ID, Beneficiario, Fecha y Monto.");
      return;
    }

    const mExt = parseFloat(montoExt) || 0;
    const tasa = parseFloat(tasaCambio) || 1.0;
    const mDop = Math.round(mExt * tasa * 100) / 100;
    const rIsr = parseFloat(retencionIsr) || 0;

    const nuevo: Registro609 = {
      id: crypto.randomUUID(),
      identificacion_fiscal_beneficiario: taxId.trim(),
      razon_social_beneficiario: beneficiario.trim(),
      pais_residencia: pais.trim().toUpperCase(),
      fecha_pago: fechaPago.trim(),
      tipo_servicio_exterior: tipoServicio,
      monto_moneda_extranjera: mExt,
      codigo_moneda: moneda.trim().toUpperCase(),
      tasa_cambio: tasa,
      monto_pesos_dominicanos: mDop,
      retencion_isr: rIsr,
      valido: true,
    };

    setRegistros([...registros, nuevo]);
    setTaxId("");
    setBeneficiario("");
    setMontoExt("");
    setRetencionIsr("");
    toast.success("Pago al exterior agregado con éxito.");
  }

  function eliminarRegistro(id: string) {
    setRegistros(registros.filter((r) => r.id !== id));
  }

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

      const res = await fetch(`${backendUrl}/export/609/txt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ rnc_empresa: rncEmpresa, periodo, registros }),
      });

      if (!res.ok) throw new Error("Error generando el TXT 609");

      const blob = await res.blob();
      const filename = `DGII_F_609_${rncEmpresa}_${periodo}.TXT`;
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
            <span className="text-xs font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
              FORMATO 609
            </span>
            <span className="text-xs text-neutral-500">Pagos por Servicios al Exterior</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">Declaración de Servicios del Exterior</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Reporte mensual de remesas y pagos a entidades extranjeras por servicios, software y asesorías.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            <Upload className="w-4 h-4" />
            Cargar Facturas Extranjeras
          </button>

          <button
            onClick={exportarTxt}
            disabled={exporting || registros.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Generando..." : "Descargar TXT DGII (10 Col)"}
          </button>
        </div>
      </div>

      {/* Parámetros de Declaración */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">RNC de la Empresa</label>
          <input
            type="text"
            value={rncEmpresa}
            onChange={(e) => setRncEmpresa(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
            placeholder="Ej: 101000000"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">Período Fiscal (AAAAMM)</label>
          <input
            type="text"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
            placeholder="Ej: 202603"
          />
        </div>
      </div>

      {/* Métricas / Totales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-500">Cantidad de Pagos</p>
          <p className="text-2xl font-bold text-neutral-100 mt-1">{registros.length}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-500">Total Moneda Extranjera</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{fmtUsd(totales.extranjero)}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-500">Total Convertido (DOP)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{fmtDop(totales.dop)}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-500">Total Retención ISR (DOP)</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{fmtDop(totales.retencion)}</p>
        </div>
      </div>

      {/* Formulario de entrada rápida */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
          <Globe className="w-4 h-4 text-purple-400" />
          <span>Registrar Pago al Exterior</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Tax ID / EIN</label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="Ej: US987654321"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Beneficiario / Empresa</label>
            <input
              type="text"
              value={beneficiario}
              onChange={(e) => setBeneficiario(e.target.value)}
              placeholder="Ej: Google Cloud LLC"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">País</label>
            <input
              type="text"
              value={pais}
              onChange={(e) => setPais(e.target.value)}
              placeholder="Ej: USA / IRL"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Fecha de Pago (AAAAMMDD)</label>
            <input
              type="text"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              placeholder="Ej: 20260315"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Tipo de Servicio</label>
            <select
              value={tipoServicio}
              onChange={(e) => setTipoServicio(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
            >
              {Object.entries(TIPOS_SERVICIO_EXTERIOR).map(([k, v]) => (
                <option key={k} value={k}>
                  {k} - {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Monto Extranjero</label>
            <input
              type="number"
              step="0.01"
              value={montoExt}
              onChange={(e) => setMontoExt(e.target.value)}
              placeholder="0.00"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Tasa de Cambio</label>
            <input
              type="number"
              step="0.0001"
              value={tasaCambio}
              onChange={(e) => setTasaCambio(e.target.value)}
              placeholder="60.2500"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Retención ISR (DOP)</label>
            <input
              type="number"
              step="0.01"
              value={retencionIsr}
              onChange={(e) => setRetencionIsr(e.target.value)}
              placeholder="0.00"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={agregarRegistroManual}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar a Declaración
          </button>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-200">
            Detalle de Comprobantes 609 ({registros.length})
          </h2>
        </div>

        {registros.length === 0 ? (
          <div className="p-12 text-center">
            <Globe className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-sm text-neutral-400">No hay pagos al exterior registrados para este período.</p>
            <p className="text-xs text-neutral-600 mt-1">
              Usa el botón &quot;Cargar Facturas Extranjeras&quot; o agrégalos manualmente arriba.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider font-mono border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Tax ID</th>
                  <th className="py-3 px-4">Beneficiario</th>
                  <th className="py-3 px-4">País</th>
                  <th className="py-3 px-4">Fecha Pago</th>
                  <th className="py-3 px-4">Tipo Serv.</th>
                  <th className="py-3 px-4 text-right">Monto Ext.</th>
                  <th className="py-3 px-4 text-right">Tasa</th>
                  <th className="py-3 px-4 text-right">Monto DOP</th>
                  <th className="py-3 px-4 text-right">Ret. ISR</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-300 font-mono">
                {registros.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4">{r.identificacion_fiscal_beneficiario}</td>
                    <td className="py-3 px-4 font-sans font-medium text-neutral-200">{r.razon_social_beneficiario}</td>
                    <td className="py-3 px-4">{r.pais_residencia}</td>
                    <td className="py-3 px-4">{r.fecha_pago}</td>
                    <td className="py-3 px-4">{r.tipo_servicio_exterior}</td>
                    <td className="py-3 px-4 text-right text-purple-400">
                      {fmtUsd(r.monto_moneda_extranjera)}
                    </td>
                    <td className="py-3 px-4 text-right">{r.tasa_cambio.toFixed(4)}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">
                      {fmtDop(r.monto_pesos_dominicanos)}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-400">
                      {fmtDop(r.retencion_isr)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => eliminarRegistro(r.id)}
                        className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BatchUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        empresaId="default-empresa"
        empresaRnc={rncEmpresa}
        onDocumentsProcessed={(docs) => {
          // Filtrar docs 609 o convertirlos
          const nuevos: Registro609[] = docs.map((d) => ({
            id: d.id,
            documento_id: d.id,
            identificacion_fiscal_beneficiario: d.emisor.rnc.valor || "EXT999999",
            razon_social_beneficiario: d.emisor.razon_social.valor || d.nombre_archivo,
            pais_residencia: "USA",
            fecha_pago: d.comprobante.fecha_emision.valor.replace(/-/g, "") || "20260301",
            tipo_servicio_exterior: "03",
            monto_moneda_extranjera: d.economia.total_facturado.valor || 0,
            codigo_moneda: d.comprobante.moneda.valor || "USD",
            tasa_cambio: d.comprobante.tasa_cambio?.valor || 60.25,
            monto_pesos_dominicanos: Math.round((d.economia.total_facturado.valor || 0) * (d.comprobante.tasa_cambio?.valor || 60.25) * 100) / 100,
            retencion_isr: d.economia.monto_retencion_renta?.valor || 0,
            valido: true,
          }));
          setRegistros([...registros, ...nuevos]);
          toast.success(`${nuevos.length} comprobantes agregados al Formato 609.`);
        }}
      />
    </div>
  );
}
