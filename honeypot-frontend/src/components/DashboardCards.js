import React from "react";
import "../components/cards.css";

export default function DashboardCards({ total = 0, avgScripts = 0, totalRedirects = 0 }) {
  return (
    <div className="cards-container">
      <div className="card">
        <h3>Total Scans</h3>
        <p>{total}</p>
      </div>

      <div className="card">
        <h3>Avg Scripts</h3>
        <p>{avgScripts}</p>
      </div>

      <div className="card">
        <h3>Total Redirects</h3>
        <p>{totalRedirects}</p>
      </div>
    </div>
  );
}
