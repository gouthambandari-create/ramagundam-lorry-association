let session = localStorage.getItem("portalSession");
let vehicles = [];
let map;
let marker;

const $ = id => document.getElementById(id);

function showApp() {
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");
  initMap();
  loadVehicles();
}

function initMap() {
  if (map) return;
  map = L.map("map").setView([17.385, 78.4867], 6);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
}

$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  $("loginError").textContent = "";
  try {
    const r = await fetch("/api/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        username: $("username").value.trim(),
        password: $("password").value
      })
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || "Login failed");
    session = data.token;
    localStorage.setItem("portalSession", session);
    showApp();
  } catch (err) {
    $("loginError").textContent = err.message;
  }
});

$("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("portalSession");
  session = null;
  location.reload();
});

$("refreshBtn").addEventListener("click", loadVehicles);
$("search").addEventListener("input", render);
$("statusFilter").addEventListener("change", render);

function vehicleNumber(v) { return v.vehicleNumber || v.vehicleNo || "Unknown"; }
function speed(v) { return Number(v.speed || 0); }
function ignition(v) { return Boolean(v.ignition); }
function updated(v) { return v.dtTime || v.createdDateReadable || v.timestamp || "—"; }
function vendor(v) { return v.vendorName || v.driverName || "—"; }
function coords(v) { return [Number(v.latitude), Number(v.longitude)]; }

async function loadVehicles() {
  $("loading").classList.remove("hidden");
  $("apiError").textContent = "";
  try {
    const r = await fetch("/api/vehicles", {
      headers: { Authorization: "Bearer " + session }
    });
    if (r.status === 401) {
      localStorage.removeItem("portalSession");
      return location.reload();
    }
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || "Could not load vehicles");
    vehicles = data.vehicles || [];
    $("lastRefresh").textContent = "Updated " + new Date().toLocaleTimeString();
    updateStats();
    render();
    if (vehicles[0]) selectVehicle(vehicles[0]);
  } catch (err) {
    $("apiError").textContent = err.message;
  } finally {
    $("loading").classList.add("hidden");
  }
}

function updateStats() {
  const moving = vehicles.filter(v => speed(v) > 0).length;
  const ign = vehicles.filter(v => ignition(v)).length;
  $("total").textContent = vehicles.length;
  $("moving").textContent = moving;
  $("ignition").textContent = ign;
  $("stopped").textContent = Math.max(0, vehicles.length - moving);
}

function matches(v) {
  const q = $("search").value.trim().toLowerCase();
  const filter = $("statusFilter").value;
  const text = [
    vehicleNumber(v), vendor(v), v.deviceNumber, v.vendorCode
  ].join(" ").toLowerCase();

  if (q && !text.includes(q)) return false;
  if (filter === "moving" && speed(v) <= 0) return false;
  if (filter === "ignition" && !ignition(v)) return false;
  if (filter === "stopped" && speed(v) > 0) return false;
  return true;
}

function render() {
  const list = vehicles.filter(matches);
  $("vehicleRows").innerHTML = list.map((v, i) => `
    <tr class="vehicle-row" data-index="${vehicles.indexOf(v)}">
      <td class="vehicle">${escapeHtml(vehicleNumber(v))}</td>
      <td>${speed(v).toFixed(1)} km/h</td>
      <td><span class="pill ${ignition(v) ? "on" : "off"}">${ignition(v) ? "ON" : "OFF"}</span></td>
      <td>${escapeHtml(vendor(v))}</td>
      <td>${escapeHtml(updated(v))}</td>
    </tr>
  `).join("");

  document.querySelectorAll(".vehicle-row").forEach(row => {
    row.addEventListener("click", () => selectVehicle(vehicles[Number(row.dataset.index)]));
  });
}

function selectVehicle(v) {
  const [lat, lng] = coords(v);
  $("selectedVehicle").textContent = vehicleNumber(v);
  $("selectedTime").textContent = updated(v);
  $("lat").textContent = Number.isFinite(lat) ? lat.toFixed(6) : "—";
  $("lng").textContent = Number.isFinite(lng) ? lng.toFixed(6) : "—";
  $("speed").textContent = Number.isFinite(speed(v)) ? speed(v).toFixed(1) + " km/h" : "—";
  $("ign").textContent = ignition(v) ? "ON" : "OFF";
  $("device").textContent = v.deviceNumber || "—";
  $("provider").textContent = v.provider || "—";

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    map.setView([lat, lng], 14);
    if (marker) marker.remove();
    marker = L.marker([lat, lng]).addTo(map)
      .bindPopup(`<b>${escapeHtml(vehicleNumber(v))}</b><br>${escapeHtml(updated(v))}`)
      .openPopup();
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

if (session) showApp();
