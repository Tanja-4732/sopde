import type { Component } from "solid-js";

import logo from "./logo.svg";
import styles from "./App.module.css";

const App: Component = () => {
  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <img src={logo} class={styles.logo} alt="logo" />
        <p>
          This is (obviously) a work in progress. <br />
          Check back later for more
        </p>
      </header>
    </div>
  );
};

export default App;
