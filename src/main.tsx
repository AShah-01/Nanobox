import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import "./themes/base.css";
import "./themes/liquid-glass.css";
import "./themes/matte.css";
import "./themes/glossy.css";
import "./themes/retro.css";
import "./themes/cyberpunk.css";
import "./themes/steampunk.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
