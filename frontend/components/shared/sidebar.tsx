"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText, History, Settings, LogOut, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV = [
  {
    group: "Formularios",
    items: [
      { href: "/formulario-606", label: "Formato 606", sub: "Compras", icon: FileText },
      { href: "/formulario-607", label: "Formato 607", sub: "Ventas", icon: FileText, disabled: true },
    ],
  },
  {
    group: "Registro",
    items: [
      { href: "/historial", label: "Historial", sub: "Períodos anteriores", icon: History },
      { href: "/configuracion", label: "Configuración", sub: "Empresa y cuenta", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createBrowserClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col border-r border-neutral-800 bg-neutral-950 h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-100 leading-none">DGII Asistente</p>
            <p className="text-xs text-neutral-500 mt-0.5">República Dominicana</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {NAV.map((group) => (
          <div key={group.group} className="mb-5">
            <p className="px-2 mb-1.5 text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
              {group.group}
            </p>
            {group.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.disabled ? "#" : item.href}
                  className={cn(
                    "flex items-center gap-3 px-2 py-2 rounded-lg mb-0.5 text-sm transition-colors group",
                    active
                      ? "bg-blue-600/15 text-blue-400"
                      : item.disabled
                      ? "text-neutral-700 cursor-not-allowed"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-none">{item.label}</p>
                    <p className="text-[11px] text-neutral-600 mt-0.5">{item.sub}</p>
                  </div>
                  {active && <ChevronRight className="w-3 h-3 shrink-0" />}
                  {item.disabled && (
                    <span className="text-[9px] font-bold bg-neutral-800 text-neutral-600 px-1.5 py-0.5 rounded">
                      PRONTO
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-neutral-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
