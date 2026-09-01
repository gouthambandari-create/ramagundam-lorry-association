# WheelsEye Vehicle Tracking Portal

A simple customer login + vehicle dashboard for the WheelsEye `currentLoc` API.

## What it includes

- Customer login
- Vehicle list
- Search and status filters
- Total / moving / ignition-on / stopped counters
- Latitude and longitude
- Speed
- Ignition status
- Vendor/driver name when returned by API
- Device number
- Last update time
- OpenStreetMap map
- Server-side API token (not exposed to the browser)
- Attempts to load all pages when the API reports `totalPages > 1`

## Run on a computer

1. Install Node.js 18+.
2. Open this project folder in Terminal/Command Prompt.
3. Run:
   `npm install`
4. Copy `.env.example` to `.env`.
5. Open `.env` and enter the WheelsEye token and portal username/password.
6. Run:
   `npm start`
7. Open:
   `http://localhost:3000`

## Important

The API token should be a new/rotated token. Do not publish `.env` to GitHub.

## Deploy online

This project can be deployed to a Node.js hosting service such as Render, Railway, or another provider that supports Node/Express.

Set the same environment variables from `.env` in the hosting provider's Environment Variables section.

## API pagination

The response shown in the supplied screenshot has `pageSize: 100`, `totalPages: 2`, and `totalCount: 160`. The backend therefore requests page 0 and page 1 using `pageNo` and `pageSize`. If your WheelsEye API uses a different pagination parameter, update `callWheelsEye()` in `server.js`.
