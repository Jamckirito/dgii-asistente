"use client";

import { useState } from "react";
import { Download, Save, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { Registro606 } from "@/types/formulario-606";

interface Form606HeaderProps {
  registros: Registro606[];
}

export function Form606Header({ registros }: Form606HeaderProps) {
  const [checking, setChecking]           = useState(false);
  const [saving, setSaving]               = useState(false);
  const [exporting, setExporting]         = useState(false);
  const [declaracionId, setDeclaracionId] = useState<string | null>(null);

  const [periodo,    setPeriodo]    = useState("");  // YYYYMM
  const [rncEmpresa, setRncEmpresa] = useState("");  // 9-11 dígitos

  const hayRegistros        = registros.length > 0;
  const hayDatosSuficientes = hayRegistros && periodo.length === 6 && rncEmpresa.length >= 9;
  const puedeExportar       = declaracionId !== null;

  async function checkVersion() {
    setChecking(true);
    try {
      const res  = await fetch("/api/check-form-version?form=606");
      const data = await res.json();
      if (data.updated) {
        toast.warning(`Nueva versión del Formato 606 disponible (${data.date}).`);
      } else {
        toast.success("Estás usando la versión más reciente del Formato 606.");
      }
    } catch {
      toast.error("No se pudo verificar la versión. Revisa tu conexión.");
    } finally {
      setChecking(false);
    }
  }

  async function guardarDeclaracion() {
    if (!hayDatosSuficientes) return;
    setSaving(true);
    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // 1. Buscar o crear empresa
      let { data: empresa } = await supabase
        .from("empresas")
        .select("id")
        .eq("user_id", user.id)
        .eq("rnc", rncEmpresa)
        .maybeSingle();

      if (!empresa) {
        const { data: nueva, error: errEmp } = await supabase
          .from("empresas")
          .insert({ user_id: user.id, rnc: rncEmpresa, nombre: rncEmpresa })
          .select("id")
          .single();
        if (errEmp) throw errEmp;
        empresa = nueva;
      }

      // 2. Crear cabecera de declaración
      const { data: decl, error: errDecl } = await supabase
        .from("declaraciones")
        .insert({ empresa_id: empresa!.id, formulario: "606", periodo, estado: "borrador" })
        .select("id")
        .single();
      if (errDecl) throw errDecl;

      // 3. Insertar registros (omitir campos virtuales de UI)
      const filas = registros.map(({ id: _id, valido: _v, errores: _e, ...r }) => ({
        ...r,
        declaracion_id: decl.id,
      }));
      const { error: errRegs } = await supabase.from("registros_606").insert(filas);
      if (errRegs) throw errRegs;

      setDeclaracionId(decl.id);
      toast.success(`Declaración guardada (${registros.length} registros). Ya puedes exportar el TXT.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al guardar: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  async function exportarTxt() {
    if (!puedeExportar) return;
    setExporting(true);
    try {
      const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
      const res = await fetch(`${backendUrl}/export/606/txt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rnc_empresa: rncEmpresa, periodo, registros }),
      });
      if (!res.ok) throw new Error("Error del servidor al generar el TXT");

      const blob     = await res.blob();
      const filename = `DGII_F_606_${rncEmpresa}_${periodo}.TXT`;
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement("a");
      a.href         = url;
      a.download     = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${filename} descargado correctamente.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error al exportar: ${msg}`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Título */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded">
              FORMATO 606
            </span>
            <span className="text-xs text-neutral-500">Compras de bienes y servicios</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">Declaración de Compras</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Sube tus facturas o libros contables y la IA completará el formulario automáticamente.
          </p>
        </div>
        <button
          onClick={checkVersion}
          disabled={checking}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={cn("w-4 h-4", checking && "animate-spin")} />
          Verificar versión
        </button>
      </div>

      {/* Barra de acción — solo visible cuando hay registros extraídos */}
      {hayRegistros && (
        <div className="flex items-center gap-3 p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div>
              <label className="block text-[10px] text-neutral-500 mb-1 uppercase tracking-wider">
                RNC Empresa
              </label>
              <input
                type="text"
                placeholder="101000000"
                maxLength={11}
                value={rncEmpresa}
                onChange={(e) => setRncEmpresa(e.target.value.replace(/\D/g, ""))}
                className="w-36 px-3 py-2 text-sm bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 mb-1 uppercase tracking-wider">
                Período (AAAAMM)
              </label>
              <input
                type="text"
                placeholder="202505"
                maxLength={6}
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value.replace(/\D/g, ""))}
                className="w-32 px-3 py-2 text-sm bg-neutral-950 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
            </div>
            <p className="text-xs text-neutral-600 self-end pb-2.5">
              {registros.length} registro{registros.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-end gap-2 shrink-0">
            <button
              onClick={guardarDeclaracion}
              disabled={!hayDatosSuficientes || saving || declaracionId !== null}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                declaracionId
                  ? "bg-green-900/40 text-green-400 cursor-default"
                  : hayDatosSuficientes && !saving
                  ? "bg-neutral-700 hover:bg-neutral-600 text-neutral-100"
                  : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
              )}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {declaracionId ? "Guardado" : "Guardar"}
            </button>

            <button
              onClick={exportarTxt}
              disabled={!puedeExportar || exporting}
              title={!puedeExportar ? "Guarda la declaración primero" : undefined}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                puedeExportar
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
              )}
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Exportar TXT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


