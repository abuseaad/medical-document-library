import React, { useEffect, useMemo, useState } from "react";
import DocumentCard from "./components/DocumentCard";
import Landing from "./components/Landing";
import ComingSoon from "./components/ComingSoon";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";

const CATEGORY_COLORS = [
  "#4f8cff", "#34d399", "#f59e0b", "#f472b6",
  "#a78bfa", "#22d3ee", "#fb7185", "#facc15",
];

function colorForCategory(category) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}

function groupByCategory(documents) {
  const groups = new Map();
  documents.forEach((document) => {
    const category = document.category || "Uncategorized";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(document);
  });
  return [...groups.entries()].map(([category, docs]) => ({ category, docs }));
}

const DEPARTMENT_LABELS = {
  obsgyne: "OBS / GYNE",
  surgery: "Surgery",
  "internal-medicine": "Internal Medicine",
};

function App() {
  const [view, setView] = useState("landing");
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/data/documents.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => setDocuments(data || []))
      .catch((loadError) => {
        setError(`Could not load data/documents.json. ${loadError.message}`);
      });
  }, []);

  const filteredDocuments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter((document) =>
      [document.title, document.category, document.description].some((value) =>
        (value || "").toLowerCase().includes(term),
      ),
    );
  }, [documents, searchTerm]);

  let content;

   if (view === "landing") {
    content = (
      <>
        <SiteHeader />
        <Landing onSelect={setView} />
        <SiteFooter />
      </>
    );
  } else if (view !== "pediatrics") {
    content = (
      <ComingSoon
        department={DEPARTMENT_LABELS[view] || view}
        onBack={() => setView("landing")}
      />
    );
  } else {
    content = (
      <>
        <header className="library-hero">
          <button className="back-link" onClick={() => setView("landing")}>
            ← Back
          </button>
          <h1>Pediatrics</h1>
          <p>
            Original PDFs and PowerPoint files, organized by topic. Click any
            document to open the original file.
          </p>
        </header>
        <div className="library-toolbar">
          <input
            type="search"
            placeholder="Search by title, topic, or keyword…"
            autoComplete="off"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        {error && <div className="library-status">{error}</div>}
        <main id="library">
          {!error && documents.length > 0 && filteredDocuments.length === 0 && (
            <p className="empty-state">No documents match your search.</p>
          )}
          {groupByCategory(filteredDocuments).map((group) => (
            <section
              className="topic-section"
              key={group.category}
              style={{ "--topic-color": colorForCategory(group.category) }}
            >
              <div className="topic-heading">
                <h2>{group.category}</h2>
                <span className="topic-count">
                  {group.docs.length}{" "}
                  {group.docs.length === 1 ? "document" : "documents"}
                </span>
              </div>
              <div className="doc-grid">
                {group.docs.map((document) => (
                  <DocumentCard document={document} key={document.id} />
                ))}
              </div>
            </section>
          ))}
        </main>
      </>
    );
  }

   return (
    <div className="site-shell">
      <div className="site-content">{content}</div>
    </div>
  );
}
export default App;