import React from "react";

export default function ComingSoon({ department, onBack }) {
  return (
    <div className="coming-soon-page">
      <button className="back-link" onClick={onBack}>
        ← Back
      </button>
      <h2>{department}</h2>
      <p className="loading-text">Loading.....</p>
      <p className="coming-soon-note">This section hasn't been added yet — check back soon.</p>
    </div>
  );
}