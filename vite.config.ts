import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Detect if the build is running inside the Vercel deployment environment
const isVercel = !!process.env.VERCEL;

export default defineConfig({
  // Force Nitro to use the Vercel preset instead of defaulting to Cloudflare,
  // which properly outputs the required .vercel/output folder structure.
  nitro: isVercel ? { preset: "vercel" } : true,
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
});
