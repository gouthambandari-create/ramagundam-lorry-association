const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// WheelsEye API config
const WHEELSEYE_URL =
  "https://api.wheelseye.com/currentLoc?accessToken=8f0e06bd-c6c2-4e88-8400-8a251ee42865";

// Serve static frontend files (index.html, style.css, app.js) from the root folder
app.use(express.static(__dirname));

// Relay endpoint: browser calls THIS, server calls WheelsEye (no CORS issue server-to-server)
app.get("/api/vehicles", async (req, res) => {
  try {
    // First request to find out how many total pages there are
    const firstResponse = await fetch(`${WHEELSEYE_URL}&pageNo=0`);

    if (!firstResponse.ok) {
      return res
        .status(firstResponse.status)
        .json({ success: false, message: "WheelsEye API returned an error." });
    }

    const firstData = await firstResponse.json();
    const totalPages = firstData?.data?.totalPages || 1;

    let allVehicles = firstData?.data?.list || [];

    // Fetch remaining pages (if any) and merge their vehicle lists
    for (let page = 1; page < totalPages; page++) {
      const pageResponse = await fetch(`${WHEELSEYE_URL}&pageNo=${page}`);
      if (pageResponse.ok) {
        const pageData = await pageResponse.json();
        allVehicles = allVehicles.concat(pageData?.data?.list || []);
      }
    }

    res.json({
      message: "Ok",
      success: true,
      data: {
        totalCount: firstData?.data?.totalCount,
        list: allVehicles,
      },
    });
  } catch (err) {
    console.error("Error fetching WheelsEye data:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch vehicle data." });
  }
});

// Fallback: serve index.html for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
