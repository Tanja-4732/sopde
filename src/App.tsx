import { Component, createSignal } from "solid-js";
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

import logo from "./assets/logo.svg";
import styles from "./App.module.css";

const App: Component = () => {
  const [text, setText] = createSignal("");
  const [xCoord, setXCoord] = createSignal(0);
  const [yCoord, setYCoord] = createSignal(0);

  return (
    <div class={styles.App} class="text-white ">
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
            }}>
            Submit
          </button>
        </form>

        <pre>
          {text()}
        </pre>

      </header>
    </div>
  );
};

export default App;

async function modifyPdf() {
  const existingPdfBytes = await getPdf();

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  firstPage.drawText('This text was added with JavaScript!', {
    x: 5,
    y: height / 2 + 300,
    size: 50,
    font: helveticaFont,
    color: rgb(0.95, 0.1, 0.1),
    rotate: degrees(-45),
  });

  const pdfBytes = await pdfDoc.save();


}
async function getPdf() {
  const url = 'https://pdf-lib.js.org/assets/with_update_sections.pdf';
  const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());
  return existingPdfBytes;
}

