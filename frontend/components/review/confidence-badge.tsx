"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { EstadoRevision } from "@/types/fiscal-document";
import { cn } from "@/lib/utils/cn";

interface ConfidenceBadgeProps {
  confianza: number;
  estado: EstadoRevision;
  fueModificado?: boolean;
}

export function ConfidenceBadge({
  confianza,
  estado,
  fueModificado,
}: ConfidenceBadgeProps) {
  const porcentaje = Math.round(confianza * 100);

  if (fueModificado) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-950/60 text-purple-300 border border-purple-800/40">
        Editado
      </span>
    );
  }

  if (estado === "validado" || confianza >= 0.85) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        {porcentaje}%
      </span>
    );
  }

  if (estado === "pendiente_revision" || confianza >= 0.5) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40">
        <AlertTriangle className="w-3 h-3 text-amber-400" />
        {porcentaje}%
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-950/60 text-rose-300 border border-rose-800/40">
      <XCircle className="w-3 h-3 text-rose-400" />
      {porcentaje}%
    </span>
  );
}

