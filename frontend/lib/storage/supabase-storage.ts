import { createBrowserClient } from "@/lib/supabase/client";

/**
 * Calcula el hash SHA-256 del contenido de un archivo en el navegador
 * utilizando la Web Crypto API nativa (sin librerías externas pesadas).
 */
export async function calcularHashSHA256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface SubidaStorageResultado {
  storagePath: string;
  sha256: string;
}

/**
 * Sube el archivo original de forma segura al bucket privado 'comprobantes-fiscales'.
 * Estructura de ruta: {empresaId}/{YYYYMM}/{sha256}_{nombreArchivo}
 */
export async function subirComprobantePrivado(
  file: File,
  empresaId: string,
  periodo: string
): Promise<SubidaStorageResultado> {
  const supabase = createBrowserClient();
  const sha256 = await calcularHashSHA256(file);

  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${empresaId}/${periodo}/${sha256.substring(0, 12)}_${cleanFileName}`;

  const { error } = await supabase.storage
    .from("comprobantes-fiscales")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error(`Error al almacenar comprobante en storage privado: ${error.message}`);
  }

  return {
    storagePath: path,
    sha256,
  };
}

/**
 * Genera una URL firmada temporal con expiración de 60 segundos
 * para previsualizar el documento de forma privada (sin enlace público).
 */
export async function obtenerUrlFirmada(storagePath: string): Promise<string> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.storage
    .from("comprobantes-fiscales")
    .createSignedUrl(storagePath, 60);

  if (error || !data?.signedUrl) {
    throw new Error(`No se pudo generar URL firmada para previsualización: ${error?.message}`);
  }

  return data.signedUrl;
}

