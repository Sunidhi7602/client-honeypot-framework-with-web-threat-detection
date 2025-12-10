const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" })); // allow React dev

// MongoDB connect (adjust URI if using different host)
mongoose
  .connect("mongodb://127.0.0.1:27017/honeypotDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// mount API
app.use("/api/threats", require("./routes/threats"));

app.get("/", (req, res) => res.send("Honeypot backend running"));
app.get("/", (_req, res) => res.send("Honeypot backend running"));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
