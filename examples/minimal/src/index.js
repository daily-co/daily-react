import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

export const roomUrl = process.env.DAILY_ROOM_URL;

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
