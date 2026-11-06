// =========================================================================
// DGII Asistente — Definición de Tipos Fiscales y Procesamiento Documental
// =========================================================================

export type FormatoDGII = "606" | "607" | "608" | "609";

export type TipoDocumentoFiscal =
  | "factura_compra"
  | "factura_venta"
  | "nota_credito"
  | "nota_debito"
  | "comprobante_anulado"
  | "pago_exterior"
  | "gasto_menor"
  | "desconocido";

export type EstadoRevision = "validado" | "pendiente_revision" | "invalido";
export type NivelConfianza = "alta" | "media" | "baja";

export interface CampoExtraido<T = string> {
  valor: T;
  texto_original?: string;
  pagina?: number;
  confianza: number; // 0.00 a 1.00
  estado: EstadoRevision;
  fue_modificado_manualmente: boolean;
  valor_original?: T;
  mensaje_validacion?: string;
}

export interface EmisorFiscal {
  rnc: CampoExtraido<string>;
  razon_social: CampoExtraido<string>;
  direccion?: CampoExtraido<string>;
  telefono?: CampoExtraido<string>;
}

export interface CompradorFiscal {
  rnc: CampoExtraido<string>;
  razon_social: CampoExtraido<string>;
}

export interface DatosComprobante {
  tipo_ncf: CampoExtraido<string>;
  ncf: CampoExtraido<string>;
  ncf_modificado?: CampoExtraido<string>;
  fecha_emision: CampoExtraido<string>; // YYYYMMDD
  fecha_vencimiento?: CampoExtraido<string>;
  fecha_pago?: CampoExtraido<string>;
  numero_referencia?: CampoExtraido<string>;
  moneda: CampoExtraido<string>; // DOP, USD, EUR
  tasa_cambio?: CampoExtraido<number>;
}

export interface DatosEconomicos {
  monto_servicios: CampoExtraido<number>;
  monto_bienes: CampoExtraido<number>;
  total_facturado: CampoExtraido<number>;
  monto_exento: CampoExtraido<number>;
  monto_gravado: CampoExtraido<number>;
  itbis_facturado: CampoExtraido<number>;
  itbis_retenido: CampoExtraido<number>;
  itbis_proporcional?: CampoExtraido<number>;
  itbis_costo?: CampoExtraido<number>;
  itbis_adelantar?: CampoExtraido<number>;
  itbis_percibido?: CampoExtraido<number>;
  tipo_retencion_isr?: CampoExtraido<string>;
  monto_retencion_renta: CampoExtraido<number>;
  isr_percibido?: CampoExtraido<number>;
  impuesto_selectivo: CampoExtraido<number>; // ISC
  otros_impuestos: CampoExtraido<number>;    // CDT, etc.
  propina_legal: CampoExtraido<number>;      // 10%
  descuento?: CampoExtraido<number>;
  monto_pagado?: CampoExtraido<number>;
  saldo_pendiente?: CampoExtraido<number>;
  forma_pago?: CampoExtraido<string>;
}

export interface DocumentoFiscalProcesado {
  id: string;
  empresa_id: string;
  user_id: string;
  nombre_archivo: string;
  tamano_bytes: number;
  hash_sha256: string;
  storage_path?: string;
  tipo_documento: TipoDocumentoFiscal;
  formato_sugerido: FormatoDGII;
  estado_general: EstadoRevision;
  advertencias: string[];
  emisor: EmisorFiscal;
  comprador: CompradorFiscal;
  comprobante: DatosComprobante;
  economia: DatosEconomicos;
  descripcion_lineas?: string[];
  raw_text?: string;
  creado_en: string;
  actualizado_en: string;
}

// -------------------------------------------------------------------------
// Formato 607: Ventas de Bienes y Servicios
// -------------------------------------------------------------------------
export interface Registro607 {
  id: string;
  documento_id?: string;
  declaracion_id?: string;
  rnc_cedula_cliente: string;
  tipo_identificacion: "1" | "2" | "3"; // 1=RNC, 2=Cédula, 3=Pasaporte
  ncf: string;
  ncf_modificado?: string;
  tipo_ingreso: string; // 01=Operacionales, 02=Financieros, 03=Extraordinarios, etc.
  fecha_comprobante: string; // YYYYMMDD
  fecha_retencion?: string;  // YYYYMMDD
  monto_facturado: number;
  itbis_facturado: number;
  itbis_retenido_terceros: number;
  itbis_percibido: number;
  retencion_renta_terceros: number;
  isr_percibido: number;
  impuesto_selectivo: number;
  otros_impuestos: number;
  propina_legal: number;
  monto_efectivo?: number;
  monto_cheque_transferencia?: number;
  monto_tarjeta?: number;
  monto_venta_credito?: number;
  monto_bonos_certificados?: number;
  monto_permuta?: number;
  monto_otras_formas?: number;
  valido: boolean;
  advertencias?: string[];
}

// -------------------------------------------------------------------------
// Formato 608: Comprobantes Fiscales Anulados
// -------------------------------------------------------------------------
export interface Registro608 {
  id: string;
  documento_id?: string;
  declaracion_id?: string;
  ncf: string;
  fecha_comprobante: string; // YYYYMMDD
  tipo_anulacion: string;    // 01: Deterioro, 02: Errores, 03: Faltante, etc.
  comentario?: string;
  valido: boolean;
  advertencias?: string[];
}

// -------------------------------------------------------------------------
// Formato 609: Pagos por Servicios al Exterior
// -------------------------------------------------------------------------
export interface Registro609 {
  id: string;
  documento_id?: string;
  declaracion_id?: string;
  identificacion_fiscal_beneficiario: string;
  razon_social_beneficiario: string;
  pais_residencia: string; // Código ISO o nombre
  fecha_pago: string;      // YYYYMMDD
  tipo_servicio_exterior: string; // Código DGII
  monto_moneda_extranjera: number;
  codigo_moneda: string;   // USD, EUR, etc.
  tasa_cambio: number;
  monto_pesos_dominicanos: number;
  retencion_isr: number;
  valido: boolean;
  advertencias?: string[];
}

