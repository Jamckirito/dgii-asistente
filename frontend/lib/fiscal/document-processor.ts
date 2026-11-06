import {
  DocumentoFiscalProcesado,
  CampoExtraido,
  EstadoRevision,
} from "@/types/fiscal-document";
import { extractFromPDF } from "@/lib/ocr/pdf-extractor";
import { fileToCanvas } from "@/lib/ocr/image-preprocessor";
import { recognizeCanvas } from "@/lib/ocr/tesseract-worker";
import { calcularHashSHA256 } from "@/lib/storage/supabase-storage";
import { PATRONES_DGII } from "./regex-patterns";
import {
  validarRncModulo11,
  validarCedulaLuhn,
  parsearMonto,
  normalizarFechaYYYYMMDD,
  evaluarEstadoRevision,
} from "./validation-rules";
import { clasificarDocumentoFiscal } from "./classifier";

function crearCampo<T>(
  valor: T,
  textoOriginal: string = "",
  confianza: number = 0.5,
  esInvalido: boolean = false,
  mensaje?: string
): CampoExtraido<T> {
  const estado: EstadoRevision = evaluarEstadoRevision(confianza, esInvalido);
  return {
    valor,
    texto_original: textoOriginal,
    confianza,
    estado,
    fue_modificado_manualmente: false,
    valor_original: valor,
    mensaje_validacion: mensaje,
  };
}

