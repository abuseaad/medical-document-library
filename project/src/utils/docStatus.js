// Tracks a per-document "status" (not set / read today / already read /
// urgent) entirely in the browser's localStorage — keyed by document id.
// This intentionally does NOT touch documents.json: it's a personal,
// per-browser marker, not shared library metadata, so adding/removing
// documents via the CLI script never needs to know about it.

const STORAGE_KEY = "doc-status-v1";
const STATUS_CYCLE = ["none", "today", "read", "urgent"];

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(statuses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  } catch {
    // localStorage unavailable (e.g. private browsing) — fail silently
  }
}

export function getStatus(id) {
  return readAll()[id] || "none";
}

export function nextStatus(id) {
  const all = readAll();
  const current = all[id] || "none";
  const currentIndex = STATUS_CYCLE.indexOf(current);
  const next = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
  all[id] = next;
  writeAll(all);
  return next;
}