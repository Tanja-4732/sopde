import { Component, createEffect, createResource, createSignal, lazy, onMount } from "solid-js";
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { OnProgressParameters, PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask, PageViewport, TextLayerRenderTask, AbortException, AnnotationEditorLayer, AnnotationEditorParamsType, AnnotationEditorType, AnnotationEditorUIManager, AnnotationLayer, AnnotationMode, build, CMapCompressionType, createValidAbsoluteUrl, FeatureTest, getDocument, getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, GlobalWorkerOptions, ImageKind, InvalidPDFException, isDataScheme, isPdfFile, loadScript, MissingPDFException, normalizeUnicode, OPS, PasswordResponses, PDFDataRangeTransport, PDFDateString, PDFWorker, PermissionFlag, PixelsPerInch, PromiseCapability, RenderingCancelledException, renderTextLayer, setLayerDimensions, shadow, SVGGraphics, UnexpectedResponseException, updateTextLayer, Util, VerbosityLevel, version, XfaLayer } from "pdfjs-dist";
// GlobalWorkerOptions.workerSrc = await import("pdfjs-dist/build/pdf.worker.entry"); // HACK this is the recommended workaround for the worker not being found
// import { pdfjsWorker } from "pdfjs-dist/build/pdf.worker.entry"; // I would prefer this, but it doesn't work (yet)

import logo from "./assets/logo.svg";
import styles from "./App.module.css";
import { RenderParameters } from "pdfjs-dist/types/src/display/api";

const App: Component = () => {
  import('pdfjs-dist/build/pdf.worker.entry').then((pdfjsWorker) => {
    console.log("pdfjsWorker", pdfjsWorker);

    return GlobalWorkerOptions.workerSrc = pdfjsWorker;
  })


  const [text, setText] = createSignal("Hello world");
  const [xCoord, setXCoord] = createSignal(42);
  const [yCoord, setYCoord] = createSignal(600);
  const [rotation, setRotation] = createSignal(0);
  const [pdf_document, setPdfDocument] = createResource(getPdf);

  const pdfParams = () => ({ pdf_document: pdf_document(), x_coord: xCoord(), y_coord: yCoord(), rotation: rotation(), text: text() } as PdfEdit);

  const [pdf, { mutate: mutatePdf, refetch: refetchPdf }] = createResource(pdfParams, modifyPdf);
  // modifyPdf(pdfParams);

  // getPdf().then(setPdfDocument);
  // const renderTarget = new pdfjs.Document();^

  let canvas: HTMLCanvasElement = document.createElement("canvas");
  let iframe: HTMLIFrameElement = document.createElement("iframe");
  onMount(() => {
    const ctx = canvas.getContext("2d");
  });

  createEffect(() => {
    const my_pdf = pdf();


    console.log("my_pdf for the blob", my_pdf);


    const blob = new Blob([my_pdf], { type: "application/pdf" });
    iframe.src = window.URL.createObjectURL(blob);
    console.log("iframe.src", iframe.src);
    console.log("blob", blob);


  });

  return (
    <div
      class="text-white bg-[#282c34] text-center min-h-screen flex flex-col items-center justify-center min-w-fit overflow-auto"
      style="font-size: calc(10px + 2vmin);"
    >
      <h1 class="text-3xl font-bold">
        Simple online PDF document editor
      </h1>
      <p>
        Create a text box in a PDF document
      </p>
      <div class="flex flex-row gap-5">
        <form class="grid grid-cols-2 gap-2 flex-grow min-w-fit" id="controls">
          <label for="text-input">Text content</label>
          <textarea value={text()} name="text-input" id="text-input" cols="30" rows="10" class="text-black"
            onInput={(Event) => setText(Event.currentTarget.value)}
          />

          <label for="x-coord">x coordinate (in pt)</label>
          <input class="text-black" value={xCoord()} name="x-coord" id="x-coord" type="number" onInput={(Event) => setXCoord(Event.currentTarget.valueAsNumber)} />

          <label for="y-coord">y coordinate (in pt)</label>
          <input class="text-black" value={yCoord()} name="y-coord" id="y-coord" type="number" onInput={(Event) => setYCoord(Event.currentTarget.valueAsNumber)} />

          <label for="rotation">rotation (in degrees)</label>
          <input class="text-black" value={rotation()} name="rotation" id="rotation" type="number" onInput={(Event) => setRotation(Event.currentTarget.valueAsNumber)} />

          <label for="Text">Show preview</label>
          <button type="submit" id="submit"
            class="bg-slate-500 rounded-lg w-fit px-3"
            onclick={async (Event) => {
              Event.preventDefault();
              console.log("submit");



              const my_pdf = pdf();
              console.log(my_pdf);

              if (my_pdf == null) {
                console.log("pdf is null");
                return;
              }

              const doc = await getDocument(my_pdf).promise;
              const page = await doc.getPage(1);


              // Set the scale of the PDF (optional)
              const scale = 1.5;

              // Get the viewport
              const viewport = page.getViewport({ scale });

              // Prepare a canvas element
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const context = canvas.getContext('2d');

              if (context == null) {
                console.error("context is null");
                throw new Error("context is null");
              }

              const renderContext: RenderParameters = {
                canvasContext: context,
                viewport: viewport
              };

              console.log("rendering");
              await page.render(renderContext).promise;
              console.log("rendered");


            }}
          >
            Submit
          </button>

          <label for="save-to-disk">Save to disk</label>
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
        {
          // <pre class="max-w-xl overflow-clip">
          //   {text()}
          // </pre>
          // <canvas ref={canvas} width="256" height="256" />
        }
        {
          // Render the pdf document
        }
        <div class="flex flex-col items-center justify-center ">
          <h2 class="text-2xl font-bold">Preview</h2>
          <iframe ref={iframe} width="1000px" height="600px" />

        </div>

      </div>
    </div>
  );
};

interface PdfEdit {
  pdf_document: ArrayBuffer | null | undefined;
  x_coord: number;
  y_coord: number;
  rotation: number;
  text: string;
}

export default App;

async function modifyPdf({ pdf_document, x_coord, y_coord, rotation, text }: PdfEdit): Promise<ArrayBuffer> {

  console.log("modifyPdf", pdf_document, x_coord, y_coord, text);


  if (pdf_document == null) {
    console.warn("The pdf_document is null, using a blank document as template");
    return (await PDFDocument.create()).save();
  }
  console.log("pdf_document is not null");

  const pdfDoc = await PDFDocument.load(pdf_document);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  firstPage.drawText(text, {
    x: x_coord,
    y: y_coord,
    size: 50,
    font: helveticaFont,
    color: rgb(0.95, 0.1, 0.1),
    rotate: degrees(rotation),
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
async function getPdf(): Promise<ArrayBuffer> {
  const url = window.origin + "/src/assets/demo.pdf";
  const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());
  console.log("getPdf", existingPdfBytes);

  return existingPdfBytes;
}

