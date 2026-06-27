// scripts/gen-version.js
// Generate version.json with build timestamp
const fs = require("fs");
const path = require("path");

const now = new Date();
const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
const timeStr = String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0");
const version = `${dateStr}-${timeStr}`;

const out = { version, buildTime: now.toISOString() };
fs.writeFileSync(
  path.join(__dirname, "../public/version.json"),
  JSON.stringify(out, null, 2)
);
console.log("✅ version.json:", version);
