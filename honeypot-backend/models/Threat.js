const mongoose = require("mongoose");

const ThreatSchema = new mongoose.Schema({
  url: { type: String, required: true },
  scriptCount: { type: Number, default: 0 },
  iframes: { type: [String], default: [] },
  redirected: { type: Boolean, default: false },
  status: { type: Number, default: 0 },
  error: { type: String, default: null },
  scannedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Threat", ThreatSchema);
