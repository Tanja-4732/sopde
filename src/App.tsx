import { Component, createResource, createSignal, lazy, onMount } from "solid-js";
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import pdfjs from 'pdfjs';

import logo from "./assets/logo.svg";
import styles from "./App.module.css";

const App: Component = () => {
  const [text, setText] = createSignal("");
  const [xCoord, setXCoord] = createSignal(0);
  const [yCoord, setYCoord] = createSignal(0);
  const [pdf_document, setPdfDocument] = createResource(null, getPdf);

  const pdfParams = () => ({ pdf_document: pdf_document(), x_coord: xCoord(), y_coord: yCoord(), text: text() } as PdfEdit);

  const [pdf] = createResource(pdfParams, modifyPdf);
  // modifyPdf(pdfParams);

  // getPdf().then(setPdfDocument);
  // const renderTarget = new pdfjs.Document();

  let canvas: HTMLCanvasElement;
  onMount(() => {
    console.log("uwu");
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

          <label for="Text">Text content</label>
          <input class="text-black" value={yCoord()} name="y-coord" id="y-coord" type="number" onInput={(Event) => setYCoord(Event.currentTarget.valueAsNumber)} />


          <label for="Text">Create textfield</label>
          <button type="submit" id="submit"
            class="bg-slate-500 rounded-lg w-fit px-3"
            onclick={(Event) => {
              Event.preventDefault();
              console.log("submit");
            }}
          >
            Submit
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
    return (await PDFDocument.create()).save();
  }

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
  const url = window.origin + "/assets/demo.pdf";
  const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());
  return existingPdfBytes;
}

