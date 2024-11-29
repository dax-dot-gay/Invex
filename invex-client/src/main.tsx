import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

import "@mantine/core/styles.layer.css";
import "@mantine/dates/styles.layer.css";
import "@mantine/dropzone/styles.layer.css";
import "@mantine/notifications/styles.layer.css";
import "mantine-datatable/styles.layer.css";
import "./styles/index.scss";

createRoot(document.getElementById("root")!).render(<App />);
