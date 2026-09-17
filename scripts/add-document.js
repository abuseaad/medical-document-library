/**
 * scripts/add-document.js
 * ------------------------------------------------------------------
 * The ONE command you run to add a new PDF/PPT/PPTX to the library.
 *
 *   npm run add-doc
 *
 * It will:
 *   1. Ask for the path to the file on your computer, a title,
 *      a description, and a category.
 *   2. Copy the ORIGINAL file byte-for-byte into documents/<slug>/
 *      (nothing is converted, split, or re-encoded).
 *   3. Append one entry to data/documents.json.
 *
 * That's it — index.html / js/library.js never change, no matter
 * how many documents you add.
 * ------------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const readline = require("readline/promises");
const { stdin, stdout } = require("process");

const ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const DOCS_DIR = path.join(ROOT, "public", "documents");
const DB_PATH = path.join(ROOT, "public", "data", "documents.json");
const ALLOWED_EXT = [".pdf", ".ppt", ".pptx"];

// Path to LibreOffice's command-line binary. Used only to render a
// view-only PDF preview of PPT/PPTX files so they open in a browser
// tab exactly like a PDF does, instead of forcing a download. The
// ORIGINAL .ppt/.pptx is never touched, edited, or replaced by this —
// the preview is a separate extra file sitting next to it.
const SOFFICE_CANDIDATES = [
  "soffice.com", // console executable on Windows
  "soffice", // on PATH (Linux/macOS, and Windows if you added it to PATH)
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
    const profileDir = fs.mkdtempSync(
      path.join(require("os").tmpdir(), "medical-library-check-"),
    );
    try {
      execFileSync(
        candidate,
        [
          "--headless",
          "--nologo",
          "--nodefault",
          "--nofirststartwizard",
          "--norestore",
          `-env:UserInstallation=${require("url").pathToFileURL(profileDir).href}`,
          "--version",
        ],
        { stdio: "ignore", timeout: 10000, windowsHide: true },
      );
      return candidate;
    } catch {
      // not found / not runnable, try the next candidate
    } finally {
      try {
        fs.rmSync(profileDir, {
          recursive: true,
          force: true,
          maxRetries: 3,
          retryDelay: 250,
        });
      } catch {
        // LibreOffice may briefly retain this temporary profile.
      }
    }
  }
  return null;
}

/**
 * Renders targetPath (a .ppt/.pptx) to a PDF in the same folder,
 * using LibreOffice headless mode. Returns the relative filePath
 * (forward slashes) of the generated preview, or null if LibreOffice
 * isn't installed/found (the app still works fine without it — that
 * document's card will just fall back to downloading, same as before).
 */
function generatePreviewPdf(soffice, targetPath, targetDir) {
  const profileDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "medical-library-lo-"));
  const outputDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "medical-library-pdf-"));
  try {
    console.log("  Converting the presentation to a browser preview...");
    execFileSync(
      soffice,
      [
        "--headless",
        "--nologo",
        "--nodefault",
        "--nofirststartwizard",
        "--norestore",
        `-env:UserInstallation=${require("url").pathToFileURL(profileDir).href}`,
        "--convert-to",
        "pdf",
        "--outdir",
        outputDir,
        targetPath,
      ],
      { stdio: "ignore", timeout: 120000, windowsHide: true }
    );
    const generatedPreviewPath = path.join(
      outputDir,
      path.basename(targetPath, path.extname(targetPath)) + ".pdf"
    );
    const previewPath = path.join(
      targetDir,
      path.basename(targetPath, path.extname(targetPath)) + ".pdf"
    );
    if (fs.existsSync(generatedPreviewPath)) {
      fs.copyFileSync(generatedPreviewPath, previewPath);
      return path.relative(PUBLIC_DIR, previewPath).split(path.sep).join("/");
    }
  } catch (err) {
    const reason = err.killed ? "timed out" : err.message;
    console.log(`  ⚠ Preview generation failed (${reason}). The original file will still be available to download.`);
  } finally {
    try {
      fs.rmSync(profileDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 500,
      });
    } catch (cleanupError) {
      // LibreOffice can briefly retain a lock after a timed-out conversion.
      console.log(`  ⚠ Temporary preview files could not be removed yet (${cleanupError.code}).`);
    }
    try {
      fs.rmSync(outputDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
    } catch {}
  }
  return null;
}

