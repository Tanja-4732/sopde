import { Component, createResource, createSignal, lazy, onMount } from "solid-js";
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { OnProgressParameters, PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, RenderTask, PageViewport, TextLayerRenderTask, AbortException, AnnotationEditorLayer, AnnotationEditorParamsType, AnnotationEditorType, AnnotationEditorUIManager, AnnotationLayer, AnnotationMode, build, CMapCompressionType, createValidAbsoluteUrl, FeatureTest, getDocument, getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, GlobalWorkerOptions, ImageKind, InvalidPDFException, isDataScheme, isPdfFile, loadScript, MissingPDFException, normalizeUnicode, OPS, PasswordResponses, PDFDataRangeTransport, PDFDateString, PDFWorker, PermissionFlag, PixelsPerInch, PromiseCapability, RenderingCancelledException, renderTextLayer, setLayerDimensions, shadow, SVGGraphics, UnexpectedResponseException, updateTextLayer, Util, VerbosityLevel, version, XfaLayer } from "pdfjs-dist";

import logo from "./assets/logo.svg";
import styles from "./App.module.css";
import { RenderParameters } from "pdfjs-dist/types/src/display/api";

const App: Component = () => {
  const [text, setText] = createSignal("");
  const [xCoord, setXCoord] = createSignal(0);
  const [yCoord, setYCoord] = createSignal(0);
  const [pdf_document, setPdfDocument] = createResource(getPdf);

  const pdfParams = () => ({ pdf_document: pdf_document(), x_coord: xCoord(), y_coord: yCoord(), text: text() } as PdfEdit);

  const [pdf, { mutate: mutatePdf, refetch: refetchPdf }] = createResource(pdfParams, modifyPdf);
  // modifyPdf(pdfParams);

  // getPdf().then(setPdfDocument);
  // const renderTarget = new pdfjs.Document();

  let canvas: HTMLCanvasElement;
  onMount(() => {
    canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
  });


  return (
    <div class="text-white bg-[#282c34] text-center">
      <header class={styles.header}>
        { // <img src={logo} class={styles.logo} alt="logo" />
        }
        <h1 class="text-3xl font-bold">
          Simple online PDF document editor
        </h1>
        <p>
          Create a text box in a PDF document
        </p>
        <form class="grid grid-cols-2 gap-2">
          <label for="Text">Text content</label>
          <textarea value={text()} name="text" id="text-input" cols="30" rows="10" class="text-black"
            onInput={(Event) => setText(Event.currentTarget.value)}
          />

          <label for="x-coord">x coordinate (in pt)</label>
          <input class="text-black" value={xCoord()} name="x-coord" id="x-coord" type="number" onInput={(Event) => setXCoord(Event.currentTarget.valueAsNumber)} />

          <label for="Text">y coordinate (in pt)</label>
          <input class="text-black" value={yCoord()} name="y-coord" id="y-coord" type="number" onInput={(Event) => setYCoord(Event.currentTarget.valueAsNumber)} />

          <label for="Text">Create textfield</label>
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
              const page = await doc.getPage(0);


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

              await page.render(renderContext).promise;



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

        <pre class="max-w-xl overflow-clip">
          {text()}
        </pre>
        <canvas ref={canvas} width="256" height="256" />
      </header>
    </div>
  );
};

interface PdfEdit {
  pdf_document: ArrayBuffer | null | undefined;
  x_coord: number;
  y_coord: number;
  text: string;
}

export default App;

async function modifyPdf({ pdf_document, x_coord, y_coord, text }: PdfEdit): Promise<ArrayBuffer> {

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
    rotate: degrees(-45),
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

