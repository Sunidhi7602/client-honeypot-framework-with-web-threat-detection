const express = require("express");
const router = express.Router();
const scanURL = require("../utils/scanURL");
const Threat = require("../models/Threat");

// GET all threats
router.get("/", async (req, res) => {
  try {
    const threats = await Threat.find().sort({ scannedAt: -1 });
    res.json(threats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST scan a new URL
router.post("/scan", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });

    const result = await scanURL(url);

    const saved = await Threat.create(result);
    res.json(saved);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Scan failed" });
  }
});

module.exports = router;
