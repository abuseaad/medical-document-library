import React from "react";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <img
        src="/assets/logos/tech-doctor-logo.png"
        alt="Tech Doctor"
        className="site-logo site-logo-left"
      />
      <h1 className="site-title"></h1>
      <img
        src="/assets/logos/arsi-university-logo.png"
        alt="Arsi University"
        className="site-logo site-logo-right"
      />
 
    </header>
  );
}