"use client";

import { useState } from "react";
import { Download, Plus, Trash2, FileX } from "lucide-react";
import { toast } from "sonner";
import { Registro608 } from "@/types/fiscal-document";
import { createBrowserClient } from "@/lib/supabase/client";

const TIPOS_ANULACION: Record<string, string> = {
  "01": "Deterioro de factura pre-impresa",
  "02": "Errores de impresión (sistemas)",
  "03": "Faltante de comprobantes",
  "04": "Pérdida o hurto de talonarios",
  "05": "Cese de operaciones",
  "06": "Duplicidad de comprobantes",
  "07": "Otros motivos",
};

export default function Formulario608Page() {
  const [registros, setRegistros] = useState<Registro608[]>([]);
  const [exporting, setExporting] = useState(false);
  const [rncEmpresa, setRncEmpresa] = useState("101000000");
  const [periodo, setPeriodo] = useState("");

  const [ncf, setNcf] = useState("");
  const [fecha, setFecha] = useState("");
  const [tipo, setTipo] = useState("02");

  function agregarRegistro() {
    if (!ncf || !fecha) {
      toast.error("Indica el NCF y la fecha del comprobante anulado.");
      return;
    }
    const nuevo: Registro608 = {
      id: crypto.randomUUID(),
      ncf: ncf.toUpperCase().trim(),
      fecha_comprobante: fecha.trim(),
      tipo_anulacion: tipo,
      valido: true,
    };
    setRegistros([...registros, nuevo]);
    setNcf("");
    setFecha("");
    toast.success("Comprobante anulado agregado a la lista.");
  }

  function eliminarRegistro(id: string) {
    setRegistros(registros.filter((r) => r.id !== id));
  }

  async function exportarTxt() {
    if (registros.length === 0 || !periodo || !rncEmpresa) {
      toast.error("Ingresa el RNC, Período y al menos un comprobante anulado.");
      return;
    }
    setExporting(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const supabase = createBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(`${backendUrl}/export/608/txt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ rnc_empresa: rncEmpresa, periodo, registros }),
      });

      if (!res.ok) throw new Error("Error generando el TXT 608");

      const blob = await res.blob();
      const filename = `DGII_F_608_${rncEmpresa}_${periodo}.TXT`;
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
              FORMATO 608
            </span>
            <span className="text-xs text-neutral-500">Comprobantes Fiscales Anulados</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">Comprobantes Anulados</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Reporte de números de comprobantes fiscales cancelados, inutilizados o dados de baja según la normativa DGII.
          </p>
        </div>

        <button
          onClick={exportarTxt}
          disabled={exporting || registros.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar TXT Oficial 608
        </button>
      </div>

      {/* Datos del Declarante */}
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

      {/* Formulario de Entrada Rápida */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-neutral-300">Registrar Comprobante Anulado</h3>
        <div className="grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">NCF / e-CF Anulado</label>
            <input
              type="text"
              placeholder="B0100000099"
              value={ncf}
              onChange={(e) => setNcf(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs font-mono text-neutral-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">Fecha Comprobante</label>
            <input
              type="text"
              placeholder="AAAAMMDD"
              maxLength={8}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs font-mono text-neutral-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">Tipo de Anulación</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 focus:outline-none"
            >
              {Object.entries(TIPOS_ANULACION).map(([k, v]) => (
                <option key={k} value={k}>
                  {k} - {v}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={agregarRegistro}
            className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors h-[34px]"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar
          </button>
        </div>
      </div>

      {/* Tabla de Anulados */}
      {registros.length === 0 ? (
        <div className="border border-dashed border-neutral-800 rounded-xl p-14 text-center bg-neutral-900/20">
          <FileX className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <p className="text-neutral-400 font-medium">No hay comprobantes anulados registrados</p>
          <p className="text-xs text-neutral-600 mt-1">
            Agrega manualmente los NCFs deteriorados o cancelados usando el formulario superior.
          </p>
        </div>
      ) : (
        <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/70 text-neutral-400">
                <th className="px-4 py-2.5 text-left">NCF Anulado</th>
                <th className="px-4 py-2.5 text-left">Fecha Comprobante</th>
                <th className="px-4 py-2.5 text-left">Motivo de Anulación</th>
                <th className="px-4 py-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono">
              {registros.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-900/40">
                  <td className="px-4 py-2.5 text-rose-400">{r.ncf}</td>
                  <td className="px-4 py-2.5 text-neutral-300">{r.fecha_comprobante}</td>
                  <td className="px-4 py-2.5 text-neutral-400 font-sans">
                    {r.tipo_anulacion} - {TIPOS_ANULACION[r.tipo_anulacion] || "Otro"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => eliminarRegistro(r.id)}
                      className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
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
  );
}
