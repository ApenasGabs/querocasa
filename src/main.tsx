import { SpeedInsights } from "@vercel/speed-insights/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { DataProvider } from "./context/DataContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DataProvider>
      <App />
      <SpeedInsights />
    </DataProvider>
  </StrictMode>
);
