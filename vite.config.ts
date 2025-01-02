import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [visualizer()],
  base: "/kysely-playground/",
  build: {
    sourcemap: false,
    rollupOptions: {
      cache: false,
    },
  },
});
