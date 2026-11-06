import { FormatoDGII, TipoDocumentoFiscal } from "@/types/fiscal-document";
import { PATRONES_DGII } from "./regex-patterns";

export interface ClasificacionFiscalResultado {
  formato: FormatoDGII;
  tipoDocumento: TipoDocumentoFiscal;
  razon: string;
  confianza: number;
}

/**
 * Motor heurístico de clasificación fiscal para República Dominicana.
 * Determina automáticamente si el documento corresponde a 606, 607, 608 o 609.
 */
export function clasificarDocumentoFiscal(
  rawText: string,
  rncEmisorIdentificado: string,
  rncCompradorIdentificado: string,
  rncEmpresaActual: string,
  ncfIdentificado: string
): ClasificacionFiscalResultado {
  const textUpper = rawText.toUpperCase();
  const cleanEmpresaRnc = rncEmpresaActual.replace(/\D/g, "");
  const cleanEmisorRnc = rncEmisorIdentificado.replace(/\D/g, "");
  const cleanCompradorRnc = rncCompradorIdentificado.replace(/\D/g, "");

  // 1. Detección de Comprobantes Anulados (Formato 608)
  if (PATRONES_DGII.ANULADO.test(textUpper) || textUpper.includes("COMPROBANTE ANULADO")) {
    return {
      formato: "608",
      tipoDocumento: "comprobante_anulado",
      razon: "El documento contiene marcas explícitas de comprobante fiscal anulado o sin efecto.",
      confianza: 0.95,
    };
  }

  // 2. Detección de Pagos al Exterior (Formato 609)
  const esProveedorExtranjero =
    PATRONES_DGII.EXTERIOR.test(textUpper) ||
    textUpper.includes("INVOICE") ||
    textUpper.includes("WIRE TRANSFER") ||
    (cleanEmisorRnc.length === 0 && (textUpper.includes("USD") || textUpper.includes("EUR")));

  if (esProveedorExtranjero && !cleanEmisorRnc) {
    return {
      formato: "609",
      tipoDocumento: "pago_exterior",
      razon: "Factura o pago internacional por servicios al exterior sin RNC dominicano.",
      confianza: 0.85,
    };
  }

  // 3. Detección de Ventas (Formato 607)
  // Si el RNC emisor es idéntico al RNC de la empresa del usuario
  if (cleanEmpresaRnc && cleanEmisorRnc === cleanEmpresaRnc) {
    return {
      formato: "607",
      tipoDocumento: ncfIdentificado.startsWith("B04") || ncfIdentificado.startsWith("E34")
        ? "nota_credito"
        : "factura_venta",
      razon: "El emisor del comprobante coincide con el RNC de la empresa activa (Factura emitida/Ingreso).",
      confianza: 0.98,
    };
  }

  // Si el comprador es la empresa actual, o el emisor es un tercero con RNC dominicano
  if (cleanEmpresaRnc && cleanCompradorRnc === cleanEmpresaRnc) {
    return {
      formato: "606",
      tipoDocumento: ncfIdentificado.startsWith("B04") || ncfIdentificado.startsWith("E34")
        ? "nota_credito"
        : "factura_compra",
      razon: "La empresa activa figura como cliente/comprador (Gasto o compra de bienes/servicios recibidos).",
      confianza: 0.95,
    };
  }

  // 4. Por defecto para NCF con crédito fiscal B01 o e-CF E31 recibido
  const esNotaCredito = ncfIdentificado.startsWith("B04") || ncfIdentificado.startsWith("E34");

  return {
    formato: "606",
    tipoDocumento: esNotaCredito ? "nota_credito" : "factura_compra",
    razon: "Clasificado por defecto como Compras de bienes y servicios (Formato 606).",
    confianza: 0.8,
  };
}
