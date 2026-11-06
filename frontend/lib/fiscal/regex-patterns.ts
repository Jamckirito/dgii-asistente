// =========================================================================
// Patrones de Expresiones Regulares para Documentos Fiscales de República Dominicana
// =========================================================================

export const PATRONES_DGII = {
  // RNC de 9 dígitos (con o sin guiones)
  RNC: /(?:RNC|R\.N\.C\.?|REGISTRO\s+NACIONAL)[\s.:#-]*(\d{1}-?\d{2}-?\d{5}-?\d{1}|\d{9})\b/i,
  RNC_GENERICO: /\b(\d{1}-\d{2}-\d{5}-\d{1}|\d{9})\b/g,

  // Cédula de 11 dígitos
  CEDULA: /(?:C[EÉ]DULA|CED\.?)[\s.:#-]*(\d{3}-?\d{7}-?\d{1}|\d{11})\b/i,
  CEDULA_GENERICA: /\b(\d{3}-\d{7}-\d{1}|\d{11})\b/g,

  // NCF tradicional (Prefijo B seguido de 2 dígitos de tipo + 8 dígitos secuenciales)
  NCF: /(?:NCF|N\.C\.F\.?|COMPROBANTE\s+FISCAL)[\s.:#-]*([bB](?:01|02|03|04|11|12|13|14|15|16|17)\d{8})\b/i,
  NCF_GENERICO: /\b([bB](?:01|02|03|04|11|12|13|14|15|16|17)\d{8})\b/g,

  // Comprobante Fiscal Electrónico e-CF (Prefijo E seguido de 2 dígitos de tipo + 10 dígitos secuenciales)
  E_CF: /(?:e-CF|E-CF|ECF|COMPROBANTE\s+ELECTR[OÓ]NICO)[\s.:#-]*([eE](?:31|32|33|34|41|43|44|45|46|47)\d{10})\b/i,
  E_CF_GENERICO: /\b([eE](?:31|32|33|34|41|43|44|45|46|47)\d{10})\b/g,

  // NCF Modificado (Afectado por Nota de Crédito/Débito)
  NCF_MODIFICADO: /(?:NCF\s+MODIFICADO|COMPROBANTE\s+AFECTADO|APLICA\s+A)[\s.:#-]*([bBeE][0-9]{10,12})\b/i,

  // Fechas (DD/MM/YYYY, YYYY-MM-DD, etc.)
  FECHA_EMISION: /(?:FECHA(?:\s+DE\s+EMISI[OÓ]N)?|F\.\s*EMISI[OÓ]N)[\s.:#-]*(\d{1,2}[-/.](?:[0-9]{1,2}|[a-zA-Z]{3,4})[-/.][0-9]{2,4}|[0-9]{4}[-/.][0-9]{1,2}[-/.][0-9]{1,2})\b/i,
  FECHA_VENCIMIENTO: /(?:FECHA(?:\s+DE\s+)?VENCIMIENTO|F\.\s*VENC\.?|VENCE)[\s.:#-]*(\d{1,2}[-/.][0-9]{1,2}[-/.][0-9]{2,4}|[0-9]{4}[-/.][0-9]{1,2}[-/.][0-9]{1,2})\b/i,
  FECHA_PAGO: /(?:FECHA(?:\s+DE\s+)?PAGO|PAGADO\s+EL)[\s.:#-]*(\d{1,2}[-/.][0-9]{1,2}[-/.][0-9]{2,4}|[0-9]{4}[-/.][0-9]{1,2}[-/.][0-9]{1,2})\b/i,

  // Importes y montos monetarios
  TOTAL_FACTURADO: /(?:TOTAL(?:\s+A\s+PAGAR|\s+FACTURADO|\s+GENERAL)?|MONTO\s+TOTAL)[\s.:$RD]*([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})\b/i,
  SUBTOTAL: /(?:SUB-?TOTAL|VALOR\s+VENTA|MONTO\s+GRAVADO)[\s.:$RD]*([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})\b/i,
  MONTO_EXENTO: /(?:EXENTO|MONTO\s+EXENTO)[\s.:$RD]*([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})\b/i,

  ITBIS: /(?:ITBIS(?:\s*18%|\s*16%)?|I\.T\.B\.I\.S\.?)[\s.:$RD]*([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})\b/i,
  ITBIS_RETENIDO: /(?:ITBIS\s+RETENIDO|RETENCI[OÓ]N\s+(?:DE\s+)?ITBIS)[\s.:$RD]*([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})\b/i,
  ISR_RETENIDO: /(?:ISR\s+RETENIDO|RETENCI[OÓ]N\s+(?:DE\s+)?ISR|RETENCI[OÓ]N\s+RENTA)[\s.:$RD]*([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})\b/i,

  IMPUESTO_SELECTIVO: /(?:ISC|SELECTIVO|IMPUESTO\s+SELECTIVO)[\s.:$RD]*([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})\b/i,
  OTROS_IMPUESTOS: /(?:CDT|CONTRIB\.\s*DESARROLLO|OTROS\s+IMPUESTOS|TASAS)[\s.:$RD]*([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})\b/i,
  PROPINA_LEGAL: /(?:PROPINA(?:\s+LEGAL|\s+10%)?|LEY\s+10%)[\s.:$RD]*([0-9]{1,3}(?:[.,][0-9]{3})*[.,][0-9]{2})\b/i,

  // Indicadores de estado o tipo
  ANULADO: /\b(ANULAD[OA]|CANCELAD[OA]|SIN\s+EFECTO)\b/i,
  EXTERIOR: /\b(FOREIGN|INTERNATIONAL|OVERSEAS|NON-RESIDENT|EXTERIOR)\b/i,
};
