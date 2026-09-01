require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);

const API_URL = process.env.WHEELSEYE_API_URL;
const TOKEN = process.env.WHEELSEYE_ACCESS_TOKEN;
const USERNAME = process.env.PORTAL_USERNAME || "customer";
const PASSWORD = process.env.PORTAL_PASSWORD || "ChangeThisPassword123!";
const PAGE_SIZE = Number(process.env.WHEELSEYE_PAGE_SIZE || 100);

if (!API_URL || !TOKEN || TOKEN.includes("PASTE_YOUR")) {
  console.warn("WheelsEye API is not configured. Copy .env.example to .env and add the token.");
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function isLoggedIn(req) {
  return req.headers.authorization === "Bearer portal-demo-session";
}

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === USERNAME && password === PASSWORD) {
    return res.json({ ok: true, token: "portal-demo-session" });
  }
  return res.status(401).json({ ok: false, message: "Invalid username or password" });
});

async function callWheelsEye(pageNo) {
  const url = new URL(API_URL);
  url.searchParams.set("accessToken", TOKEN);
  if (pageNo !== undefined) {
    url.searchParams.set("pageNo", String(pageNo));
    url.searchParams.set("pageSize", String(PAGE_SIZE));
  }

  const response = await fetch(url, {
    headers: { "Accept": "application/json" }
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`WheelsEye API returned ${response.status}: ${text.slice(0, 500)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("WheelsEye API did not return valid JSON.");
  }
}

function extractPage(payload) {
  // Handles the structure shown in the user's API response:
  // { data: [ { pageNo, pageSize, totalPages, totalCount, list: [...] } ] }
  const candidates = [];
  if (payload && Array.isArray(payload.data)) candidates.push(...payload.data);
  if (payload && payload.data && !Array.isArray(payload.data)) candidates.push(payload.data);
  if (payload) candidates.push(payload);

  for (const c of candidates) {
    if (c && Array.isArray(c.list)) return c;
  }
  return { pageNo: 0, pageSize: PAGE_SIZE, totalPages: 1, totalCount: 0, list: [] };
}

app.get("/api/vehicles", async (req, res) => {
  if (!isLoggedIn(req)) return res.status(401).json({ message: "Please login first." });

  try {
    const firstPayload = await callWheelsEye(0);
    const first = extractPage(firstPayload);
    let vehicles = [...first.list];

    const totalPages = Number(first.totalPages || 1);

    // The screenshot shows totalPages=2. Try subsequent pages using the common
    // pageNo/pageSize parameters. If the API ignores them, duplicates are removed.
    for (let page = 1; page < totalPages; page++) {
      const payload = await callWheelsEye(page);
      const p = extractPage(payload);
      vehicles.push(...p.list);
    }

    const byVehicle = new Map();
    for (const v of vehicles) {
      const key = v.vehicleNumber || v.vehicleNo || v.deviceNumber || JSON.stringify(v);
      byVehicle.set(key, v);
    }

    res.json({
      ok: true,
      totalCount: Number(first.totalCount || byVehicle.size),
      totalPages,
      vehicles: Array.from(byVehicle.values())
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ message: err.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Vehicle portal running on http://localhost:${PORT}`);
});
