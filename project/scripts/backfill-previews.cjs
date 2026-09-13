/**
 * scripts/backfill-previews.cjs
 * ------------------------------------------------------------------
 * Scans public/data/documents.json for any PPT/PPTX entry that has no
 * previewPath (or an empty one) and generates the missing PDF preview
 * for it, using the same LibreOffice conversion logic as
 * scripts/add-document.cjs.
 *
 * Run it whenever you suspect an entry is missing its preview:
 *   npm run fix-previews
 *
 * Safe to run repeatedly — entries that already have a previewPath
 * are left untouched.
 * ------------------------------------------------------------------
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const PREVIEWS_DIR = path.join(ROOT, "public", "previews");
const DB_PATH = path.join(ROOT, "public", "data", "documents.json");

function loadDb() {
  const raw = fs.readFileSync(DB_PATH, "utf8").trim();
  return raw ? JSON.parse(raw) : [];
}

function saveDb(docs) {
  fs.writeFileSync(DB_PATH, JSON.stringify(docs, null, 2) + "\n", "utf8");
}

function toWebPath(absPath) {
  return path.relative(path.join(ROOT, "public"), absPath).split(path.sep).join("/");
}

function findLibreOffice() {
  const candidates = [
    process.env.LIBREOFFICE_PATH,
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, "Programs", "LibreOffice", "program", "soffice.exe")
      : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  try {
    execFileSync("soffice", ["--version"], { stdio: "ignore", windowsHide: true, timeout: 15000 });
    return "soffice";
  } catch (_) {
    return null;
  }
}

function convertWithLibreOffice(soffice, sourceFile, previewDir) {
  fs.mkdirSync(previewDir, { recursive: true });

  const profileDir = path.join(os.tmpdir(), "lo-profile-" + Date.now());
  const profileArg = "-env:UserInstallation=file:///" + profileDir.split(path.sep).join("/");

  execFileSync(
    soffice,
    [profileArg, "--headless", "--convert-to", "pdf", "--outdir", previewDir, sourceFile],
    { stdio: "inherit", windowsHide: true, timeout: 120000 }
  );

  const pdfName = path.basename(sourceFile, path.extname(sourceFile)) + ".pdf";
  const pdfPath = path.join(previewDir, pdfName);
  if (!fs.existsSync(pdfPath)) {
    throw new Error("LibreOffice finished, but no PDF file appeared.");
  }
  return pdfPath;
}

function main() {
  console.log("\n=== Backfilling missing PDF previews ===\n");

  const soffice = findLibreOffice();
  if (!soffice) {
    console.error("✖ LibreOffice was not found (tried PATH and common install locations).");
    console.error("  Install it from https://www.libreoffice.org/download, or set LIBREOFFICE_PATH.");
    process.exit(1);
  }
  console.log(`✔ Using LibreOffice: ${soffice}\n`);

  const docs = loadDb();
  let fixedCount = 0;
  let skippedCount = 0;

  docs.forEach((doc) => {
    const isPresentation = ["ppt", "pptx"].includes((doc.fileType || "").toLowerCase());
    const missingPreview = !doc.previewPath;

    if (!isPresentation || !missingPreview) return;

    const sourceFile = path.join(ROOT, "public", doc.filePath);
    if (!fs.existsSync(sourceFile)) {
      console.log(`⚠ Skipping "${doc.title}" — source file not found at: ${doc.filePath}`);
      skippedCount++;
      return;
    }

    console.log(`⏳ ${doc.title} (${doc.fileName})...`);
    const previewDir = path.join(PREVIEWS_DIR, doc.id);
    try {
      const generatedPdf = convertWithLibreOffice(soffice, sourceFile, previewDir);
      doc.previewPath = toWebPath(generatedPdf);
      console.log(`   ✔ Preview created: ${doc.previewPath}\n`);
      fixedCount++;
    } catch (err) {
      console.error(`   ✖ Failed: ${err.message}\n`);
      skippedCount++;
    }
  });

  if (fixedCount > 0) {
    saveDb(docs);
  }

  console.log("------------------------------------------");
  console.log(`Fixed:   ${fixedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  if (fixedCount === 0 && skippedCount === 0) {
    console.log("Nothing to do — every PPT/PPTX already has a preview.");
  }
  console.log("------------------------------------------\n");
}

main();