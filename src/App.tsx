import { Component, createSignal } from "solid-js";
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

import logo from "./assets/logo.svg";
import styles from "./App.module.css";

const App: Component = () => {
  const [text, setText] = createSignal("");

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        { // <img src={logo} class={styles.logo} alt="logo" />
        }
        <h1 class="text-3xl font-bold underline">
          Simple online PDF document editor
        </h1>
        <p>
          This is (obviously) a work in progress. <br />
          Check back later for more
        </p>
        <form class="grid grid-cols-2">
          <label for="Text">Text content</label>
          <textarea name="text" id="text-input" cols="30" rows="10"
            onInput={(Event) => setText(Event.currentTarget.value)}
          />

          <button type="submit" id="submit" onclick={(Event) => {
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
  const url = 'https://pdf-lib.js.org/assets/with_update_sections.pdf'
  const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer())

  const pdfDoc = await PDFDocument.load(existingPdfBytes)
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  const { width, height } = firstPage.getSize()
  firstPage.drawText('This text was added with JavaScript!', {
    x: 5,
    y: height / 2 + 300,
    size: 50,
    font: helveticaFont,
    color: rgb(0.95, 0.1, 0.1),
    rotate: degrees(-45),
  })

  const pdfBytes = await pdfDoc.save()
}
