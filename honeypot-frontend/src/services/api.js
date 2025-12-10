const API_BASE = "http://localhost:5000/api/threats";

export const getThreats = async () => {
  const res = await fetch(`${API_BASE}`);
  return res.json();
};

export const scanURL = async (url) => {
  const res = await fetch(`${API_BASE}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return res.json();
};
