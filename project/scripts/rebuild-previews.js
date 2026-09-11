/**
 * scripts/rebuild-previews.js
 * ------------------------------------------------------------------
 * One-off / re-runnable command:
 *
 *   npm run rebuild-previews
 *
 * Goes through every PPT/PPTX already in data/documents.json and
 * generates a view-only PDF preview for it next to the original
 * (skipping any that already have one). Use this once, right after
 * pulling this update, to fix cards that were added before preview
 * generation existed — and again any time you add PPT/PPTX files by
 * hand instead of through 'npm run add-doc'.
 *
 * The original .ppt/.pptx files are never modified.
 * ------------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const DB_PATH = path.join(ROOT, "public", "data", "documents.json");

const SOFFICE_CANDIDATES = [
  "soffice.com",
  "soffice",
  "C:\\Program Files\\LibreOffice\\program\\soffice.com",
  "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
  "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
];

function findSoffice() {
  for (const candidate of SOFFICE_CANDIDATES) {
    if (path.isAbsolute(candidate)) {
      if (fs.existsSync(candidate)) return candidate;
      continue;
    }
    const profileDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "medical-library-check-"));
    try {
      execFileSync(
        candidate,
        [
          "--headless", "--nologo", "--nodefault", "--nofirststartwizard", "--norestore",
          `-env:UserInstallation=${require("url").pathToFileURL(profileDir).href}`,
          "--version",
        ],
        { stdio: "ignore", timeout: 10000, windowsHide: true },
      );
      return candidate;
    } catch {
      // Try the next LibreOffice installation.
    } finally {
      try {
        fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 });
      } catch {}
    }
  }
  return null;
}

function main() {
  const soffice = findSoffice();
  if (!soffice) {
    console.error(
      "LibreOffice ('soffice') was not found on this machine.\n" +
      "Install it from https://www.libreoffice.org/download and run this again."
    );
    process.exit(1);
  }

  const docs = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  let changed = 0;
  let skipped = 0;

  docs.forEach((doc) => {
    if (doc.fileType !== "ppt" && doc.fileType !== "pptx") return;

    const absFilePath = path.join(PUBLIC_DIR, doc.filePath);
    const targetDir = path.dirname(absFilePath);
    const expectedPreview = path.join(
      targetDir,
      path.basename(doc.filePath, path.extname(doc.filePath)) + ".pdf"
    );

    if (doc.previewPath && fs.existsSync(path.join(PUBLIC_DIR, doc.previewPath))) {
      skipped++;
      return;
    }

    console.log(`Converting: ${doc.filePath}`);
    const profileDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "medical-library-lo-"));
    const outputDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "medical-library-pdf-"));
    try {
      execFileSync(
        soffice,
        [
          "--headless", "--nologo", "--nodefault", "--nofirststartwizard", "--norestore",
          `-env:UserInstallation=${require("url").pathToFileURL(profileDir).href}`,
          "--convert-to", "pdf", "--outdir", outputDir, absFilePath,
        ],
        { stdio: "ignore", timeout: 120000, windowsHide: true }
      );
      const generatedPreview = path.join(
        outputDir,
        path.basename(doc.filePath, path.extname(doc.filePath)) + ".pdf",
      );
      if (fs.existsSync(generatedPreview)) {
        fs.copyFileSync(generatedPreview, expectedPreview);
        doc.previewPath = path.relative(PUBLIC_DIR, expectedPreview).split(path.sep).join("/");
        changed++;
        console.log(`  ✔ ${doc.previewPath}`);
      } else {
        console.log(`  ⚠ Conversion ran but no PDF appeared — skipping.`);
      }
    } catch (err) {
      console.log(`  ⚠ Failed: ${err.message}`);
    } finally {
      try {
        fs.rmSync(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
      } catch {}
      try {
        fs.rmSync(outputDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
      } catch {}
    }
  });

  if (changed > 0) {
    fs.writeFileSync(DB_PATH, JSON.stringify(docs, null, 2) + "\n", "utf-8");
  }

  console.log(`\nDone. ${changed} preview(s) generated, ${skipped} already had one.`);
}

main();
