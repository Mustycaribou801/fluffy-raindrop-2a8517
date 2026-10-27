/* ==========================================================
   THE MARGIN — behavior
   ========================================================== */

const RATING_LABELS = {
  SD: "Safe D", LD: "Likely D", TD: "Lean D",
  TU: "Toss-up",
  TR: "Lean R", LR: "Likely R", SR: "Safe R",
};

// ---------- Flip-digit counter (split-flap board effect) ----------
class FlipCounter {
  constructor(el, target, digits){
    this.el = el;
    this.target = target;
    this.digits = digits;
    this.el.innerHTML = "";
    this.cells = [];
    for (let i = 0; i < digits; i++){
      const d = document.createElement("div");
      d.className = "flip-digit";
      d.innerHTML = '<div class="face">0</div>';
      this.el.appendChild(d);
      this.cells.push(d);
    }
  }
  run(){
    const str = String(this.target).padStart(this.digits, "0").slice(-this.digits);
    this.cells.forEach((cell, i) => {
      const targetDigit = parseInt(str[i], 10);
      const face = cell.querySelector(".face");
      let current = 0;
      const delay = i * 60;
      setTimeout(() => {
        const tick = setInterval(() => {
          cell.classList.add("flipping");
          current = (current + 1) % 10;
          face.textContent = current;
          if (current === targetDigit){
            clearInterval(tick);
            setTimeout(() => cell.classList.remove("flipping"), 90);
          }
        }, 90);
      }, delay);
    });
  }
}

// ---------- Tally math ----------
function tallyChamber(safeD, safeR, races, majority){
  let d = safeD, r = safeR, tu = 0;
  races.forEach(race => {
    const rating = race.rating;
    if (rating === "SD" || rating === "LD" || rating === "TD") d++;
    else if (rating === "SR" || rating === "LR" || rating === "TR") r++;
    else if (rating === "TU") tu++;
  });
  return { d, r, tu, total: d + r + tu };
}

function renderTally({ elPrefix, safeD, safeR, races, majority, digits }){
  const { d, r, tu, total } = tallyChamber(safeD, safeR, races, majority);
  const demEl = document.getElementById(`${elPrefix}-dem-flip`);
  const repEl = document.getElementById(`${elPrefix}-rep-flip`);
  if (demEl){
    const c = new FlipCounter(demEl, d, digits);
    c.run();
  }
  if (repEl){
    const c = new FlipCounter(repEl, r, digits);
    c.run();
  }
  const barEl = document.getElementById(`${elPrefix}-bar`);
  if (barEl){
    const pd = (d / total) * 100;
    const ptu = (tu / total) * 100;
    const pr = (r / total) * 100;
    barEl.innerHTML = `
      <div class="seg-dem" style="width:${pd}%"></div>
      <div class="seg-tu" style="width:${ptu}%"></div>
      <div class="seg-rep" style="width:${pr}%"></div>
    `;
  }
  const majEl = document.getElementById(`${elPrefix}-majority-note`);
  if (majEl){
    const leaderParty = d > r ? "D" : r > d ? "R" : "TIED";
    const leaderMargin = Math.abs(d - r);
    majEl.innerHTML = `<strong>${majority}</strong> needed for control &middot; ${tu} toss-up${tu === 1 ? "" : "s"} outstanding &middot; current edge: <strong>${leaderParty === "TIED" ? "even" : leaderParty}</strong>${leaderParty !== "TIED" ? " +" + leaderMargin : ""}`;
  }
}

// Positive margins indicate Democrats; negative margins indicate Republicans.
// Null indicates a prediction has not been published.
function formatProjectedMargin(margin){
  if (typeof margin !== "number" || !Number.isFinite(margin)) return "Not yet published";
  if (margin === 0) return "EVEN";
  return `${margin > 0 ? "D" : "R"}+${Math.abs(margin).toFixed(1)}`;
}

// ---------- Projected seat flips ----------
// Party currently holding the seat: "D", "R", "OPEN-D" and "OPEN-R" reduce to D or R.
function seatHolderParty(race){
  return (race.incumbent || "").replace("OPEN-", "");
}

// Party projected to win from the signed margin (positive = D, negative = R).
// An even or unpublished margin is treated as a hold for the current party.
function projectedWinnerParty(race){
  if (typeof race.margin !== "number" || !Number.isFinite(race.margin) || race.margin === 0) return seatHolderParty(race);
  return race.margin > 0 ? "D" : "R";
}

// Returns "D" or "R" for the party gaining the seat, or "" if no flip.
function seatFlip(holder, winner){
  return holder && winner && holder !== winner ? winner : "";
}

