// Campos exactos del Formato 606 de la DGII
export interface Registro606 {
  id: string;
  rnc_proveedor: string;         // RNC o cédula del proveedor
  tipo_id: "1" | "2";            // 1=RNC, 2=Cédula
  tipo_compra: string;           // Tipo de bienes/servicios (01-11)
  ncf: string;                   // Número de comprobante fiscal
  ncf_modificado?: string;       // NCF nota de crédito/débito (si aplica)
  fecha_comprobante: string;     // YYYYMMDD
  fecha_pago?: string;           // YYYYMMDD (opcional)
  monto_servicios: number;       // Monto Facturado en Servicios
  monto_bienes: number;          // Monto Facturado en Bienes
  total_facturado: number;       // Total Facturado (calculado)
  itbis_facturado: number;       // ITBIS Facturado
  itbis_retenido: number;        // ITBIS Retenido
  itbis_proporcional: number;    // ITBIS sujeto a Proporcionalidad (Art. 349)
  itbis_costo: number;           // ITBIS llevado al Costo
  itbis_adelantar: number;       // ITBIS por Adelantar (calculado)
  itbis_percibido: number;       // ITBIS percibido en compras
  tipo_retencion_isr?: string;   // Tipo de Retención en ISR (1-9)
  monto_retencion_renta: number; // Monto Retención Renta
  isr_percibido: number;         // ISR Percibido en compras
  impuesto_selectivo: number;    // Impuesto Selectivo al Consumo
  otros_impuestos: number;       // Otros Impuestos/Tasas
  propina_legal: number;         // Monto Propina Legal
  forma_pago?: string;           // Forma de Pago (1-7)
  // Estado interno (no va en el TXT)
  valido: boolean;
  errores?: string[];
}

export interface Declaracion606 {
  id: string;
  periodo: string;               // YYYYMM
  rnc_empresa: string;
  registros: Registro606[];
  estado: "borrador" | "validado" | "enviado";
  version_formulario: string;
  creado_en: string;
  actualizado_en: string;
}

// Respuesta del backend al extraer datos
export interface ExtractResponse {
  registros: Registro606[];
  advertencias: string[];
  archivos_procesados: number;
}
