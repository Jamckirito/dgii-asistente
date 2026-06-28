"use client";

import { useState, useEffect } from "react";
import { Building2, Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

interface Empresa {
  id: string;
  rnc: string;
  nombre: string;
}

export default function ConfiguracionPage() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [rnc,     setRnc]     = useState("");
  const [nombre,  setNombre]  = useState("");
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const supabase = createBrowserClient();

  useEffect(() => {
    async function cargarEmpresa() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("empresas")
        .select("id, rnc, nombre")
        .eq("user_id", user.id)
        .order("creado_en", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        setEmpresa(data);
        setRnc(data.rnc);
        setNombre(data.nombre);
      }
      setLoading(false);
    }
    cargarEmpresa();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function guardar() {
    if (!rnc || !nombre) {
      toast.error("Completa el RNC y el nombre de la empresa.");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      if (empresa) {
        const { error } = await supabase
          .from("empresas")
          .update({ rnc, nombre })
          .eq("id", empresa.id);
        if (error) throw error;
        setEmpresa({ ...empresa, rnc, nombre });
        toast.success("Empresa actualizada correctamente.");
      } else {
        const { data, error } = await supabase
          .from("empresas")
          .insert({ user_id: user.id, rnc, nombre })
          .select("id, rnc, nombre")
          .single();
        if (error) throw error;
        setEmpresa(data);
        toast.success("Empresa registrada correctamente.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-600 text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
            CONFIGURACIÓN
          </span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-100">Datos de la Empresa</h1>
        <p className="text-sm text-neutral-500 mt-1">
          El RNC y nombre de tu empresa se usan para generar los archivos TXT para la DGII.
        </p>
      </div>

      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-800">
          <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-neutral-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-200">Empresa contribuyente</p>
            <p className="text-xs text-neutral-500">
              {empresa
                ? "Empresa registrada · puedes actualizar los datos"
                : "Aún no has registrado una empresa"}
            </p>
          </div>
          {empresa && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-neutral-500 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando...
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2">
                RNC de la Empresa
              </label>
              <input
                type="text"
                placeholder="101000000"
                maxLength={11}
                value={rnc}
                onChange={(e) => setRnc(e.target.value.replace(/\D/g, ""))}
                className={inputCls}
              />
              <p className="text-xs text-neutral-600 mt-1">
                Solo dígitos, sin guiones. RNC: 9 dígitos · Cédula: 11 dígitos.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2">
                Nombre / Razón Social
              </label>
              <input
                type="text"
                placeholder="Empresa Ejemplo, S.R.L."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={cn(inputCls, "font-sans")}
              />
            </div>

            <button
              onClick={guardar}
              disabled={saving || !rnc || !nombre}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
            >
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Save className="w-4 h-4" />}
              {empresa ? "Actualizar empresa" : "Guardar empresa"}
            </button>
          </>
        )}
      </div>

      <div className="text-xs text-neutral-600 space-y-1 px-1">
        <p>· El sistema admite una empresa por cuenta. Para múltiples RNC, crea una cuenta por empresa.</p>
        <p>· El RNC ingresado aquí se usará como encabezado en el archivo TXT del Formato 606.</p>
      </div>
    </div>
  );
}