export async function procesarDocumentoLocal(
  file: File,
  empresaId: string,
  rncEmpresaActual: string,
  onProgress?: (progress: number, status: string) => void
): Promise<DocumentoFiscalProcesado> {
  onProgress?.(5, "Calculando firma digital SHA-256...");
  const sha256 = await calcularHashSHA256(file);

  let rawText = "";
  const advertencias: string[] = [];

  // 1. Extracción de texto según formato
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    onProgress?.(15, "Analizando estructura del documento PDF...");
    const pdfRes = await extractFromPDF(file, 5, onProgress);

    if (pdfRes.isScanned) {
      onProgress?.(40, "PDF escaneado detectado. Iniciando OCR local...");
      const pageTexts: string[] = [];
      for (let i = 0; i < pdfRes.pages.length; i++) {
        const p = pdfRes.pages[i];
        if (p.canvas) {
          const ocrRes = await recognizeCanvas(p.canvas, (prog, st) => {
            onProgress?.(40 + Math.round((prog * 0.5) / pdfRes.pages.length), st);
          });
          pageTexts.push(ocrRes.text);
        }
      }
      rawText = pageTexts.join("\n\n");
    } else {
      rawText = pdfRes.fullText;
    }
  } else if (file.type.startsWith("image/")) {
    onProgress?.(20, "Cargando imagen en procesador de Canvas...");
    const canvas = await fileToCanvas(file);
    onProgress?.(35, "Reconociendo texto e información fiscal con OCR...");
    const ocrRes = await recognizeCanvas(canvas, onProgress);
    rawText = ocrRes.text;
  } else {
    throw new Error(`Tipo de archivo no soportado para extracción: ${file.type}`);
  }

  onProgress?.(85, "Interpretando datos fiscales y reglas de la DGII...");

  // 2. Extracción de NCF y e-CF
  let ncf = "";
  let ncfConfianza = 0.0;
  const matchEcf = rawText.match(PATRONES_DGII.E_CF);
  const matchNcf = rawText.match(PATRONES_DGII.NCF);

  if (matchEcf) {
    ncf = matchEcf[1].toUpperCase();
    ncfConfianza = 0.95;
  } else if (matchNcf) {
    ncf = matchNcf[1].toUpperCase();
    ncfConfianza = 0.95;
  } else {
    const matchGen = rawText.match(PATRONES_DGII.E_CF_GENERICO) || rawText.match(PATRONES_DGII.NCF_GENERICO);
    if (matchGen && matchGen[0]) {
      ncf = matchGen[0].toUpperCase();
      ncfConfianza = 0.75;
    } else {
      advertencias.push("No se pudo identificar un NCF o e-CF válido en el comprobante.");
    }
  }

  // NCF Modificado (Nota de Crédito/Débito)
  let ncfModificado = "";
  const matchMod = rawText.match(PATRONES_DGII.NCF_MODIFICADO);
  if (matchMod) {
    ncfModificado = matchMod[1].toUpperCase();
  }

  // 3. Extracción de RNCs
  const matchRnc = rawText.match(PATRONES_DGII.RNC);
  const rncCandidates: string[] = [];
  const genRncs = rawText.match(PATRONES_DGII.RNC_GENERICO) || [];
  genRncs.forEach((r) => {
    const c = r.replace(/\D/g, "");
    if (c.length === 9 && validarRncModulo11(c) && !rncCandidates.includes(c)) {
      rncCandidates.push(c);
    }
  });

  let rncEmisor = matchRnc ? matchRnc[1].replace(/\D/g, "") : (rncCandidates[0] || "");
  const esRncValido = rncEmisor.length === 9 ? validarRncModulo11(rncEmisor) : false;
  if (!esRncValido && rncEmisor) {
    advertencias.push(`El RNC del emisor '${rncEmisor}' no supera el dígito verificador.`);
  }

  // 4. Fechas
  const matchFechaEmision = rawText.match(PATRONES_DGII.FECHA_EMISION);
  const fechaEmision = normalizarFechaYYYYMMDD(matchFechaEmision ? matchFechaEmision[1] : "");
  const matchFechaPago = rawText.match(PATRONES_DGII.FECHA_PAGO);
  const fechaPago = normalizarFechaYYYYMMDD(matchFechaPago ? matchFechaPago[1] : "");

  // 5. Montos económicos
  const matchTotal = rawText.match(PATRONES_DGII.TOTAL_FACTURADO);
  const totalFacturado = parsearMonto(matchTotal ? matchTotal[1] : undefined);

  const matchSubtotal = rawText.match(PATRONES_DGII.SUBTOTAL);
  const subtotal = parsearMonto(matchSubtotal ? matchSubtotal[1] : undefined);

  const matchItbis = rawText.match(PATRONES_DGII.ITBIS);
  const itbisFacturado = parsearMonto(matchItbis ? matchItbis[1] : undefined);

  const matchItbisRet = rawText.match(PATRONES_DGII.ITBIS_RETENIDO);
  const itbisRetenido = parsearMonto(matchItbisRet ? matchItbisRet[1] : undefined);

  const matchIsrRet = rawText.match(PATRONES_DGII.ISR_RETENIDO);
  const isrRetenido = parsearMonto(matchIsrRet ? matchIsrRet[1] : undefined);

  const matchIsc = rawText.match(PATRONES_DGII.IMPUESTO_SELECTIVO);
  const impuestoSelectivo = parsearMonto(matchIsc ? matchIsc[1] : undefined);

  const matchOtrosImp = rawText.match(PATRONES_DGII.OTROS_IMPUESTOS);
  const otrosImpuestos = parsearMonto(matchOtrosImp ? matchOtrosImp[1] : undefined);

  const matchPropina = rawText.match(PATRONES_DGII.PROPINA_LEGAL);
  const propinaLegal = parsearMonto(matchPropina ? matchPropina[1] : undefined);

  // 6. Clasificación de formato DGII
  onProgress?.(95, "Determinando formato DGII correspondiente...");
  const clasificacion = clasificarDocumentoFiscal(
    rawText,
    rncEmisor,
    "",
    rncEmpresaActual,
    ncf
  );

  onProgress?.(100, "Procesamiento completado con éxito.");

  const docId = crypto.randomUUID();

  return {
    id: docId,
    empresa_id: empresaId,
    user_id: "",
    nombre_archivo: file.name,
    tamano_bytes: file.size,
    hash_sha256: sha256,
    tipo_documento: clasificacion.tipoDocumento,
    formato_sugerido: clasificacion.formato,
    estado_general: advertencias.length === 0 ? "validado" : "pendiente_revision",
    advertencias,
    raw_text: rawText,
    emisor: {
      rnc: crearCampo(rncEmisor, matchRnc?.[0], esRncValido ? 0.95 : 0.4, !esRncValido),
      razon_social: crearCampo("", "", 0.4),
    },
    comprador: {
      rnc: crearCampo("", "", 0.4),
      razon_social: crearCampo("", "", 0.4),
    },
    comprobante: {
      tipo_ncf: crearCampo(ncf.substring(0, 3), "", ncfConfianza),
      ncf: crearCampo(ncf, ncf, ncfConfianza, !ncf),
      ncf_modificado: ncfModificado ? crearCampo(ncfModificado, ncfModificado, 0.9) : undefined,
      fecha_emision: crearCampo(fechaEmision, matchFechaEmision?.[0], fechaEmision ? 0.9 : 0.3),
      fecha_pago: fechaPago ? crearCampo(fechaPago, matchFechaPago?.[0], 0.85) : undefined,
      moneda: crearCampo("DOP", "", 0.9),
    },
    economia: {
      monto_servicios: crearCampo(0, "", 0.5),
      monto_bienes: crearCampo(subtotal || totalFacturado, "", 0.7),
      total_facturado: crearCampo(totalFacturado, matchTotal?.[0], totalFacturado > 0 ? 0.9 : 0.4),
      monto_exento: crearCampo(0, "", 0.5),
      monto_gravado: crearCampo(subtotal, matchSubtotal?.[0], subtotal > 0 ? 0.85 : 0.4),
      itbis_facturado: crearCampo(itbisFacturado, matchItbis?.[0], itbisFacturado > 0 ? 0.9 : 0.5),
      itbis_retenido: crearCampo(itbisRetenido, matchItbisRet?.[0], itbisRetenido > 0 ? 0.9 : 0.5),
      monto_retencion_renta: crearCampo(isrRetenido, matchIsrRet?.[0], isrRetenido > 0 ? 0.9 : 0.5),
      impuesto_selectivo: crearCampo(impuestoSelectivo, matchIsc?.[0], 0.8),
      otros_impuestos: crearCampo(otrosImpuestos, matchOtrosImp?.[0], 0.8),
      propina_legal: crearCampo(propinaLegal, matchPropina?.[0], 0.8),
    },
    creado_en: new Date().toISOString(),
    actualizado_en: new Date().toISOString(),
  };
}

