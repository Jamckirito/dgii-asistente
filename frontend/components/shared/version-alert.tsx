"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function VersionAlert() {
  const [alert, setAlert] = useState<{ date: string } | null>(null);

  useEffect(() => {
    fetch("/api/check-form-version?form=606")
      .then((r) => r.json())
      .then((data) => {
        if (data.updated && data.date) setAlert({ date: data.date });
      })
      .catch(() => {}); // Silencioso — no crítico
  }, []);

  if (!alert) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-950/50 border-b border-amber-800/50 text-sm">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
      <p className="text-amber-200 flex-1">
        <span className="font-semibold">Nueva versión del Formato 606</span> disponible en dgii.gov.do
        (actualizado el {alert.date}). La app ya usa la versión más reciente.
      </p>
      <button
        onClick={() => setAlert(null)}
        className="text-amber-500 hover:text-amber-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
