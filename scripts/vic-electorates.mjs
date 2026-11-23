// Regenerates the static electorate table in victoria-2026.html from
// assets/data/victoria-2026-electorates.csv (the authoritative source).
//   node scripts/vic-electorates.mjs
// The rows are written between the VIC-TABLE markers; vic-table.js then adds
// search, sorting and filters in the browser.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSV = path.join(ROOT, "assets/data/victoria-2026-electorates.csv");
const PAGE = path.join(ROOT, "victoria-2026.html");
const PARTIES = ["ALP", "GRN", "IND", "LIB", "NAT", "ONP"];
const NAMES = { ALP: "Labor", GRN: "Greens", IND: "Independent", LIB: "Liberal", NAT: "National", ONP: "One Nation" };
const CLOSE = 2; // percentage points
const EXPECTED = { LIB: 52, NAT: 8, ALP: 18, ONP: 6, GRN: 4 };

const fail = msg => { console.error("vic-electorates: " + msg); process.exit(1); };
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const lines = fs.readFileSync(CSV, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter(l => l.trim());
const head = lines.shift().split(",");
const rows = lines.map(l => {
  const cells = l.split(",");
  if (cells.length !== head.length) fail("unexpected column count: " + l);
  return Object.fromEntries(head.map((h, i) => [h.trim(), cells[i].trim()]));
});

if (rows.length !== 88) fail(`expected 88 electorates, found ${rows.length}`);
const names = new Set(rows.map(r => r["Riding Name"]));
if (names.size !== 88) fail("duplicate electorate names");

const seats = {};
const data = rows.map(r => {
  const name = r["Riding Name"];
  const finalists = PARTIES.filter(p => Number(r[p]) > 0).map(p => ({ p, v: Number(r[p]) })).sort((a, b) => b.v - a.v);
  if (finalists.length !== 2) fail(`${name}: expected two finalists, found ${finalists.length}`);
  const winner = r["Projected Winner"], prev = r["Previous Winner"];
  if (finalists[0].p !== winner) fail(`${name}: projected winner ${winner} is not the leading finalist`);
  if (!NAMES[winner] || !NAMES[prev]) fail(`${name}: unknown party code`);
  const margin = Number(r["Margins"]) * 100;
  if (!Number.isFinite(margin)) fail(`${name}: invalid margin`);
  seats[winner] = (seats[winner] || 0) + 1;
  return { name, prev, winner, runner: finalists[1].p, margin, gain: prev !== winner };
});
for (const [p, n] of Object.entries(EXPECTED)) if (seats[p] !== n) fail(`${p} total is ${seats[p]}, expected ${n}`);
if (Object.keys(seats).some(p => !(p in EXPECTED))) fail("unexpected winning party");

data.sort((a, b) => a.name.localeCompare(b.name));
const tag = p => `<span class="vic-tag ${p.toLowerCase()}">${NAMES[p]}</span>`;
const body = data.map(d => {
  const close = d.margin < CLOSE;
  const status = d.gain ? `<span class="vic-status gain">${esc(d.winner)} gain</span>` : `<span class="vic-status hold">${esc(d.winner)} hold</span>`;
  return `          <tr data-name="${esc(d.name)}" data-prev="${d.prev}" data-winner="${d.winner}" data-runner="${d.runner}" data-margin="${d.margin.toFixed(2)}" data-status="${d.gain ? "gain" : "hold"}"${close ? ' data-close="1"' : ""}>
            <th scope="row" data-label="Electorate">${esc(d.name)}</th>
            <td data-label="2022 winner">${tag(d.prev)}</td>
            <td data-label="2026 prediction">${tag(d.winner)}</td>
            <td data-label="Runner-up">${tag(d.runner)}</td>
            <td data-label="Margin" class="vic-num">${d.margin.toFixed(2)}<span class="vic-unit"> pts</span>${close ? ' <span class="vic-close" title="Under 2 points">Close</span>' : ""}</td>
            <td data-label="Result">${status}</td>
          </tr>`;
}).join("\n");

const html = fs.readFileSync(PAGE, "utf8");
const re = /(<!-- VIC-TABLE:START -->)[\s\S]*?(\s*<!-- VIC-TABLE:END -->)/;
if (!re.test(html)) fail("table markers not found in victoria-2026.html");
fs.writeFileSync(PAGE, html.replace(re, `$1\n${body}$2`));
const gains = data.filter(d => d.gain).length;
console.log(`Wrote 88 electorates (${Object.entries(seats).map(e => e.join(" ")).join(", ")}; ${gains} gains, ${88 - gains} holds, ${data.filter(d => d.margin < CLOSE).length} close).`);
