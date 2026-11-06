export interface PDFPageExtraction {
  pageNumber: number;
  text: string;
  hasNativeText: boolean;
  canvas?: HTMLCanvasElement;
}

export interface PDFDocumentResult {
  numPages: number;
  pages: PDFPageExtraction[];
  isScanned: boolean;
  fullText: string;
}

/**
 * Extrae texto nativo de un PDF digital.
 * Si el PDF es un escaneo (sin texto embebido), genera Canvas de cada página para OCR posterior.
 */
export async function extractFromPDF(
  file: File,
  maxPages: number = 10,
  onProgress?: (progress: number, status: string) => void
): Promise<PDFDocumentResult> {
  const pdfjs = await import("pdfjs-dist");

  // Configurar worker de PDF.js
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = Math.min(pdf.numPages, maxPages);
  const pages: PDFPageExtraction[] = [];
  let totalCharacters = 0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.(
      Math.round((pageNum / numPages) * 50),
      `Leyendo página ${pageNum} de ${numPages}...`
    );

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const textItems = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");

    const cleanText = textItems.trim();
    totalCharacters += cleanText.length;

    // Si tiene menos de 40 caracteres, probablemente sea un escaneo o imagen
    const isPageScanned = cleanText.length < 40;

    let canvas: HTMLCanvasElement | undefined;
    if (isPageScanned) {
      const viewport = page.getViewport({ scale: 2.0 }); // Escala 2x para nitidez OCR
      canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
    }

    pages.push({
      pageNumber: pageNum,
      text: cleanText,
      hasNativeText: !isPageScanned,
      canvas,
    });
  }

  const fullText = pages.map((p) => p.text).filter(Boolean).join("\n\n");
  const isScanned = totalCharacters < 50;

  return {
    numPages,
    pages,
    isScanned,
    fullText,
  };
}
