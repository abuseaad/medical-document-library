/**
 * server.js
 * ------------------------------------------------------------------
 * Serves the PRODUCTION build ("dist/", created by `npm run build`).
 *
 * Day-to-day, when you're editing the app, use `npm run dev` instead
 * (instant refresh, no build step). Use this one only when you want
 * to just browse the library without VS Code open — but remember:
 * any new document added via `npm run add-doc` won't show up here
 * until you run `npm run build` again, since dist/ is a snapshot.
 * ------------------------------------------------------------------
 */

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;
const DIST_DIR = path.join(__dirname, "dist");

if (!fs.existsSync(DIST_DIR)) {
  console.error('\n  No "dist" folder found. Run "npm run build" first.\n');
  process.exit(1);
}

app.use(express.static(DIST_DIR));

app.listen(PORT, () => {
  console.log(`\n  Medical document library (production build) running at:`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log(`  Press Ctrl+C to stop.\n`);
});