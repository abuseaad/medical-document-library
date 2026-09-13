import React from "react";

const DEPARTMENTS = [
  { id: "pediatrics", label: "Pediatrics" },
  { id: "obsgyne", label: "OBS / GYNE" },
  { id: "surgery", label: "Surgery" },
  { id: "internal-medicine", label: "Internal Medicine" },
];

export default function Landing({ onSelect }) {
  return (
    <div className="landing-page">
      <div className="landing-title-box">
        <h1>Clinical Year Files</h1>
      </div>
      <div className="landing-grid">
        {DEPARTMENTS.map((dept) => (
          <button key={dept.id} className="landing-card" onClick={() => onSelect(dept.id)}>
            {dept.label}
          </button>
        ))}
      </div>
    </div>
  );
}