function projectedFlip(race){
  return seatFlip(seatHolderParty(race), projectedWinnerParty(race));
}

function flipBadge(party){
  if (!party) return "";
  const from = party === "D" ? "Republican" : "Democratic";
  const to = party === "D" ? "Democrats" : "Republicans";
  return `<span class="flip-badge ${party === "D" ? "dem" : "rep"}" title="Projected pickup: ${from}-held seat projected for ${to}">${party} FLIP</span>`;
}

// Small "Projected Seat Flips" summary, derived from every race's margin.
function renderProjectedFlips(containerId){
  const el = document.getElementById(containerId);
  if (!el) return;
  const flips = SENATE.races
    .map(r => ({ race: r, party: projectedFlip(r) }))
    .filter(f => f.party)
    .sort((a,b) => a.race.state.localeCompare(b.race.state));
  const dGain = flips.filter(f => f.party === "D").length;
  const rGain = flips.length - dGain;
  const net = dGain - rGain;
  const netText = net === 0 ? "No net change" : `Net ${net > 0 ? "D" : "R"} +${Math.abs(net)}`;
  el.innerHTML = `
    <div class="flip-summary-head">
      <span class="flip-summary-title">Projected Seat Flips</span>
      <span class="flip-summary-net">${flips.length ? netText : "None projected"}</span>
    </div>
    ${flips.length ? `<ul class="flip-summary-list">
      ${flips.map(f => `
        <li><a href="${senateRaceHref(f.race.abbr)}">${f.race.state}</a> ${flipBadge(f.party)} <span class="flip-summary-margin">${formatProjectedMargin(f.race.margin)}</span></li>
      `).join("")}
    </ul>` : '<p class="flip-summary-empty">Every seat is currently projected to stay with its party.</p>'}
  `;
}

// ---------- Race board rendering ----------
function renderRaceBoard(tbodyId, races, keyLabel){
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const order = ["SD","LD","TD","TU","TR","LR","SR"];
  const sorted = [...races].sort((a,b) => order.indexOf(a.rating) - order.indexOf(b.rating));
  const isSenateBoard = tbodyId === "senate-race-tbody";
  tbody.innerHTML = sorted.map(r => `
    <tr${isSenateBoard ? ` id="race-${r.abbr}" data-rating="${r.rating}" data-search="${`${r.state} ${r.abbr} ${r.incumbentName || ""}`.toLowerCase()}"` : ""}>
      <td>${r.abbr ? `<a class="race-link" href="${senateRaceHref(r.abbr)}">${r.state} <span class="race-link-arrow" aria-hidden="true">&rarr;</span></a>` : (r.district || r.state)}</td>
      <td>${(r.incumbent || "").replace("OPEN-", "Open (")}${r.incumbent && r.incumbent.startsWith("OPEN") ? ")" : ""}</td>
      <td><span class="rating-chip ${r.rating}">${RATING_LABELS[r.rating]}</span></td>
      ${isSenateBoard ? `<td class="margin-cell">${formatProjectedMargin(r.margin)} ${flipBadge(projectedFlip(r))}</td>` : ""}
      <td>${r.note || ""}</td>
    </tr>
  `).join("");
}

// Governor race data is keyed by full state name, so map names to abbreviations.
const STATE_ABBR = {
  "Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA",
  "Colorado":"CO","Connecticut":"CT","Delaware":"DE","Florida":"FL","Georgia":"GA",
  "Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas":"KS",
  "Kentucky":"KY","Louisiana":"LA","Maine":"ME","Maryland":"MD","Massachusetts":"MA",
  "Michigan":"MI","Minnesota":"MN","Mississippi":"MS","Missouri":"MO","Montana":"MT",
  "Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM",
  "New York":"NY","North Carolina":"NC","North Dakota":"ND","Ohio":"OH","Oklahoma":"OK",
  "Oregon":"OR","Pennsylvania":"PA","Rhode Island":"RI","South Carolina":"SC",
  "South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT",
  "Virginia":"VA","Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY"
};

