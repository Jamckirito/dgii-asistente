/**
 * Utilidades de preprocesamiento de imágenes usando Canvas API del navegador.
 * Mejora el contraste, convierte a escala de grises y binariza tickets o facturas
 * con papel térmico o fondos ruidosos antes de enviarlas al motor OCR.
 */

export interface PreprocessingOptions {
  grayscale?: boolean;
  contrast?: number; // e.g. 1.2 (+20%)
  binarize?: boolean;
  threshold?: number; // 0 to 255 (default 128)
  scale?: number; // Factor de reescalado para imágenes pequeñas (ej. 1.5)
}

export function preprocessImageCanvas(
  sourceCanvas: HTMLCanvasElement,
  options: PreprocessingOptions = {}
): HTMLCanvasElement {
  const {
    grayscale = true,
    contrast = 1.25,
    binarize = false,
    threshold = 135,
    scale = 1.0,
  } = options;

  const width = Math.round(sourceCanvas.width * scale);
  const height = Math.round(sourceCanvas.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return sourceCanvas;

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(sourceCanvas, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;

  // Factor de contraste
  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];

    if (grayscale || binarize) {
      // Luminancia ITU-R BT.601
      let gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

      // Aplicar contraste
      gray = Math.min(255, Math.max(0, Math.round(factor * (gray - 128) + 128)));

      if (binarize) {
        gray = gray >= threshold ? 255 : 0;
      }

      d[i] = gray;
      d[i + 1] = gray;
      d[i + 2] = gray;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Carga un archivo de imagen en un elemento Canvas HTML.
 */
export async function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo obtener el contexto 2D de Canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error(`Error cargando imagen en Canvas: ${err}`));
    };

    img.src = url;
  });
}
