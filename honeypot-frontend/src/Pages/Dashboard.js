import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import DashboardCards from "../components/DashboardCards";
import ThreatTable from "../components/ThreatTable";

import { scanURL, getThreats } from "../services/api";

function Dashboard() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [threats, setThreats] = useState([]);

    // ⭐ ADD THIS — stats state
    const [stats, setStats] = useState({
        totalScans: 0,
        avgScripts: 0,
        totalRedirects: 0,
    });

    useEffect(() => {
        fetchThreats();
    }, []);

    const fetchThreats = async () => {
        const data = await getThreats();
        setThreats(data);

        // ⭐ Calculate stats properly
        const total = data.length;
        const avgScripts =
            total === 0
                ? 0
                : data.reduce((sum, item) => sum + (item.scriptCount || 0), 0) /
                  total;

        const redirects = data.filter((i) => i.redirected).length;

        setStats({
            totalScans: total,
            avgScripts: avgScripts.toFixed(1),
            totalRedirects: redirects,
        });
    };

    const handleScan = async () => {
        if (!url) return alert("Enter URL first!");

        setLoading(true);

        await scanURL(url);
        await fetchThreats(); // refresh table + stats

        setLoading(false);
        setUrl("");
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="main-content">
                <h1>Dashboard</h1>

                <div className="scan-input">
                    <input
                        type="text"
                        value={url}
                        placeholder="https://example.com"
                        onChange={(e) => setUrl(e.target.value)}
                    />
                    <button onClick={handleScan}>
                        {loading ? "Scanning..." : "Scan URL"}
                    </button>
                </div>

                {/* ⭐ Pass stats into DashboardCards */}
                <DashboardCards stats={stats} />

                <ThreatTable threats={threats} />
            </div>
        </div>
    );
}

export default Dashboard;
