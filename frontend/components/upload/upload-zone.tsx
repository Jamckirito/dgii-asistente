"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import type { ExtractResponse } from "@/types/formulario-606";

interface UploadZoneProps {
  formulario: "606" | "607" | "608" | "609";
  onDataExtracted?: (data: ExtractResponse) => void;
}

type UploadState = "idle" | "uploading" | "processing" | "done" | "error";

export function UploadZone({ formulario, onDataExtracted }: UploadZoneProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setFiles(acceptedFiles);
      setState("uploading");

      try {
        const formData = new FormData();
        acceptedFiles.forEach((file) => formData.append("files", file));
        formData.append("formulario", formulario);

        setState("processing");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/extract`,
          { method: "POST", body: formData }
        );

        if (!res.ok) throw new Error("Error al procesar los archivos");

        const data = await res.json();
        onDataExtracted?.(data);
        setState("done");
        toast.success(
          `${data.registros?.length ?? 0} registros extraídos del Formato ${formulario}`
        );
      } catch (err) {
        setState("error");
        toast.error("No se pudieron extraer los datos. Revisa el archivo e intenta de nuevo.");
        console.error(err);
      }
    },
    [formulario, onDataExtracted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpg", ".jpeg", ".png"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    multiple: true,
    disabled: state === "uploading" || state === "processing",
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer select-none",
        isDragActive
          ? "border-blue-500 bg-blue-950/20"
          : "border-neutral-700 hover:border-neutral-500 bg-neutral-900/40",
        (state === "uploading" || state === "processing") &&
          "pointer-events-none opacity-70"
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-3">
        {state === "idle" || state === "done" ? (
          <Upload
            className={cn(
              "w-10 h-10 transition-colors",
              isDragActive ? "text-blue-400" : "text-neutral-500"
            )}
          />
        ) : state === "error" ? (
          <AlertCircle className="w-10 h-10 text-red-400" />
        ) : (
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        )}

        <div>
          <p className="font-semibold text-neutral-200">
            {state === "idle" && "Arrastra los archivos aquí"}
            {state === "uploading" && "Subiendo archivos..."}
            {state === "processing" && "La IA está extrayendo los datos..."}
            {state === "done" && "¡Extracción completada!"}
            {state === "error" && "Error al procesar"}
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            PDF, imágenes JPG/PNG, Excel o CSV · Puedes subir varios a la vez
          </p>
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {files.map((f) => (
              <span
                key={f.name}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 text-xs text-neutral-300"
              >
                <FileText className="w-3 h-3" />
                {f.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
