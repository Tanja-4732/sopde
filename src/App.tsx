import { Component, createEffect, createResource, createSignal, lazy, onMount, untrack } from "solid-js";
import { degrees, PDFDocument, PDFPage, RGB, rgb, StandardFonts } from 'pdf-lib';
import { OnProgressParameters, PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask, PageViewport, TextLayerRenderTask, AbortException, AnnotationEditorLayer, AnnotationEditorParamsType, AnnotationEditorType, AnnotationEditorUIManager, AnnotationLayer, AnnotationMode, build, CMapCompressionType, createValidAbsoluteUrl, FeatureTest, getDocument, getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, GlobalWorkerOptions, ImageKind, InvalidPDFException, isDataScheme, isPdfFile, loadScript, MissingPDFException, normalizeUnicode, OPS, PasswordResponses, PDFDataRangeTransport, PDFDateString, PDFWorker, PermissionFlag, PixelsPerInch, PromiseCapability, RenderingCancelledException, renderTextLayer, setLayerDimensions, shadow, SVGGraphics, UnexpectedResponseException, updateTextLayer, Util, VerbosityLevel, version, XfaLayer } from "pdfjs-dist";
// GlobalWorkerOptions.workerSrc = await import("pdfjs-dist/build/pdf.worker.js"); // HACK this is the recommended workaround for the worker not being found
// import { pdfjsWorker } from "pdfjs-dist/build/pdf.worker.js"; // I would prefer this, but it doesn't work (yet)

import "pdfjs-dist/build/pdf.worker.entry";

// GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.js`;

import { RenderParameters } from "pdfjs-dist/types/src/display/api";


