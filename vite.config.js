import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "build",
  },
  server: {
    watch: {
      // Document binaries are served statically and do not need HMR watching.
      ignored: ["**/public/documents/**"],
    },
  },
});
