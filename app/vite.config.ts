import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
const aqui = (p: string) => fileURLToPath(new URL(p, import.meta.url));
// "i18n-jsx" é a camada que traduz os textos da interface na hora de desenhar (src/i18n/jsx-runtime.ts)
export default defineConfig({ plugins: [react({ jsxImportSource: "i18n-jsx" })], base: "./",
  resolve: { alias: { "i18n-jsx/jsx-runtime": aqui("./src/i18n/jsx-runtime.ts"), "i18n-jsx/jsx-dev-runtime": aqui("./src/i18n/jsx-dev-runtime.ts") } } });
