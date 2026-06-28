import { createServerClient } from "@/lib/supabase/server";
import { redirect }            from "next/navigation";
import { FileText, Clock, CheckCircle2, Send } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Estado = "borrador" | "validado" | "enviado";

const ESTADO_CONFIG: Record<Estado, { label: string; color: string; icon: React.ComponentType<{className?: string}> }> = {
  borrador: { label: "Borrador",  color: "text-neutral-400 bg-neutral-800",       icon: Clock         },
  validado: { label: "Validado",  color: "text-blue-400 bg-blue-950/50",           icon: CheckCircle2  },
  enviado:  { label: "Enviado",   color: "text-green-400 bg-green-950/50",         icon: Send          },
};

export default async function HistorialPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Cargar declaraciones del usuario (via empresa → declaración)
  const { data: declaraciones } = await supabase
    .from("declaraciones")
    .select(`
      id,
      formulario,
      periodo,
      estado,
      creado_en,
      actualizado_en,
      empresas ( rnc, nombre )
    `)
    .order("creado_en", { ascending: false })
    .limit(50);

  const formatPeriodo = (p: string) => {
    if (p.length !== 6) return p;
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const mes   = parseInt(p.slice(4, 6), 10) - 1;
    const anio  = p.slice(0, 4);
    return `${meses[mes]} ${anio}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
            HISTORIAL
          </span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-100">Declaraciones Anteriores</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Registro de todas las declaraciones guardadas en el sistema.
        </p>
      </div>

      {!declaraciones || declaraciones.length === 0 ? (
        <div className="border border-dashed border-neutral-700 rounded-xl p-16 text-center">
          <FileText className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 font-medium">No hay declaraciones guardadas</p>
          <p className="text-xs text-neutral-600 mt-1">
            Extrae y guarda tu primera declaración desde la sección Formato 606.
          </p>
        </div>
      ) : (
        <div className="border border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/80">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 tracking-wide">Formulario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 tracking-wide">Período</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 tracking-wide">RNC Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 tracking-wide">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 tracking-wide">Guardado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {declaraciones.map((d) => {
                const estado  = (d.estado ?? "borrador") as Estado;
                const cfg     = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.borrador;
                const Icon    = cfg.icon;
                // @ts-expect-error — supabase join type
                const empresa = d.empresas as { rnc: string; nombre: string } | null;

                return (
                  <tr key={d.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-blue-400 bg-blue-950/30 px-2 py-0.5 rounded">
                        {d.formulario}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-200">
                      {formatPeriodo(d.periodo)}
                      <span className="text-neutral-600 ml-1">({d.periodo})</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400 font-mono">
                      {empresa?.rnc ?? "—"}
                      {empresa?.nombre && (
                        <span className="block text-neutral-600 font-sans">{empresa.nombre}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium", cfg.color)}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600">
                      {new Date(d.creado_en).toLocaleDateString("es-DO", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-900/60 text-xs text-neutral-500">
            {declaraciones.length} declaración{declaraciones.length !== 1 ? "es" : ""} en total
          </div>
        </div>
      )}
    </div>
  );
}
