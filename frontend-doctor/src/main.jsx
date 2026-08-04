import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import "./index.css";
import "./i18n/index.js";

import { ThemeProvider } from "./context/ThemeContext";

document.body.classList.add("theme-doctor");

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider defaultTheme="dark">
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (let registration of registrations) {
        registration.unregister();
        console.log("Service Worker unregistered to prevent dev server conflicts.");
      }
    });
  });
}

