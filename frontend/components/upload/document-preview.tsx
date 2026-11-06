"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, FileText, Image as ImageIcon } from "lucide-react";

interface DocumentPreviewProps {
  file?: File;
  fileUrl?: string;
  className?: string;
}

export function DocumentPreview({ file, fileUrl, className }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(100);

  const url = file ? URL.createObjectURL(file) : fileUrl;
  const isPdf = file ? file.type === "application/pdf" || file.name.endsWith(".pdf") : fileUrl?.includes(".pdf");

  function zoomIn() {
    setZoom((z) => Math.min(250, z + 25));
  }

  function zoomOut() {
    setZoom((z) => Math.max(50, z - 25));
  }

  function resetZoom() {
    setZoom(100);
  }

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] border border-dashed border-neutral-800 rounded-xl p-8 text-neutral-500">
        <FileText className="w-12 h-12 mb-3 text-neutral-600" />
        <p className="text-sm font-medium">Ningún documento seleccionado</p>
        <p className="text-xs text-neutral-600 mt-1">Selecciona un archivo para previsualizarlo aquí</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden ${className || ""}`}>
      {/* Barra de Controles de Zoom */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          {isPdf ? <FileText className="w-4 h-4 text-rose-400" /> : <ImageIcon className="w-4 h-4 text-blue-400" />}
          <span className="font-medium text-neutral-200 truncate max-w-[200px]">{file?.name || "Comprobante"}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800">
          <button
            onClick={zoomOut}
            title="Reducir zoom"
            className="p-1 hover:text-neutral-200 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] px-1">{zoom}%</span>
          <button
            onClick={zoomIn}
            title="Aumentar zoom"
            className="p-1 hover:text-neutral-200 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetZoom}
            title="Restablecer zoom"
            className="p-1 hover:text-neutral-200 border-l border-neutral-800 pl-1.5 ml-0.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visor con desplazamiento */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-neutral-950">
        {isPdf ? (
          <iframe
            src={`${url}#toolbar=0&navpanes=0`}
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            className="w-full h-full min-h-[600px] rounded border border-neutral-800 transition-transform duration-150"
            title="Visor PDF"
          />
        ) : (
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
            className="transition-transform duration-150 max-w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Comprobante fiscal" className="max-w-full max-h-[75vh] object-contain rounded shadow-lg" />
          </div>
        )}
      </div>
    </div>
  );
}

