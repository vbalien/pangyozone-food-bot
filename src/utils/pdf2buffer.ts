// Source: https://github.com/mozilla/pdf.js/blob/master/examples/node/pdf2png/pdf2png.mjs

import { strict as assert } from "assert";
import Canvas from "canvas";
import { getDocument } from "pdfjs-dist";

class NodeCanvasFactory {
  create(width: number, height: number) {
    assert(width > 0 && height > 0, "Invalid canvas size");
    const canvas = Canvas.createCanvas(width, height);
    const context = canvas.getContext(
      "2d",
    ) as unknown as CanvasRenderingContext2D;
    return {
      canvas,
      context,
    };
  }

  reset(
    canvasAndContext: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) {
    assert(canvasAndContext.canvas, "Canvas is not specified");
    assert(width > 0 && height > 0, "Invalid canvas size");
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: CanvasRenderingContext2D) {
    assert(canvasAndContext.canvas, "Canvas is not specified");

    // Zeroing the width and height cause Firefox to release graphics
    // resources immediately, which can greatly reduce memory consumption.
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    // canvasAndContext.canvas = null;
    // canvasAndContext.context = null;
  }
}

// Some PDFs need external cmaps.
const CMAP_URL = "./node_modules/pdfjs-dist/cmaps/";
const CMAP_PACKED = true;

// Where the standard fonts are located.
const STANDARD_FONT_DATA_URL = "./node_modules/pdfjs-dist/standard_fonts/";

export async function pdf2image(
  buffer: ArrayBuffer,
  scale: number,
): Promise<Buffer> {
  const canvasFactory = new NodeCanvasFactory();

  // Load the PDF file.
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    cMapUrl: CMAP_URL,
    cMapPacked: CMAP_PACKED,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
    canvasFactory,
  });

  const pdfDocument = await loadingTask.promise;
  console.log("# PDF document loaded.");
  // Get the first page.
  const page = await pdfDocument.getPage(1);
  // Render the page on a Node canvas with 100% scale.
  const viewport = page.getViewport({ scale });
  const canvasAndContext = canvasFactory.create(
    viewport.width,
    viewport.height,
  );
  const renderContext = {
    canvasContext: canvasAndContext.context,
    viewport,
  };

  const renderTask = page.render(renderContext);
  await renderTask.promise;
  // Convert the canvas to an image buffer.
  const image = canvasAndContext.canvas.toBuffer();
  // Release page resources.
  page.cleanup();
  return image;
}
