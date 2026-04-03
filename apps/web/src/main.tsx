import "./i18n";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.js";
import { RevealProvider } from "./contexts/RevealContext.js";
import { NotificationProvider } from "./contexts/NotificationContext.js";
import { ThemeProvider } from "./contexts/ThemeContext.js";
import { App } from "./App.js";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <RevealProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </RevealProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