function renderGovernorMap(containerId, races){
  const container = document.getElementById(containerId);
  if (!container) return;

  const positions = {
    AK:[9,78], AL:[60,63], AR:[52,58], AZ:[26,57], CO:[36,48], DE:[79,45], FL:[68,76], GA:[64,63],
    IA:[52,39], ID:[24,31], IL:[58,43], KS:[45,50], KY:[62,49], LA:[54,69], MA:[86,31],
    ME:[88,18], MI:[63,33], MN:[50,25], MS:[58,64], MT:[32,23], NC:[73,56], ND:[43,23],
    NE:[45,41], NH:[85,25], NJ:[80,42], NM:[34,59], NV:[22,45], OH:[68,41], OK:[47,58],
    OR:[13,35], PA:[74,39], RI:[86,34], SC:[70,61], SD:[43,32], TN:[61,55], TX:[44,71],
    VA:[75,51], VT:[82,24], WA:[16,23], WI:[57,30], WV:[70,47], WY:[33,36]
  };

  container.innerHTML = races.map(race => {
    const abbr = race.abbr || STATE_ABBR[race.state];
    const coords = positions[abbr];
    if (!coords) return ""; // skip states without coordinates rather than stacking them
    const [x, y] = coords;

    // Not a link: there is no Governor race-detail page yet.
    return `
      <span class="senate-state ${ratingTone(race.rating)}"
         style="--x:${x}; --y:${y};"
         role="img"
         aria-label="${race.state} Governor race, ${RATING_LABELS[race.rating]}">
        <span>${abbr}</span>
      </span>
    `;
  }).join("");
}

function ratingTone(rating){
  if (rating === "TU") return "toss";
  if (rating.endsWith("D")) return "dem";
  return "rep";
}

function renderSenateMap(containerId, races){
  const container = document.getElementById(containerId);
  if (!container) return;
  const positions = {
    AK:[9,78], AL:[60,63], AR:[52,58], CO:[36,48], DE:[79,45], FL:[68,76], GA:[64,63],
    IA:[52,39], ID:[24,31], IL:[58,43], KS:[45,50], KY:[62,49], LA:[54,69], MA:[86,31],
    ME:[88,18], MI:[63,33], MN:[50,25], MS:[58,64], MT:[32,23], NC:[73,56], ND:[43,23],
    NE:[45,41], NH:[85,25], NJ:[80,42], NM:[34,59], NV:[22,45], OH:[68,41], OK:[47,58],
    OR:[13,35], PA:[74,39], RI:[86,34], SC:[70,61], SD:[43,32], TN:[61,55], TX:[44,71],
    VA:[75,51], VT:[82,24], WA:[16,23], WI:[57,30], WV:[70,47], WY:[33,36]
  };
  container.innerHTML = races.map(race => {
    const [x, y] = positions[race.abbr] || [50, 50];
    return `
      <a class="senate-state ${ratingTone(race.rating)}" style="--x:${x}; --y:${y};" href="senate-race.html?state=${encodeURIComponent(race.abbr)}" aria-label="${race.state} Senate race, ${RATING_LABELS[race.rating]}">
        <span>${race.abbr}</span>
      </a>
    `;
  }).join("");
}

function findSenateRace(){
  const params = new URLSearchParams(location.search);
  const requested = (params.get("state") || "GA").toUpperCase();
  return SENATE.races.find(r => r.abbr === requested) || SENATE.races[0];
}

function renderSenateRacePage(){
  const race = findSenateRace();
  document.title = `${race.state} Senate Forecast — Mustycaribou Forecasts`;
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  setText("race-state", `${race.state} Senate`);
  setText("race-held-by", race.heldBy);
  setText("race-incumbent", race.incumbentName);
  setText("race-candidate-status", race.candidateStatus);
  setText("race-polling", race.polling);
  setText("race-previous-results", race.previousResults);
  setText("race-demographic-trends", race.demographicTrends);
  setText("race-analysis", race.analysis);
  setText("race-last-updated", race.lastUpdated);
  setText("race-margin", formatProjectedMargin(race.margin));
  const marginEl = document.getElementById("race-margin");
  if (marginEl) marginEl.insertAdjacentHTML("beforeend", flipBadge(projectedFlip(race)));

  const rating = document.getElementById("race-rating");
  if (rating) rating.innerHTML = `<span class="rating-chip ${race.rating}">${RATING_LABELS[race.rating]}</span>`;

  const history = document.getElementById("race-rating-history");
  if (history) history.innerHTML = race.ratingHistory.map(item => `
    <li><strong>${item.date}</strong> <span class="rating-chip ${item.rating}">${RATING_LABELS[item.rating]}</span> ${item.note}</li>
  `).join("");

  const sources = document.getElementById("race-sources");
  if (sources) sources.innerHTML = race.sources.map(name => {
    const href = SENATE_SOURCE_LINKS[name];
    return `<li>${href ? `<a href="${href}" rel="noopener" target="_blank">${name}</a>` : name}</li>`;
  }).join("");

  renderRaceNav(race);
  renderUpdateLog("race-update-log", { abbr: race.abbr, showRace: false });
}

// ---------- Board <-> race page navigation ----------
function senateRaceHref(abbr){
  return `senate-race.html?state=${encodeURIComponent(abbr)}`;
}

