import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import fs from "node:fs";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        https: {
            key: fs.readFileSync("certs/key.pem"),
            cert: fs.readFileSync("certs/cert.pem"),
        },
        proxy: {
            "/api": {
                secure: false,
                target: "https://localhost:8081",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
            },
        },
    },
    resolve: {
        alias: {
            // /esm/icons/index.mjs only exports the icons statically, so no separate chunks are created
            "@tabler/icons-react":
                "@tabler/icons-react/dist/esm/icons/index.mjs",
        },
    },
});
