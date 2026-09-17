import { defineConfig } from "vite";

export default defineConfig({
  server: {
    watch: {
      // Document binaries are served statically and do not need HMR watching.
      ignored: ["**/public/documents/**"],
    },
  },
});
