/**
 * js/library.js
 * ------------------------------------------------------------------
 * ONE reusable script that renders the entire document library.
 * It never changes when you add a new PDF/PPT — new documents are
 * data (an entry in data/documents.json), not code.
 *
 * Flow:
 *   1. fetch data/documents.json
 *   2. group the documents by "category"
 *   3. render one section + one card per document
 *   4. each card is a plain <a href="the-original-file" target="_blank">
 *      — clicking it opens the original PDF/PPT directly, no
 *      conversion, no extra page.
 * ------------------------------------------------------------------
 */

(function () {
  "use strict";

  var container = document.getElementById("library");
  var searchInput = document.getElementById("librarySearch");
  var statusEl = document.getElementById("libraryStatus");

  var allDocs = [];

  // File-type -> small badge label + icon glyph
  var TYPE_META = {
    pdf: { label: "PDF", icon: pdfIcon() },
    ppt: { label: "PPT", icon: pptIcon() },
    pptx: { label: "PPTX", icon: pptIcon() },
  };

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : s;
    return d.innerHTML;
  }

  function pdfIcon() {
    return '<svg viewBox="0 0 24 24" fill="none"><path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 3v5h5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }
  function pptIcon() {
    return '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="12" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  }

  function groupByCategory(docs) {
    var groups = {};
    var order = [];
    docs.forEach(function (d) {
      var cat = d.category || "Uncategorized";
      if (!groups[cat]) {
        groups[cat] = [];
        order.push(cat);
      }
      groups[cat].push(d);
    });
    return order.map(function (cat) {
      return { category: cat, docs: groups[cat] };
    });
  }

  function renderCard(doc) {
    var meta = TYPE_META[(doc.fileType || "").toLowerCase()] || {
      label: (doc.fileType || "FILE").toUpperCase(),
      icon: pdfIcon(),
    };
    // If a browser-viewable preview exists (PPT/PPTX get one
    // auto-generated as a PDF), open that inline in a new tab, same
    // as a PDF does. Otherwise fall back to the original file, which
    // downloads for PPT/PPTX (no native browser renderer for those).
    var hasPreview = !!doc.previewPath;
    var openTarget = hasPreview ? doc.previewPath : doc.filePath;

    var card = document.createElement("a");
    card.className = "doc-card";
    card.href = openTarget;
    card.target = "_blank";
    card.rel = "noopener";
    card.setAttribute("data-title", (doc.title || "").toLowerCase());
    card.setAttribute("data-category", (doc.category || "").toLowerCase());
    card.innerHTML =
      '<div class="doc-card-top">' +
      '<span class="doc-type-badge doc-type-' + (doc.fileType || "").toLowerCase() + '">' +
      meta.icon + "<span>" + meta.label + "</span></span>" +
      "</div>" +
      '<h3 class="doc-title">' + escapeHtml(doc.title || doc.fileName) + "</h3>" +
      '<p class="doc-desc">' + escapeHtml(doc.description || "") + "</p>" +
      '<div class="doc-open">' + (hasPreview ? "Open preview" : "Open original " + meta.label) + " →</div>";

    // Small separate link to the untouched original file, only shown
    // when the main click target is a generated preview (not the
    // original itself) — so people can still grab the real .ppt/.pptx.
    if (hasPreview) {
      var wrapper = document.createElement("div");
      wrapper.className = "doc-card-wrapper";
      wrapper.appendChild(card);

      var downloadLink = document.createElement("a");
      downloadLink.className = "doc-download-original";
      downloadLink.href = doc.filePath;
      downloadLink.setAttribute("download", doc.fileName || "");
      downloadLink.textContent = "Download original " + meta.label;
      wrapper.appendChild(downloadLink);

      return wrapper;
    }

    return card;
  }

  function render(docs) {
    container.innerHTML = "";

    if (!docs.length) {
      container.innerHTML =
        '<p class="empty-state">No documents match your search.</p>';
      return;
    }

    var groups = groupByCategory(docs);
    groups.forEach(function (group) {
      var section = document.createElement("section");
      section.className = "topic-section";

      var heading = document.createElement("div");
      heading.className = "topic-heading";
      heading.innerHTML =
        "<h2>" + escapeHtml(group.category) + "</h2>" +
        '<span class="topic-count">' + group.docs.length +
        (group.docs.length === 1 ? " document" : " documents") + "</span>";
      section.appendChild(heading);

      var grid = document.createElement("div");
      grid.className = "doc-grid";
      group.docs.forEach(function (doc) {
        grid.appendChild(renderCard(doc));
      });
      section.appendChild(grid);

      container.appendChild(section);
    });
  }

  function applySearch() {
    var term = (searchInput.value || "").trim().toLowerCase();
    if (!term) {
      render(allDocs);
      return;
    }
    var filtered = allDocs.filter(function (d) {
      return (
        (d.title || "").toLowerCase().indexOf(term) !== -1 ||
        (d.category || "").toLowerCase().indexOf(term) !== -1 ||
        (d.description || "").toLowerCase().indexOf(term) !== -1
      );
    });
    render(filtered);
  }

  function showError(message) {
    statusEl.style.display = "block";
    statusEl.innerHTML = message;
  }

  function init() {
    if (window.location.protocol === "file:") {
      showError(
        "You opened this file directly (file://), so the browser won't let it read the document database.<br>" +
        "Start the local server instead: open a terminal in this folder and run <code>npm start</code>, " +
        "then visit <code>http://localhost:3001</code>."
      );
      return;
    }

    fetch("data/documents.json")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (docs) {
        allDocs = docs || [];
        render(allDocs);
        if (searchInput) searchInput.addEventListener("input", applySearch);
      })
      .catch(function (err) {
        showError(
          "Could not load <code>data/documents.json</code>. Make sure the file exists and the " +
          "server is running (<code>npm start</code>).<br><small>" + escapeHtml(err.message) + "</small>"
        );
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
