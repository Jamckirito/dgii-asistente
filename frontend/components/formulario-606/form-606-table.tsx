"use client";

import { Pencil, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Registro606 } from "@/types/formulario-606";

interface Form606TableProps {
  registros: Registro606[];
  onRegistrosChange: (registros: Registro606[]) => void;
}

const COLUMNS = [
  { key: "rnc_proveedor",     label: "RNC/Cédula",      width: "w-32" },
  { key: "ncf",               label: "NCF",              width: "w-36" },
  { key: "tipo_compra",       label: "Tipo",             width: "w-16" },
  { key: "fecha_comprobante", label: "F. Comprobante",   width: "w-32" },
  { key: "fecha_pago",        label: "F. Pago",          width: "w-28" },
  { key: "total_facturado",   label: "Total Fact.",      width: "w-28" },
  { key: "itbis_facturado",   label: "ITBIS Fact.",      width: "w-24" },
  { key: "itbis_retenido",    label: "ITBIS Ret.",       width: "w-24" },
];

export function Form606Table({ registros, onRegistrosChange }: Form606TableProps) {
  function removeRow(id: string) {
    onRegistrosChange(registros.filter((r) => r.id !== id));
  }

  const totales = registros.reduce(
    (acc, r) => ({
      total:    acc.total    + r.total_facturado,
      itbis:    acc.itbis    + r.itbis_facturado,
      retenido: acc.retenido + r.itbis_retenido,
    }),
    { total: 0, itbis: 0, retenido: 0 }
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(n);

  if (registros.length === 0) {
    return (
      <div className="border border-dashed border-neutral-700 rounded-xl p-16 text-center">
        <p className="text-neutral-500">
          Sube un archivo arriba para comenzar a extraer registros del Formato 606.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total facturado", value: fmt(totales.total),    color: "text-neutral-100" },
          { label: "ITBIS facturado", value: fmt(totales.itbis),    color: "text-blue-400"    },
          { label: "ITBIS retenido",  value: fmt(totales.retenido), color: "text-green-400"   },
        ].map((s) => (
          <div key={s.label} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
            <p className="text-xs text-neutral-500 mb-1">{s.label}</p>
            <p className={cn("text-lg font-bold font-mono", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="border border-neutral-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/80">
              <th className="w-8 px-3 py-3"></th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-3 py-3 text-left text-xs font-semibold text-neutral-400 tracking-wide",
                    col.width
                  )}
                >
                  {col.label}
                </th>
              ))}
              <th className="px-3 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {registros.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-900/40 transition-colors group">
                <td className="px-3 py-3">
                  {r.valido ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-neutral-300">{r.rnc_proveedor}</td>
                <td className="px-3 py-2 font-mono text-xs text-neutral-300">{r.ncf}</td>
                <td className="px-3 py-2 text-xs text-neutral-400">{r.tipo_compra}</td>
                <td className="px-3 py-2 font-mono text-xs text-neutral-400">{r.fecha_comprobante}</td>
                <td className="px-3 py-2 font-mono text-xs text-neutral-400">{r.fecha_pago ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs text-neutral-100 text-right">{fmt(r.total_facturado)}</td>
                <td className="px-3 py-2 font-mono text-xs text-blue-400 text-right">{fmt(r.itbis_facturado)}</td>
                <td className="px-3 py-2 font-mono text-xs text-green-400 text-right">{fmt(r.itbis_retenido)}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeRow(r.id)}
                      className="p-1 rounded hover:bg-red-950 text-neutral-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-900/60 text-xs text-neutral-500">
          {registros.length} registro{registros.length !== 1 ? "s" : ""} ·{" "}
          {registros.filter((r) => !r.valido).length} con advertencias
        </div>
      </div>
    </div>
  );
}


