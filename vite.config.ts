import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/start/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart()
  ],
});
