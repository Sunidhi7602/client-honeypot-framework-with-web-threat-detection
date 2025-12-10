// honeypot-frontend/src/components/Threattable.js
import React from "react";
import "../components/tables.css";

function Threattable({ threats = [] }) {
  return (
    <table className="threat-table">
      <thead>
        <tr>
          <th>URL</th>
          <th>Status</th>
          <th>Scripts</th>
          <th>Iframes</th>
          <th>Redirected</th>
          <th>Scanned At</th>
        </tr>
      </thead>
      <tbody>
        {threats.length === 0 && (
          <tr><td colSpan="6" style={{ textAlign: "center" }}>No scans yet</td></tr>
        )}
        {threats.map((t) => (
          <tr key={t._id}>
            <td>{t.url}</td>
            <td>{t.status || "-"}</td>
            <td>{t.scriptCount}</td>
            <td>{(t.iframes || []).join(", ") || "-"}</td>
            <td>{t.redirected ? "Yes" : "No"}</td>
            <td>{t.scannedAt ? new Date(t.scannedAt).toLocaleString() : "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Threattable;