const App: Component = () => {
  const [text, setText] = createSignal("Hello world");
  const [xCoord, setXCoord] = createSignal(42);
  const [yCoord, setYCoord] = createSignal(500);
  const [rotation, setRotation] = createSignal(0);
  const [rgbColor, setRgbColor] = createSignal(rgb(0.95, 0.1, 0.1));
  const [size, setSize] = createSignal(12);
  const [page, setPage] = createSignal(1);
  const [scale, setScale] = createSignal(1);

  const [inputPdfFile, setInputPdfFile] = createSignal<File | null>(null);

  const [inputPdf, { mutate: setInputPdf, refetch: refetchInputPdf }] = createResource(inputPdfFile, async file => {
    console.log("loading input pdf");
    return await file?.arrayBuffer();
  });

  const [numPages] = createResource(inputPdf, async (my_pdf) => {
    inputPdf();
    console.log("loading num pages");
    if (my_pdf == null) {
      return 1;
    }

    const pdfDoc = await PDFDocument.load(my_pdf, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    return pages.length;
  }, { initialValue: 1 });

  const pdfParams = () => ({
    pdf_document: inputPdf(),
    x_coord: xCoord(),
    y_coord: yCoord(),
    size: size(),
    rotation: rotation(),
    color: rgbColor(),
    text: text(),
    page: page()
  } as PdfEdit);

  const [pdf, { mutate: mutatePdf, refetch: refetchPdf }] = createResource(pdfParams, modifyPdf);

  let canvas: HTMLCanvasElement = document.createElement("canvas");
  let ctx: CanvasRenderingContext2D | null = null;
  onMount(() => {
    ctx = canvas.getContext("2d");
    if (ctx == null) {
      console.error("context is null");
      throw new Error("context is null");
    }
  });

  createEffect(async () => {
    const my_pdf = structuredClone(pdf());
    const page_number = untrack(() => page());
    const my_scale = scale();

    if (my_pdf == null) {
      console.log("pdf is null");
      return;
    }

    const doc = await getDocument(my_pdf).promise;
    let pdf_page;
    try {
      pdf_page = await doc.getPage(page_number);
    } catch (e) {
      console.error(`[render] page ${page_number} does not exist in the document`);
      return;
    }
    const viewport = pdf_page.getViewport({ scale: my_scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext: RenderParameters = {
      canvasContext: ctx!,
      viewport: viewport
    };

    await pdf_page.render(renderContext).promise;
  });

  return (
    <div
      class="text-white bg-[#282c34] text-center min-h-screen flex flex-col items-center justify-center min-w-fit overflow-auto"
    >
      <h1 class="font-bold" style="font-size: calc(15px + 2vmin);">
        sopde: the simple online PDF document editor
      </h1>
      <p>
        Create a real text box (not just an annotation) in a PDF document, setting its position, size, rotation and color.
      </p>
      <div class="flex flex-row gap-5 items-start">
        <div class="grid grid-cols-2 gap-2 flex-grow min-w-fit" id="controls">
          <label for="text-input">Text content</label>
          <textarea value={text()} name="text-input" id="text-input" cols="30" rows="10" class="text-black"
            onInput={(Event) => setText(Event.currentTarget.value)}
          />

          <label>coordinates (in pt)</label>
          <div class="flex flex-row gap-1">
            <input class="text-black" value={xCoord()} name="x-coord" id="x-coord" type="number" onInput={(Event) => setXCoord(Event.currentTarget.valueAsNumber)} />
            <input class="text-black" value={yCoord()} name="y-coord" id="y-coord" type="number" onInput={(Event) => setYCoord(Event.currentTarget.valueAsNumber)} />
          </div>

          <label for="rotation">rotation (in degrees)</label>
          <input class="text-black" value={rotation()} name="rotation" id="rotation" type="number" onInput={(Event) => setRotation(Event.currentTarget.valueAsNumber)} />

          <label for="size">size (in pt)</label>
          <input class="text-black" value={size()} name="size" id="size" type="number" onInput={(Event) => setSize(Event.currentTarget.valueAsNumber)} />

          <label>color (RGB)</label>
          <div class="flex flex-row gap-1">
            <input
              class="text-black"
              value={255 * rgbColor().red}
              name="color-red"
              id="color-red"
              type="number"
              min="0"
              max="255"
              onInput={(Event) => setRgbColor(rgb(Event.currentTarget.valueAsNumber / 255, rgbColor().green, rgbColor().blue))}
            />
            <input
              class="text-black"
              value={255 * rgbColor().green}
              name="color-green"
              id="color-green"
              type="number"
              min="0"
              max="255"
              onInput={(Event) => setRgbColor(rgb(rgbColor().red, Event.currentTarget.valueAsNumber / 255, rgbColor().blue))}
            />
            <input
              class="text-black"
              value={255 * rgbColor().blue}
              name="color-blue"
              id="color-blue"
              type="number"
              min="0"
              max="255"
              onInput={(Event) => setRgbColor(rgb(rgbColor().red, rgbColor().green, Event.currentTarget.valueAsNumber / 255))}
            />
            <button class="" onClick={() => setRgbColor(rgb(0, 0, 0))}>
              Black
            </button>
          </div>

          <label for="select-input-pdf">Select input PDF</label>
          <div class="flex flex-row gap-1">
            <button type="submit" id="select-input-pdf" name="select-input-pdf"
              class="bg-slate-500 rounded-lg w-fit px-3"
              onclick={async (Event) => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "application/pdf";
                input.onchange = (Event) => {
                  const file = (Event.target as HTMLInputElement).files?.[0];
                  if (file == null) {
                    return;
                  }
                  setInputPdfFile(file);
                }
                input.click();
              }}
            >
              Select file
            </button>
            <button type="submit" id="select-input-pdf" name="select-input-pdf"
              // class="bg-slate-50 rounded-lg w-fit px-3 text-zinc-700"
              class="bg-slate-500 rounded-lg w-fit px-3"
              onclick={async (Event) => {
                console.log("loopback", pdf());

                setInputPdf(pdf());
              }}
            >
              Loopback
            </button>
          </div>

          <label>Save to disk</label>
          <button type="submit" id="save-to-disk" name="save-to-disk"
            class="bg-slate-500 rounded-lg w-fit px-3"
            onclick={async (Event) => {
              const my_pdf = pdf();

              if (my_pdf == null) {
                console.log("pdf is null");
                return;
              }

              // Save the arraybuffer to a file in the browser
              const blob = new Blob([my_pdf], { type: "application/pdf" });
              const link = document.createElement('a');
              link.href = window.URL.createObjectURL(blob);
              link.download = "modified.pdf";
              link.click();


            }}
          >
            Download
          </button>

          <label for="size">Page number to write to</label>
          <div class="flex flex-row gap-1">
            <button class="" onClick={() => setPage(Math.max(page() - 1, 1))}>Previous</button>
            <input
              class="text-black"
              value={page()}
              name="size"
              id="size"
              type="number"
              min="1"
              max={numPages()}
              onInput={(Event) => setPage(Event.currentTarget.valueAsNumber)} />
            <button class="" onClick={() => setPage(page() + 1)}>Next</button>
          </div>

          <label for="size">Scale (preview only)</label>
          <div class="flex flex-row gap-1">
            <button class="" onClick={() => setScale(Math.max(scale() - 0.1, 0.1))}>Schmol</button>
            <input
              class="text-black"
              value={scale()}
              name="size"
              id="size"
              type="number"
              step="0.1"
              min="0.1"
              onInput={(Event) => setScale(Event.currentTarget.valueAsNumber)} />
            <button class="" onClick={() => setScale(scale() + 0.1)}>Big</button>
          </div>
        </div>
        <div class="flex flex-col items-center justify-center ">
          <canvas ref={canvas} />
        </div>
      </div>
      <p>
        See <a href="https://github.com/Tanja-4732/sopde" class="text-blue-300">the repository</a> for the source code.
      </p>
    </div >
  );
};

interface PdfEdit {
  pdf_document: ArrayBuffer | null | undefined;
  x_coord: number;
  y_coord: number;
  size: number;
  rotation: number;
  color: RGB,
  text: string;
  page: number;
}

interface Dimensions {
  width: number;
  height: number;
}

export default App;

async function modifyPdf({ pdf_document, x_coord, y_coord, size, rotation, color, text, page }: PdfEdit): Promise<ArrayBuffer> {
  let pdfDoc: PDFDocument;
  if (pdf_document == null) {
    console.warn("The pdf_document is null, using a blank document as template");
    pdfDoc = await PDFDocument.create();
    // DIN A4
    pdfDoc.addPage([595.28, 841.89]);
  }
  else {
    pdf_document = pdf_document; // HACK this should be awaited by the caller, using the framework
    pdfDoc = await PDFDocument.load(pdf_document, { ignoreEncryption: true });
  }

  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const pdf_page = pages[page - 1];

  if (pdf_page == null) {
    console.error(`[modifyPdf] The page ${page} does not exist`);
    return await pdfDoc.save();
  }

  const { width, height } = pdf_page.getSize();
  pdf_page.drawText(text, {
    x: x_coord,
    y: y_coord,
    size,
    font: helveticaFont,
    color,
    rotate: degrees(rotation),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
