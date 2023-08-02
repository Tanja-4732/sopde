import { Component, createEffect, createResource, createSignal, lazy, onMount } from "solid-js";
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
  const [yCoord, setYCoord] = createSignal(600);
  const [rotation, setRotation] = createSignal(0);
  const [rgbColor, setRgbColor] = createSignal(rgb(0.95, 0.1, 0.1));

  const [inputPdf, setInputPdf] = createSignal<File | null>(null);

  const pdfParams = () => ({
    pdf_document: inputPdf()?.arrayBuffer(),
    x_coord: xCoord(),
    y_coord: yCoord(),
    rotation: rotation(),
    color: rgbColor(),
    text: text()
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

    if (my_pdf == null) {
      console.log("pdf is null");
      return;
    }

    const doc = await getDocument(my_pdf).promise;
    const page = await doc.getPage(1);
    const scale = 1.5;
    const viewport = page.getViewport({ scale });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext: RenderParameters = {
      canvasContext: ctx,
      viewport: viewport
    };

    console.log("rendering");
    await page.render(renderContext).promise;
    console.log("rendered");
  });

  return (
    <div
      class="text-white bg-[#282c34] text-center min-h-screen flex flex-col items-center justify-center min-w-fit overflow-auto"
    >
      <h1 class="font-bold" style="font-size: calc(15px + 2vmin);">
        Simple online PDF document editor
      </h1>
      <p>
        Create a text box in a PDF document
      </p>
      <div class="flex flex-row gap-5 items-start">
        <form class="grid grid-cols-2 gap-2 flex-grow min-w-fit" id="controls">
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

          <label for="rotation">color (RGB)</label>
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
          </div>

          <label for="select-input-pdf">Select input PDF</label>
          <button type="submit" id="select-input-pdf" name="select-input-pdf"
            class="bg-slate-500 rounded-lg w-fit px-3"
            onclick={async (Event) => {
              Event.preventDefault();

              const input = document.createElement("input");
              input.type = "file";
              input.accept = "application/pdf";
              input.onchange = (Event) => {
                const file = (Event.target as HTMLInputElement).files?.[0];
                if (file == null) {
                  return;
                }
                setInputPdf(file);
              }
              input.click();
            }}
          >
            Select file
          </button>

          <label>Save to disk</label>
          <button type="submit" id="save-to-disk" name="save-to-disk"
            class="bg-slate-500 rounded-lg w-fit px-3"
            onclick={async (Event) => {
              Event.preventDefault();
              console.log("Save to disk");

              const my_pdf = pdf();
              console.log(my_pdf);

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
        </form>
        <div class="flex flex-col items-center justify-center ">
          <canvas ref={canvas} width="595.28px" height="841.89px" />
        </div>
      </div>
      <p>
        See <a href="https://github.com/Tanja-4732/sopde" class="text-blue-300">the repository</a> for the source code.
      </p>
    </div>
  );
};

interface PdfEdit {
  pdf_document: ArrayBuffer | null | undefined;
  x_coord: number;
  y_coord: number;
  rotation: number;
  color: RGB,
  text: string;
}

export default App;

async function modifyPdf({ pdf_document, x_coord, y_coord, rotation, color, text }: PdfEdit): Promise<ArrayBuffer> {
  let pdfDoc: PDFDocument;
  if (pdf_document == null) {
    console.warn("The pdf_document is null, using a blank document as template");
    pdfDoc = await PDFDocument.create();
    // DIN A4
    pdfDoc.addPage([595.28, 841.89]);
  }
  else {
    pdf_document = await pdf_document; // HACK this should be awaited by the caller, using the framework
    pdfDoc = await PDFDocument.load(pdf_document);
  }

  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  firstPage.drawText(text, {
    x: x_coord,
    y: y_coord,
    size: 50,
    font: helveticaFont,
    color,
    rotate: degrees(rotation),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
