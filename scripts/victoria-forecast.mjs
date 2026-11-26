// ==========================================================
// 2026 VICTORIAN STATE ELECTION FORECAST
// ----------------------------------------------------------
// data/victoria-2026.csv is the single source of truth for the forecast:
// one row per electorate with its previous winner, projected winner,
// runner-up and margin. Every Victorian figure on the site — the seat
// totals, the seat bar, the party list, the electorate table, the filters,
// the page descriptions and the homepage summary — is generated from it.
//
// To change a prediction, edit that row of the CSV and commit. The site
// build (scripts/build.mjs) regenerates every page from the CSV, so all
// totals update automatically. To refresh the copies of the pages in the
// repository as well (optional, e.g. to preview locally), run:
//   node scripts/victoria-forecast.mjs
//
// The generated regions sit between <!-- VIC:NAME --> and <!-- /VIC:NAME -->
// markers in victoria-2026.html and index.html; don't hand-edit inside them.
// ==========================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DATA_FILE = path.join(ROOT, "data", "victoria-2026.csv");

const TOTAL_SEATS = 88;
const MAJORITY = Math.floor(TOTAL_SEATS / 2) + 1;
const CLOSE = 2; // margins under this many points are "close contests"
const PARTY_NAMES = { LIB: "Liberal", NAT: "National", ALP: "Labor", ONP: "One Nation", GRN: "Greens", IND: "Independent" };
const COALITION = ["LIB", "NAT"];
// Tie-break order when parties hold the same number of seats.
const PARTY_ORDER = Object.keys(PARTY_NAMES);
const COLUMNS = ["Electorate", "Previous winner", "Projected winner", "Runner-up", "Margin"];

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pct = n => (n * 100).toFixed(1) + "%";

class ForecastError extends Error {}
const fail = msg => { throw new ForecastError(`data/victoria-2026.csv: ${msg}`); };

