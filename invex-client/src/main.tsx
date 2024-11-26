import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/notifications/styles.css";
import "./styles/index.scss";

createRoot(document.getElementById("root")!).render(<App />);
