import React from "react";

const TYPE_META = {
  pdf: { label: "PDF", icon: "file" },
  ppt: { label: "PPT", icon: "presentation" },
  pptx: { label: "PPTX", icon: "presentation" },
};

function FileIcon({ type }) {
  if (type === "presentation") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentCard({ document }) {
  const fileType = (document.fileType || "").toLowerCase();
  const meta = TYPE_META[fileType] || {
    label: fileType.toUpperCase() || "FILE",
    icon: "file",
  };
  const openTarget = document.previewPath || document.filePath;

  return (
    <div className="doc-card-wrapper">
      <a className="doc-card" href={`/${openTarget}`} target="_blank" rel="noopener noreferrer">
        <div className="doc-card-top">
          <span className={`doc-type-badge doc-type-${fileType}`}>
            <FileIcon type={meta.icon} />
            <span>{meta.label}</span>
          </span>
        </div>
        <h3 className="doc-title">{document.title || document.fileName}</h3>
        <p className="doc-desc">{document.description || ""}</p>
        <div className="doc-open">
          {document.previewPath ? "Open preview" : `Open original ${meta.label}`} →
        </div>
      </a>
      <a
        className="doc-download-original"
        href={`/${document.filePath}`}
        download={document.fileName}
        aria-label={`Download original ${document.title || document.fileName}`}
      >
        Download original {meta.label}
      </a>
    </div>
  );
}

export default DocumentCard;
