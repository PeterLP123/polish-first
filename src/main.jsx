import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
      .then(() => {
        // A new service worker taking control means a fresh deploy is cached and
        // ready; the app listens for this event to offer a reload.
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.dispatchEvent(new CustomEvent("czesc:update-ready"));
        });
      })
      .catch(() => {
        // Offline support is optional; the app remains fully usable online.
      });
  });
}
