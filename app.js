// --- Config ---
const VALID_USERNAME = "ramagundam";
const VALID_PASSWORD = "rfcl123";
const API_URL = "/api/vehicles"; // calls our own backend, which relays to WheelsEye

// --- Elements ---
const loginCard = document.getElementById("loginCard");
const dashboardCard = document.getElementById("dashboardCard");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("loginError");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const statusMsg = document.getElementById("statusMsg");
const vehicleTable = document.getElementById("vehicleTable");
const vehicleTableBody = document.getElementById("vehicleTableBody");

// --- Login handler ---
loginBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    loginError.textContent = "";
    loginCard.style.display = "none";
    dashboardCard.style.display = "block";
    loadVehicleData();
  } else {
    loginError.textContent = "Invalid username or password.";
  }
});

// Allow pressing Enter to submit
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginBtn.click();
});

// --- Logout handler ---
logoutBtn.addEventListener("click", () => {
  dashboardCard.style.display = "none";
  loginCard.style.display = "block";
  usernameInput.value = "";
  passwordInput.value = "";
  vehicleTable.style.display = "none";
  vehicleTableBody.innerHTML = "";
  statusMsg.textContent = "Loading vehicle data...";
});

// --- Fetch + render vehicle data ---
async function loadVehicleData() {
  statusMsg.textContent = "Loading vehicle data...";
  vehicleTable.style.display = "none";

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Request failed with status " + response.status);

    const result = await response.json();
    const vehicles = result?.data?.list || [];

    if (vehicles.length === 0) {
      statusMsg.textContent = "No vehicle data available.";
      return;
    }

    vehicleTableBody.innerHTML = "";
    vehicles.forEach((v) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${v.vehicleNumber ?? "-"}</td>
        <td>${v.venndorName ?? "-"}</td>
        <td>${v.latitude?.toFixed(5) ?? "-"}, ${v.longitude?.toFixed(5) ?? "-"}</td>
        <td>${v.dttime ?? "-"}</td>
      `;
      vehicleTableBody.appendChild(row);
    });

    statusMsg.textContent = `Showing ${vehicles.length} vehicle(s).`;
    vehicleTable.style.display = "table";
  } catch (err) {
    console.error(err);
    statusMsg.textContent =
      "Could not load vehicle data. This may be blocked by the API's security settings (CORS) when called directly from a browser — let me know and we'll add a small backend relay instead.";
  }
}
