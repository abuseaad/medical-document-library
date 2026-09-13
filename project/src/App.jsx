import React, { useEffect, useMemo, useState } from "react";
import DocumentCard from "./components/DocumentCard";

// A fixed palette, cycled through by a hash of the category name.
// Every category — including ones you haven't created yet — gets a
// consistent color automatically, with zero code changes needed when
// you type a new category into "npm run add-doc".
const CATEGORY_COLORS = [
  "#4f8cff", // blue
  "#34d399", // green
  "#f59e0b", // amber
  "#f472b6", // pink
  "#a78bfa", // purple
  "#22d3ee", // cyan
  "#fb7185", // rose
  "#facc15", // yellow
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

function App() {
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
        setError(
          `Could not load data/documents.json. Make sure the file exists and the server is running. ${loadError.message}`,
        );
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

  return (
    <>
      <header className="library-hero">
        <h1>Clinical year file </h1>
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

export default App;
