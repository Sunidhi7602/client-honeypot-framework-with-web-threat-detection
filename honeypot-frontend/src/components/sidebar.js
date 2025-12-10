import React from "react";
import "../components/sidebar.css";

function Sidebar() {
  return (
    <div className="sidebar">
      <h2>Honeypot</h2>
      <ul>
        <li>Dashboard</li>
        <li>Threats</li>
        <li>Settings</li>
      </ul>
    </div>
  );
}

export default Sidebar;