// Same order as the forecast table (Safe D -> Safe R), so prev/next walks the board.
function senateBoardOrder(){
  const order = ["SD","LD","TD","TU","TR","LR","SR"];
  return [...SENATE.races].sort((a,b) => order.indexOf(a.rating) - order.indexOf(b.rating));
}

function renderRaceNav(race){
  const board = senateBoardOrder();
  const i = board.findIndex(r => r.abbr === race.abbr);
  const prev = board[(i - 1 + board.length) % board.length];
  const next = board[(i + 1) % board.length];

  const back = document.getElementById("race-back-link");
  if (back) back.href = `forecast.html#race-${race.abbr}`;
  const crumb = document.getElementById("race-crumb-state");
  if (crumb) crumb.textContent = race.state;

  const nav = document.getElementById("race-pager");
  if (nav) nav.innerHTML = `
    <a class="race-pager-link" href="${senateRaceHref(prev.abbr)}" rel="prev">
      <span class="race-pager-dir">&larr; Previous on board</span>
      <span class="race-pager-state">${prev.state} <span class="rating-chip ${prev.rating}">${RATING_LABELS[prev.rating]}</span></span>
    </a>
    <a class="race-pager-link next" href="${senateRaceHref(next.abbr)}" rel="next">
      <span class="race-pager-dir">Next on board &rarr;</span>
      <span class="race-pager-state">${next.state} <span class="rating-chip ${next.rating}">${RATING_LABELS[next.rating]}</span></span>
    </a>
  `;

  const jump = document.getElementById("race-jump");
  if (jump){
    jump.innerHTML = [...SENATE.races]
      .sort((a,b) => a.state.localeCompare(b.state))
      .map(r => `<option value="${r.abbr}"${r.abbr === race.abbr ? " selected" : ""}>${r.state} — ${RATING_LABELS[r.rating]}</option>`)
      .join("");
    jump.addEventListener("change", () => { location.href = senateRaceHref(jump.value); });
  }
}

// Search box + rating filter for the Senate board.
function initBoardFilter(tbodyId, searchId, ratingId, countId){
  const tbody = document.getElementById(tbodyId);
  const search = document.getElementById(searchId);
  const rating = document.getElementById(ratingId);
  const count = document.getElementById(countId);
  if (!tbody || !search || !rating) return;
  const apply = () => {
    const q = search.value.trim().toLowerCase();
    const group = rating.value;
    let shown = 0;
    tbody.querySelectorAll("tr").forEach(tr => {
      const r = tr.dataset.rating;
      const matchesGroup = !group
        || (group === "D" && r.endsWith("D"))
        || (group === "R" && r.endsWith("R"))
        || (group === "competitive" && ["TD","TU","TR"].includes(r))
        || r === group;
      const visible = matchesGroup && (!q || tr.dataset.search.includes(q));
      tr.hidden = !visible;
      if (visible) shown++;
    });
    if (count) count.textContent = `${shown} of ${tbody.rows.length} races shown`;
  };
  search.addEventListener("input", apply);
  rating.addEventListener("change", apply);
  apply();
}

// Coming back from a race page via forecast.html#race-XX: highlight that row.
function highlightBoardRow(){
  const id = location.hash.slice(1);
  if (!id.startsWith("race-")) return;
  const row = document.getElementById(id);
  if (!row) return;
  row.classList.add("is-target");
  row.scrollIntoView({ block: "center" });
}

// ---------- Senate Battleground Calculator ----------
// Every race within 10 points (either way) is switchable; it starts on the party
// its published margin projects. All other races stay locked to their projected
// winner, so the totals always reflect holdovers plus all 35 race outcomes.
const BATTLEGROUND_MAX_MARGIN = 10;

function isBattleground(race){
  return typeof race.margin === "number" && Math.abs(race.margin) <= BATTLEGROUND_MAX_MARGIN;
}

