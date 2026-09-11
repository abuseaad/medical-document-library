/**
 * server.js
 * ------------------------------------------------------------------
 * A tiny static file server. It does NOT convert, parse, or touch
 * your PDFs/PPTs in any way — it just serves the project folder
 * (index.html, css/, js/, data/documents.json, documents/*) over
 * http://localhost so the browser can fetch() the JSON database
 * and link directly to the original files.
 *
 * Why a server at all, instead of just double-clicking index.html?
 * Browsers block a plain HTML file opened as file:// from fetching
 * a local JSON file (a security restriction, not something we can
 * code around). Running this tiny server removes that restriction.
 * That's its ONLY job — there is no upload API, no database engine,
 * nothing else running.
 * ------------------------------------------------------------------
 */

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// Serve every file in this project folder as-is (html, css, js,
// data/documents.json, and the original PDFs/PPTs under documents/).
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`\n  Medical document library running at:`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log(`  Press Ctrl+C to stop.\n`);
});