// ---------- load & validate ----------
function parseCsvLine(line){
  const cells = []; let cur = "", quoted = false;
  for (let i = 0; i < line.length; i++){
    const c = line[i];
    if (quoted){
      if (c === '"' && line[i + 1] === '"'){ cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { cells.push(cur); cur = ""; }
    else cur += c;
  }
  cells.push(cur);
  return cells.map(s => s.trim());
}

export function loadForecast(file = DATA_FILE){
  const lines = fs.readFileSync(file, "utf8").replace(/^﻿/, "").split(/\r?\n/);
  const header = parseCsvLine(lines.shift() || "");
  const idx = Object.fromEntries(COLUMNS.map(c => {
    const i = header.findIndex(h => h.toLowerCase() === c.toLowerCase());
    if (i === -1) fail(`missing column "${c}" (expected: ${COLUMNS.join(", ")})`);
    return [c, i];
  }));

  const seen = new Set();
  const electorates = [];
  lines.forEach((line, n) => {
    if (!line.trim()) return;
    const row = parseCsvLine(line);
    const at = `line ${n + 2}`;
    const get = c => row[idx[c]] ?? "";
    const name = get("Electorate");
    if (!name) fail(`${at}: electorate name is empty`);
    if (seen.has(name.toLowerCase())) fail(`${at}: "${name}" appears more than once`);
    seen.add(name.toLowerCase());
    const party = c => {
      const p = get(c).toUpperCase();
      if (!PARTY_NAMES[p]) fail(`${at} (${name}): "${c}" is "${get(c)}" — use one of ${PARTY_ORDER.join(", ")}`);
      return p;
    };
    const prev = party("Previous winner"), winner = party("Projected winner"), runner = party("Runner-up");
    if (winner === runner && winner !== "IND") fail(`${at} (${name}): projected winner and runner-up are the same party`);
    const marginText = get("Margin").replace(/%$/, "");
    const margin = Number(marginText);
    if (marginText === "" || !Number.isFinite(margin) || margin < 0 || margin > 50) fail(`${at} (${name}): margin "${get("Margin")}" must be a number of points between 0 and 50`);
    electorates.push({ name, prev, winner, runner, margin, gain: prev !== winner, close: margin < CLOSE });
  });
  if (electorates.length !== TOTAL_SEATS) fail(`expected ${TOTAL_SEATS} electorates, found ${electorates.length}`);
  electorates.sort((a, b) => a.name.localeCompare(b.name));
  return summarise(electorates);
}

function summarise(electorates){
  const seats = {};
  for (const e of electorates) seats[e.winner] = (seats[e.winner] || 0) + 1;
  const rank = p => (COALITION.includes(p) ? 0 : 1);
  const parties = Object.keys(seats)
    .sort((a, b) => rank(a) - rank(b) || (rank(a) === 0 ? COALITION.indexOf(a) - COALITION.indexOf(b) : seats[b] - seats[a]) || PARTY_ORDER.indexOf(a) - PARTY_ORDER.indexOf(b))
    .map(code => ({ code, name: PARTY_NAMES[code], seats: seats[code], share: seats[code] / TOTAL_SEATS }));
  const coalition = COALITION.reduce((n, p) => n + (seats[p] || 0), 0);
  return {
    electorates, parties, coalition, total: TOTAL_SEATS, majority: MAJORITY,
    coalitionMargin: coalition - MAJORITY,
    coalitionParts: COALITION.filter(p => seats[p]).map(p => `${PARTY_NAMES[p]} ${seats[p]}`),
    gains: electorates.filter(e => e.gain).length,
    closeCount: electorates.filter(e => e.close).length,
  };
}

// ---------- shared fragments ----------
const signed = n => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n);
const partyList = f => f.parties.map(p => `${p.name} ${p.seats}`).join(", ");
const seatSummary = f => `Projected seats: ${partyList(f)}. Coalition ${f.coalition} of ${f.total}; ${f.majority} needed for a majority.`;
const marginSub = f => f.coalitionMargin >= 0 ? "seats above majority" : "seats short of majority";

function seatbarInner(f, { titles }){
  const segs = f.parties.map(p => `<div class="vic-seg ${p.code.toLowerCase()}" style="flex-grow: ${p.seats};"${titles ? ` title="${p.name}: ${p.seats} seat${p.seats === 1 ? "" : "s"}"` : ""}><span>${p.seats}</span></div>`);
  return [
    `<div class="vic-seatbar-bracket" style="width: calc(${f.coalition} / ${f.total} * 100%);">`,
    `  <span>Coalition ${f.coalition}</span>`,
    `</div>`,
    `<div class="vic-seatbar-chart">`,
    titles
      ? `  <div class="vic-seatbar-track" role="img" aria-label="${esc(seatSummary(f))}">`
      : `  <div class="vic-seatbar-track">`,
    ...segs.map(s => "    " + s),
    `  </div>`,
    `  <div class="vic-majority" style="left: calc(${f.majority} / ${f.total} * 100%);"${titles ? ' aria-hidden="true"' : ""}>`,
    `    <span>${f.majority} for majority</span>`,
    `  </div>`,
    `</div>`,
  ];
}

// ---------- victoria-2026.html ----------
const tag = p => `<span class="vic-tag ${p.toLowerCase()}">${PARTY_NAMES[p]}</span>`;

function tableRows(f){
  return f.electorates.flatMap(d => {
    const m = d.margin.toFixed(2);
    const status = `<span class="vic-status ${d.gain ? "gain" : "hold"}">${d.winner} ${d.gain ? "gain" : "hold"}</span>`;
    return [
      `<tr data-name="${esc(d.name)}" data-prev="${d.prev}" data-winner="${d.winner}" data-runner="${d.runner}" data-margin="${m}" data-status="${d.gain ? "gain" : "hold"}"${d.close ? ' data-close="1"' : ""}>`,
      `  <th scope="row" data-label="Electorate">${esc(d.name)}</th>`,
      `  <td data-label="2022 winner">${tag(d.prev)}</td>`,
      `  <td data-label="2026 prediction">${tag(d.winner)}</td>`,
      `  <td data-label="Runner-up">${tag(d.runner)}</td>`,
      `  <td data-label="Margin" class="vic-num">${m}<span class="vic-unit"> pts</span>${d.close ? ` <span class="vic-close" title="Under ${CLOSE} points">Close</span>` : ""}</td>`,
      `  <td data-label="Result">${status}</td>`,
      `</tr>`,
    ];
  });
}

const victoriaBlocks = f => ({
  HEADLINE: [
    `<div class="vic-headline">`,
    `  <div class="vic-headline-item">`,
    `    <span class="vic-headline-label coalition">Coalition total</span>`,
    `    <span class="vic-headline-number">${f.coalition}</span>`,
    `    <span class="vic-headline-sub">${f.coalitionParts.join(" + ") || "No seats"}</span>`,
    `  </div>`,
    `  <div class="vic-headline-item">`,
    `    <span class="vic-headline-label">Majority required</span>`,
    `    <span class="vic-headline-number">${f.majority}</span>`,
    `    <span class="vic-headline-sub">of ${f.total} seats</span>`,
    `  </div>`,
    `  <div class="vic-headline-item">`,
    `    <span class="vic-headline-label">Coalition margin</span>`,
    `    <span class="vic-headline-number">${signed(f.coalitionMargin)}</span>`,
    `    <span class="vic-headline-sub">${marginSub(f)}</span>`,
    `  </div>`,
    `</div>`,
  ],
  SEATBAR: [
    `<figure class="vic-seatbar" aria-labelledby="vic-seatbar-caption">`,
    ...seatbarInner(f, { titles: true }).map(l => "  " + l),
    `  <div class="vic-seatbar-scale" aria-hidden="true">`,
    `    <span>0</span>`,
    `    <span>${f.total}</span>`,
    `  </div>`,
    `  <figcaption id="vic-seatbar-caption" class="hero-footnote">Each segment is sized to its share of the ${f.total} Assembly seats. The white line marks the ${f.majority} seats needed to govern in its own right.</figcaption>`,
    `</figure>`,
  ],
  PARTIES: [
    `<ul class="vic-parties">`,
    ...f.parties.flatMap(p => [
      `  <li class="vic-party ${p.code.toLowerCase()}">`,
      `    <i aria-hidden="true"></i>`,
      `    <span class="vic-party-name">${p.name}</span>`,
      `    <span class="vic-party-seats">${p.seats}</span>`,
      `    <span class="vic-party-share">${pct(p.share)}</span>`,
      `  </li>`,
    ]),
    `</ul>`,
  ],
  WINNER_OPTIONS: [
    `<option value="">All parties</option>`,
    ...f.parties.map(p => `<option value="${p.code}">${p.name}</option>`),
  ],
  COUNT: [`<p id="vic-count" aria-live="polite">Showing ${f.total} of ${f.total} electorates</p>`],
  TABLE: tableRows(f),
});

const metaDescription = f => f.coalition >= f.majority
  ? `Mustycaribou's independent seat-by-seat forecast for the 2026 Victorian state election: a projected ${f.coalition}-seat Coalition majority in the ${f.total}-seat Legislative Assembly.`
  : `Mustycaribou's independent seat-by-seat forecast for the 2026 Victorian state election: the Coalition is projected to win ${f.coalition} seats in the ${f.total}-seat Legislative Assembly, short of the ${f.majority} needed for a majority.`;
const socialDescription = f => `Projected Legislative Assembly: ${partyList(f)}. Coalition ${f.coalition} of ${f.total} seats.`;

// ---------- index.html ----------
const homeBlocks = f => ({
  HOME_TITLE: [`<h2 class="home-hero-title" id="home-vic-title">Coalition projected to win ${f.coalition} of ${f.total} seats.</h2>`],
  HOME_PANEL: [
    `<a class="vic-panel home-vic-panel" href="victoria-2026.html" aria-label="${esc(`Projected Victorian Legislative Assembly: ${partyList(f)}. Coalition ${f.coalition} of ${f.total}; ${f.majority} needed for a majority. Open the full forecast.`)}">`,
    `  <div class="tally-chamber-label">`,
    `    <span>Victorian Legislative Assembly</span>`,
    `    <span>${f.total} seats</span>`,
    `  </div>`,
    ``,
    `  <div class="home-vic-figures" aria-hidden="true">`,
    `    <div>`,
    `      <span class="vic-headline-label coalition">Coalition</span>`,
    `      <span class="vic-headline-number">${f.coalition}</span>`,
    `    </div>`,
    `    <div>`,
    `      <span class="vic-headline-label">Majority</span>`,
    `      <span class="vic-headline-number">${f.majority}</span>`,
    `    </div>`,
    `    <div>`,
    `      <span class="vic-headline-label">Margin</span>`,
    `      <span class="vic-headline-number">${signed(f.coalitionMargin)}</span>`,
    `    </div>`,
    `  </div>`,
    ``,
    `  <div class="vic-seatbar" aria-hidden="true">`,
    ...seatbarInner(f, { titles: false }).map(l => "    " + l),
    `  </div>`,
    ``,
    `  <ul class="home-vic-legend" aria-hidden="true">`,
    ...f.parties.map(p => `    <li class="${p.code.toLowerCase()}"><i></i>${p.name} <strong>${p.seats}</strong></li>`),
    `  </ul>`,
    ``,
    `  <span class="home-vic-cta" aria-hidden="true">Full Victorian forecast &rarr;</span>`,
    `</a>`,
  ],
});

// ---------- marker replacement ----------
function fillBlocks(html, blocks, file){
  for (const [name, lines] of Object.entries(blocks)){
    const re = new RegExp(`([ \\t]*)<!-- VIC:${name} -->[\\s\\S]*?<!-- /VIC:${name} -->`);
    const m = html.match(re);
    if (!m) throw new ForecastError(`${file}: missing <!-- VIC:${name} --> ... <!-- /VIC:${name} --> markers`);
    const indent = m[1];
    const body = lines.map(l => (l ? indent + l : "")).join("\n");
    html = html.replace(re, () => `${indent}<!-- VIC:${name} -->\n${body}\n${indent}<!-- /VIC:${name} -->`);
  }
  return html;
}

function setMeta(html, attr, key, value, file){
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(">)`);
  if (!re.test(html)) throw new ForecastError(`${file}: missing <meta ${attr}="${key}"> tag`);
  return html.replace(re, (_, a, b) => a + esc(value) + b);
}

export function renderVictoriaPage(html, f){
  const file = "victoria-2026.html";
  html = fillBlocks(html, victoriaBlocks(f), file);
  html = setMeta(html, "name", "description", metaDescription(f), file);
  html = setMeta(html, "property", "og:description", socialDescription(f), file);
  html = setMeta(html, "name", "twitter:description", socialDescription(f), file);
  return html;
}

export function renderHomepage(html, f){
  return fillBlocks(html, homeBlocks(f), "index.html");
}

/** Regenerate the Victorian sections of victoria-2026.html and index.html inside `dir`. */
export function applyForecast(dir){
  const f = loadForecast();
  const targets = [["victoria-2026.html", renderVictoriaPage], ["index.html", renderHomepage]];
  for (const [name, render] of targets){
    const file = path.join(dir, name);
    fs.writeFileSync(file, render(fs.readFileSync(file, "utf8"), f));
  }
  return f;
}

export function describe(f){
  return `Victoria 2026: ${partyList(f)} (Coalition ${f.coalition}/${f.total}; ${f.gains} gains, ${f.total - f.gains} holds, ${f.closeCount} close)`;
}

// Run directly: refresh the repository copies of the pages.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)){
  try {
    console.log(describe(applyForecast(ROOT)));
  } catch (err){
    if (!(err instanceof ForecastError)) throw err;
    console.error("x " + err.message);
    process.exit(1);
  }
}
