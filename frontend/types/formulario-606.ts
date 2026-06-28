// Campos exactos del Formato 606 de la DGII
export interface Registro606 {
  id: string;
  rnc_proveedor: string;         // RNC o cédula del proveedor
  tipo_id: "1" | "2" | "3";     // 1=RNC, 2=Cédula, 3=Pasaporte
  ncf: string;                   // Número de comprobante fiscal
  ncf_modificado?: string;       // NCF nota de crédito/débito (si aplica)
  tipo_compra: string;           // Tipo de bienes/servicios (01-16)
  fecha_comprobante: string;     // YYYYMMDD
  fecha_pago: string;            // YYYYMMDD
  monto_bienes: number;
  monto_servicios: number;
  total_facturado: number;
  itbis_facturado: number;
  itbis_retenido: number;
  itbis_proporcional: number;
  costo_servicio: number;
  bienes_capital: number;
  gastos_sujetos: number;
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
