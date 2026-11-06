import { NivelConfianza, EstadoRevision } from "@/types/fiscal-document";

/**
 * Valida un RNC de 9 dígitos usando el algoritmo de Módulo 11 oficial de la DGII.
 */
export function validarRncModulo11(rnc: string): boolean {
  const clean = rnc.replace(/\D/g, "");
  if (clean.length !== 9) return false;

  const pesos = [7, 9, 8, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 8; i++) {
    suma += parseInt(clean[i], 10) * pesos[i];
  }
  const resto = suma % 11;
  let digitoVerificador = 0;
  if (resto === 0) {
    digitoVerificador = 2;
  } else if (resto === 1) {
    digitoVerificador = 1;
  } else {
    digitoVerificador = 11 - resto;
  }

  return digitoVerificador === parseInt(clean[8], 10);
}

/**
 * Valida una Cédula dominicana de 11 dígitos usando el algoritmo de Luhn (Módulo 10).
 */
export function validarCedulaLuhn(cedula: string): boolean {
  const clean = cedula.replace(/\D/g, "");
  if (clean.length !== 11) return false;

  const multiplicadores = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    const prod = parseInt(clean[i], 10) * multiplicadores[i];
    suma += Math.floor(prod / 10) + (prod % 10);
  }
  const verificador = (10 - (suma % 10)) % 10;
  return verificador === parseInt(clean[10], 10);
}

/**
 * Parsea montos de texto con comas o puntos a número estándar.
 */
export function parsearMonto(texto?: string): number {
  if (!texto) return 0;
  let s = texto.replace(/[^0-9.,-]/g, "").trim();
  if (!s) return 0;

  if (s.includes(",") && s.includes(".")) {
    if (s.lastIndexOf(",") < s.lastIndexOf(".")) {
      s = s.replace(/,/g, "");
    } else {
      s = s.replace(/\./g, "").replace(/,/g, ".");
    }
  } else if (s.includes(",") && !s.includes(".")) {
    const partes = s.split(",");
    if (partes.length === 2 && partes[1].length === 2) {
      s = s.replace(/,/g, ".");
    } else {
      s = s.replace(/,/g, "");
    }
  }

  const num = parseFloat(s);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Normaliza cualquier formato de fecha reconocido a YYYYMMDD.
 */
export function normalizarFechaYYYYMMDD(fechaStr?: string): string {
  if (!fechaStr) return "";
  const clean = fechaStr.trim().replace(/[/.-]/g, "/");
  const partes = clean.split("/");

  if (partes.length === 3) {
    let dia = "";
    let mes = "";
    let anio = "";

    if (partes[0].length === 4) {
      anio = partes[0];
      mes = partes[1].padStart(2, "0");
      dia = partes[2].padStart(2, "0");
    } else {
      dia = partes[0].padStart(2, "0");
      mes = partes[1].padStart(2, "0");
      anio = partes[2];
      if (anio.length === 2) anio = `20${anio}`;
    }

    if (anio.length === 4 && parseInt(mes, 10) >= 1 && parseInt(mes, 10) <= 12 && parseInt(dia, 10) >= 1 && parseInt(dia, 10) <= 31) {
      return `${anio}${mes}${dia}`;
    }
  }

  return "";
}

/**
 * Determina el nivel de confianza cualitativo a partir del score numérico.
 */
export function obtenerNivelConfianza(score: number): NivelConfianza {
  if (score >= 0.85) return "alta";
  if (score >= 0.5) return "media";
  return "baja";
}

/**
 * Determina el estado de revisión sugerido.
 */
export function evaluarEstadoRevision(score: number, esInvalido: boolean = false): EstadoRevision {
  if (esInvalido) return "invalido";
  if (score >= 0.9) return "validado";
  return "pendiente_revision";
}

