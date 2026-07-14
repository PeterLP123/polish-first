import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  test: {
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
});
