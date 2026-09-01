const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// WheelsEye API config
const WHEELSEYE_URL =
  "https://api.wheelseye.com/currentLoc?accessToken=8f0e06bd-c6c2-4e88-8400-8a251ee42865";

// Serve static frontend files (index.html, style.css, app.js)
app.use(express.static(path.join(__dirname, "public")));

// Relay endpoint: browser calls THIS, server calls WheelsEye (no CORS issue server-to-server)
app.get("/api/vehicles", async (req, res) => {
  try {
    const response = await fetch(WHEELSEYE_URL);

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ success: false, message: "WheelsEye API returned an error." });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error fetching WheelsEye data:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch vehicle data." });
  }
});

// Fallback: serve index.html for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
