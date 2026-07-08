import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ProofBoard dev/preview server. Port chosen to avoid clashing with common dev tools.
export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5280 },
  preview: { host: "127.0.0.1", port: 5281 }
});