function stripQuotes(s) {
  s = s.trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1);
  }
  return s;
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "document";
}

function uniqueSlug(baseSlug) {
  let slug = baseSlug;
  let n = 2;
  while (fs.existsSync(path.join(DOCS_DIR, slug))) {
    slug = `${baseSlug}-${n}`;
    n++;
  }
  return slug;
}

function loadDb() {
  if (!fs.existsSync(DB_PATH)) return [];
  const raw = fs.readFileSync(DB_PATH, "utf-8").trim();
  if (!raw) return [];
  return JSON.parse(raw);
}

function saveDb(docs) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(docs, null, 2) + "\n", "utf-8");
}

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    console.log("\n=== Add a document to the library ===\n");

    let filePath;
    while (true) {
      const answer = await rl.question(
        "Full path to the PDF/PPT/PPTX file (you can drag the file into this terminal window):\n> "
      );
      filePath = stripQuotes(answer);

      if (!filePath) {
        console.log("  Please enter a file path.\n");
        continue;
      }
      if (!fs.existsSync(filePath)) {
        console.log(`  File not found: ${filePath}\n`);
        continue;
      }
      const ext = path.extname(filePath).toLowerCase();
      if (!ALLOWED_EXT.includes(ext)) {
        console.log(`  Unsupported file type "${ext}". Allowed: ${ALLOWED_EXT.join(", ")}\n`);
        continue;
      }
      break;
    }

    const ext = path.extname(filePath).toLowerCase();
    const fileType = ext.slice(1); // "pdf" | "ppt" | "pptx"
    const originalFileName = path.basename(filePath);

    let title = await rl.question("Title (shown on the card): ");
    title = title.trim() || originalFileName;

    let description = await rl.question("Short description: ");
    description = description.trim();

    const existing = loadDb();
    const knownCategories = [...new Set(existing.map((d) => d.category).filter(Boolean))];
    if (knownCategories.length) {
      console.log("\nExisting categories: " + knownCategories.join(", "));
    }
    let category = await rl.question("Category / topic (e.g. Sepsis, Shock, Neonatal Respiratory Distress): ");
    category = category.trim() || "Uncategorized";

    // ---- copy the file exactly as-is ----
    const baseSlug = slugify(title);
    const slug = uniqueSlug(baseSlug);
    const targetDir = path.join(DOCS_DIR, slug);
    fs.mkdirSync(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, originalFileName);
    fs.copyFileSync(filePath, targetPath); // byte-for-byte copy, no conversion

    // ---- update the JSON database ----
    const relativeFilePath = path
      .relative(PUBLIC_DIR, targetPath)
      .split(path.sep)
      .join("/"); // always forward slashes for use in HTML href

    const entry = {
      id: slug,
      fileName: originalFileName,
      title,
      description,
      category,
      filePath: relativeFilePath,
      fileType,
      dateAdded: new Date().toISOString().slice(0, 10),
    };

    // ---- for PPT/PPTX, also generate a view-only PDF preview so the
    // card opens inline in a browser tab like a PDF does, instead of
    // downloading. The original file above is never modified. ----
    if (fileType === "ppt" || fileType === "pptx") {
      const soffice = findSoffice();
      if (soffice) {
        console.log("\nGenerating browser preview (LibreOffice)...");
        const previewPath = generatePreviewPdf(soffice, targetPath, targetDir);
        if (previewPath) {
          entry.previewPath = previewPath;
          console.log(`  ✔ Preview created: ${previewPath}`);
        }
      } else {
        console.log(
          "\n  ⚠ LibreOffice ('soffice') not found — skipping preview generation.\n" +
          "  This card will download instead of opening in a tab. Install LibreOffice\n" +
          "  (https://www.libreoffice.org/download) and re-run 'npm run rebuild-previews' later to fix it."
        );
      }
    }

    existing.push(entry);
    saveDb(existing);

    console.log("\n✔ Document added:\n");
    console.log(JSON.stringify(entry, null, 2));
    console.log(
      `\nStored at: public/documents/${slug}/${originalFileName}` +
      `\nRefresh your Vite browser page to see it (server must be running: npm run dev).\n`
    );
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error("\nSomething went wrong:", err.message);
  process.exit(1);
});
