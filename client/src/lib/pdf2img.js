import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

let pdfjsLib = null;
let loadPromise = null;

/** Keep canvas within typical GPU/browser limits */
const MAX_CANVAS_EDGE = 8192;

function pickScaleForViewport(viewport) {
  const w = viewport.width;
  const h = viewport.height;
  const maxDim = Math.max(w, h);
  if (maxDim <= MAX_CANVAS_EDGE) return 1;
  return MAX_CANVAS_EDGE / maxDim;
}

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    pdfjsLib = lib;
    return lib;
  });

  return loadPromise;
}

export async function convertPdfToImage(file) {
  try {
    const lib = await loadPdfJs();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    let viewport = page.getViewport({ scale: 2 });
    const shrink = pickScaleForViewport(viewport);
    if (shrink < 1) {
      viewport = page.getViewport({ scale: 2 * shrink });
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
      return {
        imageUrl: "",
        file: null,
        error: "Could not get 2D canvas context (browser blocked or unsupported).",
      };
    }

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    const renderTask = page.render({
      canvasContext: context,
      viewport,
    });
    await renderTask.promise;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const originalName = file.name.replace(/\.pdf$/i, "");
            const imageFile = new File([blob], `${originalName}.png`, {
              type: "image/png",
            });

            resolve({
              imageUrl: URL.createObjectURL(blob),
              file: imageFile,
            });
          } else {
            resolve({
              imageUrl: "",
              file: null,
              error: "Failed to create image blob",
            });
          }
        },
        "image/png",
        1.0
      );
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      imageUrl: "",
      file: null,
      error: `Failed to convert PDF: ${msg}`,
    };
  }
}
