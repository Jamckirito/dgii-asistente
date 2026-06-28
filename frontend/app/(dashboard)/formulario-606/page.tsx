"use client";

import { useState } from "react";
import { UploadZone } from "@/components/upload/upload-zone";
import { Form606Table } from "@/components/formulario-606/form-606-table";
import { Form606Header } from "@/components/formulario-606/form-606-header";
import type { Registro606, ExtractResponse } from "@/types/formulario-606";

export default function Formulario606Page() {
  const [registros, setRegistros] = useState<Registro606[]>([]);

  function handleDataExtracted(data: ExtractResponse) {
    // Asignar IDs locales a los registros devueltos por el backend
    const conIds = data.registros.map((r, i) => ({
      ...r,
      id: crypto.randomUUID(),
      valido: true,
    }));
    setRegistros(conIds);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Form606Header registros={registros} />
      <UploadZone formulario="606" onDataExtracted={handleDataExtracted} />
      <Form606Table registros={registros} onRegistrosChange={setRegistros} />
    </div>
  );
}
