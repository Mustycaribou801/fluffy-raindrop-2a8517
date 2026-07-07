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

// ---------- Race board rendering ----------
function renderRaceBoard(tbodyId, races, keyLabel){
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const order = ["SD","LD","TD","TU","TR","LR","SR"];
  const sorted = [...races].sort((a,b) => order.indexOf(a.rating) - order.indexOf(b.rating));
  tbody.innerHTML = sorted.map(r => `
    <tr>
      <td>${r.abbr ? `<a href="senate-race.html?state=${encodeURIComponent(r.abbr)}">${r.state}</a>` : (r.district || r.state)}</td>
      <td>${(r.incumbent || "").replace("OPEN-", "Open (")}${r.incumbent && r.incumbent.startsWith("OPEN") ? ")" : ""}</td>
      <td><span class="rating-chip ${r.rating}">${RATING_LABELS[r.rating]}</span></td>
      <td>${r.note || ""}</td>
    </tr>
  `).join("");
}function renderGovernorMap(containerId, races){
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
    const [x, y] = positions[race.abbr] || [50,50];

    return `
      <a class="senate-state ${ratingTone(race.rating)}"
         style="--x:${x}; --y:${y};"
         href="governor-race.html?state=${encodeURIComponent(race.abbr)}"
         aria-label="${race.state} Governor race, ${RATING_LABELS[race.rating]}">
        <span>${race.abbr}</span>
      </a>
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
