"use client";

import { useState } from "react";
import { Download, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function Form606Header() {
  const [checking, setChecking] = useState(false);

  async function checkVersion() {
    setChecking(true);
    try {
      const res = await fetch("/api/check-form-version?form=606");
      const data = await res.json();
      if (data.updated) {
        toast.warning(`Nueva versión del Formato 606 disponible (${data.date}). La app ya usa la versión actualizada.`);
      } else {
        toast.success("Estás usando la versión más reciente del Formato 606.");
      }
    } catch {
      toast.error("No se pudo verificar la versión. Revisa tu conexión.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded">
            FORMATO 606
          </span>
          <span className="text-xs text-neutral-500">Compras de bienes y servicios</span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-100">
          Declaración de Compras
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Sube tus facturas o libros contables y la IA completará el formulario automáticamente.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={checkVersion}
          disabled={checking}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
          Verificar versión
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors">
          <Download className="w-4 h-4" />
          Exportar TXT
        </button>
      </div>
    </div>
  );
}