function renderSenateCalculator(containerId){
  const root = document.getElementById(containerId);
  if (!root) return;

  const battlegrounds = SENATE.races
    .filter(isBattleground)
    .sort((a,b) => b.margin - a.margin);
  let lockedD = 0, lockedR = 0;
  SENATE.races.forEach(r => {
    if (isBattleground(r)) return;
    if (projectedWinnerParty(r) === "D") lockedD++; else lockedR++;
  });
  const baseD = SENATE.currentHoldoverD + lockedD;
  const baseR = SENATE.currentHoldoverR + lockedR;
  const total = SENATE.currentHoldoverD + SENATE.currentHoldoverR + SENATE.races.length;
  const forecastPicks = () => Object.fromEntries(battlegrounds.map(r => [r.abbr, projectedWinnerParty(r)]));
  let picks = forecastPicks();

  root.innerHTML = `
    <div class="calc-result">
      <div class="calc-seats">
        <div class="calc-party dem"><span class="calc-party-label">Democrats</span><span class="calc-number" id="calc-d"></span></div>
        <div class="calc-party toss"><span class="calc-party-label">For majority</span><span class="calc-number">${SENATE.majority}</span></div>
        <div class="calc-party rep"><span class="calc-party-label">Republicans</span><span class="calc-number" id="calc-r"></span></div>
      </div>
      <div class="calc-bar" id="calc-bar" aria-hidden="true"></div>
      <p class="calc-verdict" id="calc-verdict" aria-live="polite"></p>
      <p class="calc-scenario-flips" id="calc-flips"></p>
    </div>
    <div class="calc-controls">
      <div class="calc-actions">
        <button type="button" class="race-tab" data-all="D">All battlegrounds D</button>
        <button type="button" class="race-tab" data-all="forecast">Reset to Forecast</button>
        <button type="button" class="race-tab" data-all="R">All battlegrounds R</button>
      </div>
      ${battlegrounds.length ? `<ul class="calc-list">
        ${battlegrounds.map(r => `
          <li class="calc-race" data-abbr="${r.abbr}">
            <span class="calc-race-title"><a class="calc-race-name" href="${senateRaceHref(r.abbr)}">${r.state}</a> <span data-flip></span></span>
            <span class="calc-race-held">Held by ${r.heldBy} &middot; Forecast ${formatProjectedMargin(r.margin)} <span class="rating-chip ${r.rating}">${RATING_LABELS[r.rating]}</span></span>
            <div class="calc-toggle" role="group" aria-label="Assign ${r.state}">
              <button type="button" data-pick="D" aria-pressed="false">Dem</button>
              <button type="button" data-pick="R" aria-pressed="false">Rep</button>
            </div>
          </li>`).join("")}
      </ul>` : '<p class="calc-footnote">No races are currently within 10 points.</p>'}
      <p class="calc-footnote">Battlegrounds are every race with a projected margin of ${BATTLEGROUND_MAX_MARGIN} points or less (${battlegrounds.length} of ${SENATE.races.length}). Starting point: ${SENATE.currentHoldoverD} Democratic/independent and ${SENATE.currentHoldoverR} Republican seats not up in 2026, plus the ${SENATE.races.length - battlegrounds.length} other races counted for their projected winner (${lockedD} D, ${lockedR} R). This is a scenario tool, not a probability.</p>
    </div>
  `;

  const update = () => {
    let d = baseD, r = baseR, gainD = 0, gainR = 0;
    battlegrounds.forEach(b => {
      if (picks[b.abbr] === "D") d++; else r++;
      const flip = seatFlip(seatHolderParty(b), picks[b.abbr]);
      if (flip === "D") gainD++; else if (flip === "R") gainR++;
    });
    document.getElementById("calc-d").textContent = d;
    document.getElementById("calc-r").textContent = r;
    document.getElementById("calc-bar").innerHTML = `
      <div class="seg-dem" style="width:${(d / total) * 100}%"></div>
      <div class="seg-rep" style="width:${(r / total) * 100}%"></div>
      <span class="calc-bar-mark" style="left:${(SENATE.majority / total) * 100}%"></span>
    `;
    let verdict;
    if (d >= SENATE.majority) verdict = `<strong class="dem">Democratic control</strong> with ${d} seats (${SENATE.majority} needed for a majority).`;
    else if (r >= SENATE.majority) verdict = `<strong class="rep">Republican control</strong> with ${r} seats (${SENATE.majority} needed for a majority).`;
    else verdict = `<strong>${d}–${r} tie.</strong> Neither party reaches ${SENATE.majority}; control would rest on the Vice President's tie-breaking vote.`;
    document.getElementById("calc-verdict").innerHTML = verdict;
    document.getElementById("calc-flips").innerHTML = gainD || gainR
      ? `Battleground seats changing hands in this scenario: ${gainD ? `${flipBadge("D")} &times;${gainD}` : ""} ${gainR ? `${flipBadge("R")} &times;${gainR}` : ""}`
      : "No battleground seats change hands in this scenario.";
    root.querySelectorAll(".calc-race").forEach(li => {
      const pick = picks[li.dataset.abbr];
      const race = battlegrounds.find(b => b.abbr === li.dataset.abbr);
      li.dataset.pick = pick;
      li.querySelector("[data-flip]").innerHTML = flipBadge(seatFlip(seatHolderParty(race), pick));
      li.querySelectorAll("[data-pick]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.pick === pick)));
    });
  };

  root.addEventListener("click", e => {
    const pickBtn = e.target.closest("[data-pick]");
    if (pickBtn){
      picks[pickBtn.closest(".calc-race").dataset.abbr] = pickBtn.dataset.pick;
      update();
      return;
    }
    const allBtn = e.target.closest("[data-all]");
    if (allBtn){
      if (allBtn.dataset.all === "forecast") picks = forecastPicks();
      else battlegrounds.forEach(b => { picks[b.abbr] = allBtn.dataset.all; });
      update();
    }
  });
  update();
}

// ---------- Forecast update log ----------
// Combines FORECAST_UPDATES with each race's ratingHistory. If a race's current
// rating or margin differs from its last logged value, that change is listed as
// "not yet logged" rather than given an invented date or reason.
function buildUpdateLog(){
  const entries = [];
  const manual = typeof FORECAST_UPDATES !== "undefined" ? FORECAST_UPDATES : [];
  manual.forEach(u => entries.push({ ...u }));

  SENATE.races.forEach(race => {
    let prev = null;
    (race.ratingHistory || []).forEach(h => {
      const dup = manual.some(u => u.abbr === race.abbr && u.type === "rating" && u.date === h.date && u.to === h.rating);
      if (!dup) entries.push({ date: h.date, abbr: race.abbr, type: "rating", from: prev, to: h.rating, explanation: h.note });
      prev = h.rating;
    });

    const lastRating = entries
      .filter(e => e.abbr === race.abbr && e.type === "rating" && e.date)
      .sort((a,b) => a.date.localeCompare(b.date)).pop();
    if (lastRating && lastRating.to !== race.rating){
      entries.push({ date: null, abbr: race.abbr, type: "rating", from: lastRating.to, to: race.rating, explanation: null });
    }

    const lastMargin = entries
      .filter(e => e.abbr === race.abbr && e.type === "margin" && e.date)
      .sort((a,b) => a.date.localeCompare(b.date)).pop();
    const loggedMargin = lastMargin ? lastMargin.to : null;
    if (typeof race.margin === "number" && loggedMargin !== race.margin){
      entries.push({ date: null, abbr: race.abbr, type: "margin", from: loggedMargin, to: race.margin, explanation: null });
    }
  });

  // Unlogged changes first, then newest first.
  return entries.sort((a,b) => {
    if (!a.date !== !b.date) return a.date ? 1 : -1;
    return (b.date || "").localeCompare(a.date || "") || a.abbr.localeCompare(b.abbr);
  });
}

function describeUpdateChange(entry){
  if (entry.type === "margin"){
    return `<span class="log-value">${formatProjectedMargin(entry.from)}</span> <span class="log-arrow" aria-label="to">&rarr;</span> <span class="log-value">${formatProjectedMargin(entry.to)}</span>`;
  }
  const chip = code => `<span class="rating-chip ${code}">${RATING_LABELS[code]}</span>`;
  return entry.from && entry.from !== entry.to
    ? `${chip(entry.from)} <span class="log-arrow" aria-label="to">&rarr;</span> ${chip(entry.to)}`
    : `${chip(entry.to)} <span class="log-initial">initial rating</span>`;
}

function renderUpdateLog(listId, { abbr = "", type = "", limit = 0, showRace = true } = {}){
  const list = document.getElementById(listId);
  if (!list) return;
  const raceByAbbr = Object.fromEntries(SENATE.races.map(r => [r.abbr, r]));
  let entries = buildUpdateLog().filter(e => (!abbr || e.abbr === abbr) && (!type || e.type === type));
  const totalMatching = entries.length;
  if (limit) entries = entries.slice(0, limit);

  if (!entries.length){
    list.innerHTML = '<li class="miss-empty">No updates match this filter.</li>';
    return totalMatching;
  }
  list.innerHTML = entries.map(e => {
    const race = raceByAbbr[e.abbr];
    const name = race ? race.state : e.abbr;
    return `
      <li class="log-entry${e.date ? "" : " is-unlogged"}">
        <span class="log-date">${e.date || "Date not logged"}</span>
        <div class="log-body">
          <div class="log-head">
            ${showRace ? `<a class="log-race" href="${senateRaceHref(e.abbr)}">${name}</a>` : ""}
            <span class="log-type">${e.type === "margin" ? "Projected margin" : "Rating"}</span>
            <span class="log-change">${describeUpdateChange(e)}</span>
          </div>
          <p class="log-note">${e.explanation || "Explanation not yet recorded for this change."}</p>
        </div>
      </li>
    `;
  }).join("");
  return totalMatching;
}

function initUpdateLogPage(){
  const race = document.getElementById("log-filter-race");
  const type = document.getElementById("log-filter-type");
  const count = document.getElementById("log-count");
  if (!race || !type) return;
  race.innerHTML = '<option value="">All Senate races</option>' + [...SENATE.races]
    .sort((a,b) => a.state.localeCompare(b.state))
    .map(r => `<option value="${r.abbr}">${r.state}</option>`).join("");
  const params = new URLSearchParams(location.search);
  if (params.get("state")) race.value = params.get("state").toUpperCase();
  const apply = () => {
    const n = renderUpdateLog("update-log", { abbr: race.value, type: type.value });
    if (count) count.textContent = `${n} entr${n === 1 ? "y" : "ies"}`;
  };
  race.addEventListener("change", apply);
  type.addEventListener("change", apply);
  apply();
}

// ---------- 2024 predicted vs actual (track record) ----------
// Archive rows store unsigned margins plus a winning party; convert to signed
// (positive = D) so predicted and actual sit on one axis.
function signedMargin(party, margin){
  return party === "D" ? margin : -margin;
}

function accuracySummary(races){
  const signedErrors = races.map(r => signedMargin(r.predicted, r.predictedMargin) - signedMargin(r.actual, r.actualMargin));
  const absErrors = signedErrors.map(Math.abs);
  const mean = xs => xs.reduce((a,b) => a + b, 0) / xs.length;
  return {
    n: races.length,
    correct: races.filter(r => r.predicted === r.actual).length,
    meanAbs: mean(absErrors),
    bias: mean(signedErrors), // > 0: forecast was more Democratic than the result
    within3: absErrors.filter(e => e <= 3).length,
  };
}

function renderAccuracySummary(containerId, races){
  const el = document.getElementById(containerId);
  if (!el) return;
  const s = accuracySummary(races);
  const biasParty = s.bias > 0 ? "Republicans" : "Democrats";
  el.innerHTML = `
    <div class="stat-card"><span class="stat-number">${s.meanAbs.toFixed(1)}</span><span class="stat-label">Average forecast error (pts)</span></div>
    <div class="stat-card"><span class="stat-number">${s.bias > 0 ? "D" : "R"}+${Math.abs(s.bias).toFixed(1)}</span><span class="stat-label">Average lean of the forecast vs. result (underestimated ${biasParty})</span></div>
    <div class="stat-card"><span class="stat-number">${s.within3}/${s.n}</span><span class="stat-label">Within 3 pts of the actual margin</span></div>
    <div class="stat-card"><span class="stat-number">${s.correct}/${s.n}</span><span class="stat-label">Winners called correctly in this set</span></div>
  `;
}

function renderMarginChart(containerId, races, { maxActual = Infinity } = {}){
  const el = document.getElementById(containerId);
  if (!el) return;
  const rows = races
    .filter(r => r.actualMargin <= maxActual)
    .map(r => ({ ...r, p: signedMargin(r.predicted, r.predictedMargin), a: signedMargin(r.actual, r.actualMargin) }))
    .sort((x,y) => y.a - x.a);
  const extent = Math.max(5, ...rows.map(r => Math.max(Math.abs(r.p), Math.abs(r.a))));
  const domain = Math.ceil(extent / 5) * 5;
  const pos = v => ((v + domain) / (2 * domain)) * 100;
  const step = domain <= 15 ? 5 : domain <= 40 ? 10 : 20;
  const ticks = [];
  for (let t = -domain; t <= domain; t += step) ticks.push(t);
  const tickLabel = t => t === 0 ? "EVEN" : `${t > 0 ? "D" : "R"}+${Math.abs(t)}`;

  el.innerHTML = `
    <div class="mchart-axis" aria-hidden="true">
      <span class="mchart-label"></span>
      <div class="mchart-track">${ticks.map(t => `<span class="mchart-tick" style="left:${pos(t)}%">${tickLabel(t)}</span>`).join("")}</div>
    </div>
    ${rows.map(r => {
      const err = Math.abs(r.p - r.a);
      const miss = r.predicted !== r.actual;
      const lo = Math.min(pos(r.p), pos(r.a)), hi = Math.max(pos(r.p), pos(r.a));
      const summary = `${r.state}: predicted ${formatProjectedMargin(r.p)}, actual ${formatProjectedMargin(r.a)}, error ${err.toFixed(1)} points${miss ? ", wrong winner" : ""}`;
      return `
        <div class="mchart-row${miss ? " is-miss" : ""}" tabindex="0" role="img" aria-label="${summary}"
             data-state="${r.state}" data-p="${formatProjectedMargin(r.p)}" data-a="${formatProjectedMargin(r.a)}" data-err="${err.toFixed(1)}" data-miss="${miss}">
          <span class="mchart-label">${r.abbr || r.state}${miss ? ' <span class="mchart-flag">Miss</span>' : ""}</span>
          <div class="mchart-track">
            ${ticks.map(t => `<span class="mchart-grid${t === 0 ? " zero" : ""}" style="left:${pos(t)}%"></span>`).join("")}
            <span class="mchart-link" style="left:${lo}%; width:${hi - lo}%"></span>
            <span class="mchart-dot predicted ${r.p >= 0 ? "dem" : "rep"}" style="left:${pos(r.p)}%"></span>
            <span class="mchart-dot actual ${r.a >= 0 ? "dem" : "rep"}" style="left:${pos(r.a)}%"></span>
          </div>
        </div>`;
    }).join("")}
    <div class="mchart-tooltip" role="presentation" hidden></div>
  `;

  const tip = el.querySelector(".mchart-tooltip");
  const show = row => {
    tip.innerHTML = "";
    const title = document.createElement("strong");
    title.textContent = row.dataset.state;
    tip.appendChild(title);
    [["Predicted", row.dataset.p], ["Actual", row.dataset.a], ["Error", `${row.dataset.err} pts`]].forEach(([k, v]) => {
      const line = document.createElement("span");
      const val = document.createElement("b");
      val.textContent = v;
      line.append(val, ` ${k.toLowerCase()}`);
      tip.appendChild(line);
    });
    if (row.dataset.miss === "true"){
      const flag = document.createElement("span");
      flag.className = "mchart-flag";
      flag.textContent = "Wrong winner";
      tip.appendChild(flag);
    }
    tip.hidden = false;
    tip.style.top = `${row.offsetTop + row.offsetHeight + 4}px`;
  };
  const hide = () => { tip.hidden = true; };
  el.querySelectorAll(".mchart-row").forEach(row => {
    row.addEventListener("pointerenter", () => show(row));
    row.addEventListener("focus", () => show(row));
    row.addEventListener("pointerleave", hide);
    row.addEventListener("blur", hide);
  });
}

// Every wrong winner call, then the largest margin errors (>= minErr pts) among correct calls.
function renderNotableMisses(listId, races, { extra = 3, minErr = 3 } = {}){
  const list = document.getElementById(listId);
  if (!list) return;
  const withErr = races.map(r => {
    const p = signedMargin(r.predicted, r.predictedMargin), a = signedMargin(r.actual, r.actualMargin);
    return { ...r, p, a, err: Math.abs(p - a) };
  });
  const wrong = withErr.filter(r => r.predicted !== r.actual).sort((x,y) => y.err - x.err);
  const largest = withErr.filter(r => r.predicted === r.actual && r.err >= minErr).sort((x,y) => y.err - x.err).slice(0, extra);
  list.innerHTML = [...wrong, ...largest].map(r => {
    const under = r.p > r.a ? "Republicans" : "Democrats";
    return `
      <li>
        <span class="miss-race">${r.state}</span>
        <span>
          <span class="miss-tag ${r.predicted !== r.actual ? "wrong" : "error"}">${r.predicted !== r.actual ? "Wrong winner" : "Margin miss"}</span>
          Predicted <strong>${formatProjectedMargin(r.p)}</strong>, actual <strong>${formatProjectedMargin(r.a)}</strong> — off by ${r.err.toFixed(1)} pts, underestimating ${under}.
        </span>
      </li>`;
  }).join("");
}

// ---------- Misses list rendering ----------
function renderMisses(listId, misses){
  const list = document.getElementById(listId);
  if (!list) return;
  if (!misses || misses.length === 0){
    list.innerHTML = '<li class="miss-empty">No misses logged yet for this cycle — or the data file hasn\'t been filled in. Add every wrong call here, plainly, once results are final.</li>';
    return;
  }
  list.innerHTML = misses.map(m => `
    <li>
      <span class="miss-race">${m.race}</span>
      <span>Called <strong>${m.called}</strong>, actual <strong>${m.actual}</strong> — ${m.note || ""}</span>
    </li>
  `).join("");
}

// ---------- Nav active state ----------
function markActiveNav(){
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav.primary a").forEach(a => {
    const href = a.getAttribute("href");
    if (href === path || (path === "senate-race.html" && href === "forecast.html")) a.classList.add("active");
  });
}

// ---------- Footer meta ----------
function renderMeta(){
  const el = document.getElementById("last-updated");
  if (el) el.textContent = SITE_META.lastUpdated;
  const nameEls = document.querySelectorAll(".forecaster-name");
  nameEls.forEach(el => el.textContent = SITE_META.forecasterName);
}

document.addEventListener("DOMContentLoaded", () => {
  markActiveNav();
  renderMeta();
});
