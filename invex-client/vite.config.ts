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
    css: {
        preprocessorOptions: {
            scss: {
                api: "modern-compiler",
                additionalData: `@use "${path.join(
                    process.cwd(),
                    "src/_mantine"
                )}" as mantine;`,
            },
        },
    },
});
