import { createWorker, Worker } from "tesseract.js";
import { preprocessImageCanvas } from "./image-preprocessor";

let sharedWorker: Worker | null = null;

export interface OCRExtractionResult {
  text: string;
  confidence: number; // 0 to 100
  wordsCount: number;
}

/**
 * Obtiene o crea un Worker de Tesseract configurado para documentos en español.
 */
export async function getTesseractWorker(
  onProgress?: (progress: number, status: string) => void
): Promise<Worker> {
  if (!sharedWorker) {
    onProgress?.(5, "Inicializando motor OCR en navegador...");
    const worker = await createWorker("spa+eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && typeof m.progress === "number") {
          onProgress?.(
            Math.round(20 + m.progress * 75),
            `Reconociendo texto: ${Math.round(m.progress * 100)}%`
          );
        }
      },
    });
    sharedWorker = worker;
  }
  return sharedWorker;
}

/**
 * Ejecuta OCR sobre un elemento Canvas HTML preprocesándolo para máxima nitidez.
 */
export async function recognizeCanvas(
  canvas: HTMLCanvasElement,
  onProgress?: (progress: number, status: string) => void
): Promise<OCRExtractionResult> {
  const worker = await getTesseractWorker(onProgress);

  // Preprocesar con aumento de contraste y escala de grises
  const enhancedCanvas = preprocessImageCanvas(canvas, {
    grayscale: true,
    contrast: 1.3,
    binarize: false,
  });

  const ret = await worker.recognize(enhancedCanvas);

  return {
    text: ret.data.text.trim(),
    confidence: ret.data.confidence,
    wordsCount: ret.data.words?.length || 0,
  };
}

/**
 * Libera la memoria del Web Worker cuando no se utiliza.
 */
export async function terminateTesseractWorker(): Promise<void> {
  if (sharedWorker) {
    await sharedWorker.terminate();
    sharedWorker = null;
  }
}
