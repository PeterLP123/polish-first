import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "curriculum", test: /src[\\/]data[\\/](?:course|content)[\\/\.]/, priority: 30, includeDependenciesRecursively: false },
            { name: "react-vendor", test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/, priority: 20, includeDependenciesRecursively: false },
            { name: "icons", test: /node_modules[\\/]lucide-react[\\/]/, priority: 10, includeDependenciesRecursively: false },
          ],
        },
      },
    },
  },
  test: {
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
});
