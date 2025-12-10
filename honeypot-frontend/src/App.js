import React from "react";
import Sidebar from "./components/sidebar";
import Dashboard from "./Pages/Dashboard";
import "./App.css";

function App() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <Dashboard />
      </div>
    </div>
  );
}

export default App;
