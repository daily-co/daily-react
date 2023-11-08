import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

// Change to your room URL
export const roomUrl = "https://you.daily.co/hello";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
