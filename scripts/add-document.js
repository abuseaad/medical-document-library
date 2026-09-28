/**
 * scripts/add-document.cjs
 * ------------------------------------------------------------------
 * Add a PDF/PPT/PPTX to the medical document library.
 *
 * Usage:
 *   npm run add-doc
 *     -> prompts for file path, title, description, category, department
 *
 *   npm run add-doc -- "C:\path\to\my-file.pdf"
 *     -> file path is already known; only prompts for the rest
 * ------------------------------------------------------------------
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline/promises");
const { stdin, stdout } = require("process");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const DOCS_DIR = path.join(ROOT, "public", "documents");
const PREVIEWS_DIR = path.join(ROOT, "public", "previews");
const DB_PATH = path.join(ROOT, "public", "data", "documents.json");
const ALLOWED_EXT = [".pdf", ".ppt", ".pptx"];
const DEV_URL = "http://localhost:5173";

const DEPARTMENTS = [
  { id: "pediatrics", label: "Pediatrics" },
  { id: "obsgyne", label: "OBS / GYNE" },
  { id: "surgery", label: "Surgery" },
  { id: "internal-medicine", label: "Internal Medicine" },
];

function stripQuotes(value) {
  value = value.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value;
}

function slugify(text) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "document"
  );
}

function uniqueSlug(base) {
  let slug = base;
  let n = 2;
  while (fs.existsSync(path.join(DOCS_DIR, slug))) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function loadDb() {
  if (!fs.existsSync(DB_PATH)) return [];
  const raw = fs.readFileSync(DB_PATH, "utf8").trim();
  return raw ? JSON.parse(raw) : [];
}

function saveDb(documents) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(documents, null, 2) + "\n", "utf8");
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

function findPowerPoint() {
  const candidates = [
    "C:\\Program Files\\Microsoft Office\\root\\Office16\\POWERPNT.EXE",
    "C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\POWERPNT.EXE",
    "C:\\Program Files\\Microsoft Office\\Office16\\POWERPNT.EXE",
    "C:\\Program Files (x86)\\Microsoft Office\\Office16\\POWERPNT.EXE",
    "C:\\Program Files\\Microsoft Office\\root\\Office15\\POWERPNT.EXE",
    "C:\\Program Files (x86)\\Microsoft Office\\root\\Office15\\POWERPNT.EXE",
  ];
  return candidates.find((c) => fs.existsSync(c)) || null;
}

function convertWithLibreOffice(soffice, sourceFile, previewDir) {
  console.log("\n⏳ Creating PDF preview with LibreOffice...");
  fs.mkdirSync(previewDir, { recursive: true });

  const profileDir = path.join(os.tmpdir(), "lo-profile-" + Date.now());
  const profileArg = "-env:UserInstallation=file:///" + profileDir.split(path.sep).join("/");

  try {
    execFileSync(
      soffice,
      [profileArg, "--headless", "--convert-to", "pdf", "--outdir", previewDir, sourceFile],
      { stdio: "inherit", windowsHide: true, timeout: 120000 }
    );
  } catch (error) {
    throw new Error("LibreOffice conversion failed or timed out.");
  }

  const pdfName = path.basename(sourceFile, path.extname(sourceFile)) + ".pdf";
  const pdfPath = path.join(previewDir, pdfName);
  if (!fs.existsSync(pdfPath)) {
    throw new Error("LibreOffice finished, but the PDF preview was not created.");
  }
  return pdfPath;
}

function convertWithPowerPoint(_powerPointPath, sourceFile, previewDir) {
  console.log("\n⏳ Creating PDF preview with Microsoft PowerPoint...");
  fs.mkdirSync(previewDir, { recursive: true });

  const pdfName = path.basename(sourceFile, path.extname(sourceFile)) + ".pdf";
  const pdfPath = path.join(previewDir, pdfName);

  const escapedSource = sourceFile.replace(/'/g, "''");
  const escapedPdf = pdfPath.replace(/'/g, "''");

  const powershellScript = `
$ErrorActionPreference = "Stop"
$ppt = New-Object -ComObject PowerPoint.Application
try {
    $presentation = $ppt.Presentations.Open('${escapedSource}', $true, $false, $false)
    $presentation.SaveAs('${escapedPdf}', 32)
    $presentation.Close()
} finally {
    if ($ppt) { $ppt.Quit() }
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
`;

  try {
    execFileSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", powershellScript],
      { stdio: "inherit", windowsHide: true, timeout: 120000 }
    );
  } catch (error) {
    throw new Error("Microsoft PowerPoint conversion failed or timed out.");
  }

  if (!fs.existsSync(pdfPath)) {
    throw new Error("PowerPoint finished, but the PDF preview was not created.");
  }
  return pdfPath;
}

function makePreview(sourceFile, previewDir) {
  const soffice = findLibreOffice();
  if (soffice) {
    console.log("✔ LibreOffice found.");
    return convertWithLibreOffice(soffice, sourceFile, previewDir);
  }
  console.log("ℹ LibreOffice was not found.");

  const powerPoint = findPowerPoint();
  if (powerPoint) {
    console.log("✔ Microsoft PowerPoint found.");
    return convertWithPowerPoint(powerPoint, sourceFile, previewDir);
  }

  throw new Error(
    [
      "",
      "No PowerPoint-to-PDF converter was found.",
      "",
      "Please install either:",
      "  1. LibreOffice (free, https://www.libreoffice.org/download), or",
      "  2. Microsoft PowerPoint",
      "",
      "Then run: npm run add-doc",
    ].join("\n")
  );
}

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  let targetDir = null;
  let previewDir = null;

  try {
    console.log("\n=== Add a document to the library ===\n");

    let filePath = stripQuotes(process.argv[2] || "");

    while (true) {
      if (!filePath) {
        filePath = stripQuotes(
          await rl.question("Full path to PDF/PPT/PPTX (drag the file into this terminal):\n> ")
        );
      }
      if (!filePath) {
        console.log("  Please enter a file path.\n");
        continue;
      }
      if (!fs.existsSync(filePath)) {
        console.log(`  File not found: ${filePath}\n`);
        filePath = "";
        continue;
      }
      const ext = path.extname(filePath).toLowerCase();
      if (!ALLOWED_EXT.includes(ext)) {
        console.log(`  Unsupported file type. Allowed: ${ALLOWED_EXT.join(", ")}\n`);
        filePath = "";
        continue;
      }
      break;
    }

    const ext = path.extname(filePath).toLowerCase();
    const fileType = ext.slice(1);
    const originalFileName = path.basename(filePath);

    let title = await rl.question("Title (shown on the card): ");
    title = title.trim() || originalFileName;

    let description = await rl.question("Short description: ");
    description = description.trim().replace(/\\n/g, "\n");

    const existing = loadDb();
    const knownCategories = [...new Set(existing.map((d) => d.category).filter(Boolean))];
    if (knownCategories.length) {
      console.log("\nExisting categories: " + knownCategories.join(", "));
    }
    const category = (await rl.question("Category / topic (e.g. Sepsis, Shock, NICU): ")).trim() || "Uncategorized";

    console.log("\nWhich department does this belong to?");
    DEPARTMENTS.forEach((d, i) => console.log(`  ${i + 1}. ${d.label}`));
    const deptAnswer = (await rl.question(`Enter a number (1-${DEPARTMENTS.length}, default 1 = Pediatrics): `)).trim();
    let deptIndex = parseInt(deptAnswer, 10) - 1;
    if (isNaN(deptIndex) || deptIndex < 0 || deptIndex >= DEPARTMENTS.length) {
      deptIndex = 0;
    }
    const department = DEPARTMENTS[deptIndex].id;

    const slug = uniqueSlug(slugify(title));
    targetDir = path.join(DOCS_DIR, slug);
    fs.mkdirSync(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, originalFileName);

    console.log("\n⏳ Copying original document...");
    fs.copyFileSync(filePath, targetPath);
    console.log("✔ Original document copied.");

    let previewPath;
    if (fileType === "pdf") {
      previewPath = toWebPath(targetPath);
      console.log("✔ PDF will be opened directly in the browser.");
    } else {
      previewDir = path.join(PREVIEWS_DIR, slug);
      const generatedPdf = makePreview(targetPath, previewDir);
      previewPath = toWebPath(generatedPdf);
      console.log("✔ PDF preview created.");
    }

    const entry = {
      id: slug,
      fileName: originalFileName,
      title,
      description,
      category,
      department,
      filePath: toWebPath(targetPath),
      previewPath,
      fileType,
      dateAdded: new Date().toISOString().slice(0, 10),
    };

    existing.push(entry);
    saveDb(existing);

    console.log("\n✔ Document added successfully!\n");
    console.log(`  Department: ${DEPARTMENTS[deptIndex].label}`);
    console.log(`  Category:   ${category}`);
    console.log(`  Preview:    ${previewPath}`);
    console.log(`  Original:   ${entry.filePath}`);
    console.log(`\nRunning "npm run dev"? Just refresh ${DEV_URL} to see it.`);
    console.log(`Running the built version ("npm start")? Run "npm run build" again first.\n`);
  } catch (error) {
    console.error("\n✖ Could not add document:");
    console.error(error.message);

    for (const dir of [targetDir, previewDir]) {
      if (dir && fs.existsSync(dir)) {
        try {
          fs.rmSync(dir, { recursive: true, force: true });
        } catch (_) {}
      }
    }
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

main();