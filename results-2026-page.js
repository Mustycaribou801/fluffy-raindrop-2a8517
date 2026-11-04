/* ==========================================================
   2026 MIDTERM REVIEW — page behaviour (2026-results.html)
   Every number is derived from RESULTS_2026 in results-2026.js.
   Nothing here needs editing when results are added.
   Also exposes window.scoreResults2026() for the Track Record
   featured card.
   ========================================================== */
(function(){
  "use strict";
  if (typeof RESULTS_2026 === "undefined") return;

  const LABELS = { SD:"Safe D", LD:"Likely D", TD:"Lean D", TU:"Toss-up", TR:"Lean R", LR:"Likely R", SR:"Safe R" };
  const TIERS = [
    { key:"Safe", codes:["SD","SR"] },
    { key:"Likely", codes:["LD","LR"] },
    { key:"Lean", codes:["TD","TR"] },
    { key:"Toss-up", codes:["TU"] },
  ];
  const PARTY = { D:"Democratic", R:"Republican", I:"Independent" };
  const STATUS = { pending:"Pending", uncalled:"Uncalled", runoff:"Runoff", called:"Called", certified:"Certified" };
  const DECIDED = new Set(["called", "certified"]);
  const ELECTION_DAY = "Tuesday, November 3, 2026";

  // Holdover seats come from the published forecast so the two pages always agree.
  const HOLD_D = typeof SENATE !== "undefined" ? SENATE.currentHoldoverD : null;
  const HOLD_R = typeof SENATE !== "undefined" ? SENATE.currentHoldoverR : null;

  // ---------- helpers ----------
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const isNum = v => typeof v === "number" && Number.isFinite(v);
  const fmtMargin = m => !isNum(m) ? null : Math.abs(m) < 0.05 ? "Even" : `${m > 0 ? "D" : "R"}+${Math.abs(m).toFixed(1)}`;
  const fmtLead = (party, pts) => !isNum(pts) ? null : pts < 0.05 ? "Even" : `${party}+${pts.toFixed(1)}`;
  const fmtPct = v => isNum(v) ? `${v.toFixed(1)}%` : null;
  const pct = (a, b) => b ? `${((a / b) * 100).toFixed(1)}%` : "—";
  const avg = xs => xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
  const median = xs => {
    if (!xs.length) return null;
    const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const tierOf = code => (TIERS.find(t => t.codes.includes(code)) || {}).key || "Unrated";
  const holderParty = h => (h || "").replace("OPEN-", "");
  const bestOf = (cands, party) => {
    const xs = cands.filter(c => c.party === party);
    return xs.length ? xs.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
  };

  // Normalise one race into everything the page needs.
  function analyse(race, chamber){
    const p = race.prediction || {};
    const r = race.result || {};
    const status = STATUS[r.status] ? r.status : "pending";
    const predictedParty =
      /D$/.test(p.rating) ? "D" :
      /R$/.test(p.rating) ? "R" :
      isNum(p.margin) && p.margin !== 0 ? (p.margin > 0 ? "D" : "R") : null;

    // Vote shares: margin = first place minus second place, as reported.
    const cands = (Array.isArray(r.candidates) ? r.candidates : []).filter(c => isNum(c.pct)).sort((a, b) => b.pct - a.pct);
    const hasVotes = status !== "pending" && cands.length >= 2;
    const lead = hasVotes ? cands[0] : null;
    const leadPts = hasVotes ? cands[0].pct - cands[1].pct : null;
    // Signed for comparison with the forecast: Republican lead negative, any other lead positive.
    const signedMargin = hasVotes ? (lead.party === "R" ? -leadPts : leadPts) : null;
    const dem = hasVotes ? bestOf(cands, "D") : null;
    const rep = hasVotes ? bestOf(cands, "R") : null;

    // A winner exists only when a desk has declared one. Never inferred from the lead.
    const decided = DECIDED.has(status) && !!r.winner;
    const actualParty = decided ? r.winner : null;
    if (decided && lead && lead.party !== r.winner && typeof console !== "undefined"){
      console.warn(`[2026 results] ${race.state} ${chamber}: declared winner (${r.winner}) is not the vote leader (${lead.party}). Check the data.`);
    }
    const actualMargin = decided ? signedMargin : null;
    const error = isNum(p.margin) && isNum(actualMargin) ? Math.abs(p.margin - actualMargin) : null;
    const correct = decided && predictedParty ? predictedParty === actualParty : null;

    return {
      ...race, chamber, status, predictedParty, actualParty, actualMargin, error, correct, decided,
      hasVotes, lead, leadPts, signedMargin, dem, rep, cands,
      rating: p.rating, predictedMargin: isNum(p.margin) ? p.margin : null, tier: tierOf(p.rating),
      source: r.source || "", sourceUrl: r.sourceUrl || "", asOf: r.asOf || "", calledBy: r.calledBy || "",
      expectedVote: isNum(r.expectedVote) ? r.expectedVote : null, note: r.note || "",
      holder: holderParty(race.holder),
    };
  }

  const SEN = RESULTS_2026.senate.map(r => analyse(r, "Senate"));
  const GOV = RESULTS_2026.governor.map(r => analyse(r, "Governor"));

  // A race counts towards accuracy only once a winner has been called or certified.
  const counts = r => r.decided && r.correct !== null;

  // Text for the "actual margin" of any race, with its status made explicit.
  function marginText(r){
    if (!r.hasVotes) return null;
    const m = fmtLead(r.lead.party, r.leadPts);
    if (r.decided) return m;
    if (r.status === "runoff") return `${m} (first round)`;
    return `${m} (current)`;
  }

  function stats(races){
    const counted = races.filter(counts);
    const correct = counted.filter(r => r.correct);
    const errors = counted.filter(r => r.error !== null);
    const errVals = errors.map(r => r.error);
    const by = s => races.filter(r => r.status === s).length;
    const largest = [...errors].sort((a, b) => b.error - a.error)[0] || null;
    const closest = [...errors].sort((a, b) => a.error - b.error)[0] || null;
    return {
      total: races.length, counted, correct, wrong: counted.filter(r => !r.correct),
      pending: by("pending"), uncalled: by("uncalled"), runoff: by("runoff"), called: by("called"), certified: by("certified"),
      undecided: races.length - counted.length,
      avgErr: avg(errVals), medErr: median(errVals), errCount: errVals.length, largest, closest,
      predD: races.filter(r => r.predictedParty === "D").length,
      predR: races.filter(r => r.predictedParty === "R").length,
      predFlips: races.filter(r => r.predictedParty && r.holder && r.predictedParty !== r.holder).length,
      actualD: counted.filter(r => r.actualParty === "D").length,
      actualR: counted.filter(r => r.actualParty === "R").length,
      actualI: counted.filter(r => r.actualParty === "I").length,
      actualFlips: counted.filter(r => r.holder && r.actualParty !== r.holder).length,
    };
  }

  const card = (num, label, extra = "") => `<div class="stat-card${extra}"><span class="stat-number">${num}</span><span class="stat-label">${label}</span></div>`;
  const partyTag = p => p ? `<span class="r26-party ${p}">${p}</span>` : `<span class="r26-muted">—</span>`;
  const statusTag = s => `<span class="r26-status ${s}">${STATUS[s]}</span>`;
  const notDecidedLabel = r => r.status === "runoff" ? "Runoff" : r.status === "uncalled" ? "Uncalled" : "Pending";

  // ---------- (1) overview ----------
  function renderOverview(){
    const s = stats(SEN), g = stats(GOV);
    const all = [...SEN, ...GOV];
    const decided = all.filter(r => r.decided).length;
    const withVotes = all.filter(r => r.status !== "pending").length;
    document.getElementById("r26-stamp").textContent =
      withVotes === 0 ? "Results pending" : decided === all.length ? "All races called" : `${decided}/${all.length} called`;

    document.getElementById("r26-status-strip").innerHTML = ["certified", "called", "uncalled", "runoff", "pending"].map(k => {
      const n = all.filter(r => r.status === k).length;
      return `<span class="r26-strip-item">${statusTag(k)} <strong>${n}</strong> race${n === 1 ? "" : "s"}</span>`;
    }).join("");

    const senPredD = HOLD_D !== null ? HOLD_D + s.predD : null;
    const senPredR = HOLD_R !== null ? HOLD_R + s.predR : null;
    const undecidedList = all.filter(r => !r.decided && r.status !== "pending")
      .map(r => `${esc(r.state)} ${r.chamber === "Senate" ? "Senate" : "governor"} (${STATUS[r.status].toLowerCase()})`);

    document.getElementById("r26-overview-copy").innerHTML = `
      <p>The midterms were held on ${ELECTION_DAY}: <strong>${s.total} Senate races</strong>, including special elections, and <strong>${g.total} governor races</strong>. Going into Election Day, the final forecast had Democrats winning <strong>${s.predD}</strong> of the Senate contests and Republicans <strong>${s.predR}</strong>${senPredD !== null ? `. That would make the chamber <strong>${senPredD}–${senPredR}</strong> once the seats not up this cycle are counted` : ""}. It projected <strong>${s.predFlips}</strong> Senate seat${s.predFlips === 1 ? "" : "s"} changing party.</p>
      <p>For governor, the forecast had Democrats winning <strong>${g.predD}</strong> races and Republicans <strong>${g.predR}</strong>, with <strong>${g.predFlips}</strong> projected flip${g.predFlips === 1 ? "" : "s"}.</p>
      <p>${withVotes === 0
        ? "No results have been entered yet. Every race is marked pending until a verified result is added, so the accuracy figures below are blank on purpose."
        : `<strong>${decided}</strong> of ${all.length} races have a declared winner and count towards the accuracy figures.${undecidedList.length ? ` Not yet decided: ${undecidedList.join(", ")}. Those races show their current margin and aren't scored.` : ""}`}</p>`;

    const senSoFar = HOLD_D !== null ? `${HOLD_D + s.actualD}–${HOLD_R + s.actualR}${s.actualI ? `–${s.actualI} I` : ""}` : `${s.actualD}–${s.actualR}`;
    document.getElementById("r26-overview-kpis").innerHTML =
      card(senPredD !== null ? `${senPredD}–${senPredR}` : `${s.predD}–${s.predR}`, senPredD !== null ? "Forecast Senate (D–R), incl. holdovers" : "Forecast Senate races won (D–R)") +
      card(s.counted.length ? senSoFar : "Pending", s.counted.length === s.total ? "Actual Senate (D–R), incl. holdovers" : `Actual Senate so far (D–R), incl. holdovers · ${s.undecided} undecided`) +
      card(`${g.predD}–${g.predR}`, "Forecast governor races won (D–R)") +
      card(g.counted.length ? `${g.actualD}–${g.actualR}${g.actualI ? `–${g.actualI} I` : ""}` : "Pending", g.counted.length === g.total ? "Actual governor races won (D–R)" : `Actual governor races won so far (D–R) · ${g.undecided} undecided`);

    document.getElementById("r26-count-note").textContent = withVotes
      ? `Results last checked ${RESULTS_2026.resultsLastChecked || "—"}. Accuracy counts called and certified races only. Uncalled and runoff races show their current margin but aren't scored.`
      : "";
  }

  // ---------- (2) KPI cards ----------
  function kpis(containerId, races, { margins }){
    const s = stats(races);
    const n = s.counted.length;
    const notCounted = [s.uncalled && `${s.uncalled} uncalled`, s.runoff && `${s.runoff} runoff`, s.pending && `${s.pending} pending`].filter(Boolean).join(" · ");
    let html =
      card(n ? `${s.correct.length}/${n}` : "Pending", n ? `Winner accuracy · ${pct(s.correct.length, n)}` : "Winner accuracy: no called results yet") +
      card(`${n}/${s.total}`, `Races called${notCounted ? ` · ${notCounted}` : ""}`) +
      card(n ? String(s.wrong.length) : "—", s.wrong.length ? `Wrong winner calls: ${s.wrong.map(r => r.abbr).join(", ")}` : "Wrong winner calls");
    if (margins){
      html +=
        card(s.avgErr !== null ? s.avgErr.toFixed(1) : "—", s.avgErr !== null ? `Average absolute margin error (pts, ${s.errCount} races)` : "Average margin error: awaiting called results") +
        card(s.medErr !== null ? s.medErr.toFixed(1) : "—", "Median absolute margin error (pts)") +
        card(s.largest ? s.largest.abbr : "—", s.largest ? `Largest miss: ${s.largest.error.toFixed(1)} pts` : "Largest margin miss") +
        card(s.closest ? s.closest.abbr : "—", s.closest ? `Closest call: ${s.closest.error.toFixed(1)} pts` : "Closest margin call");
    }
    html += card(n ? `${s.actualFlips}` : "—", `Called seats that changed party (forecast: ${s.predFlips})`);
    document.getElementById(containerId).innerHTML = html;
  }

  // ---------- Wrong calls ----------
  function renderWrongCalls(){
    const el = document.getElementById("r26-wrong-calls");
    if (!el) return;
    const wrong = [...SEN, ...GOV].filter(r => r.correct === false)
      .sort((a, b) => a.chamber.localeCompare(b.chamber) || a.state.localeCompare(b.state));
    el.innerHTML = wrong.length ? wrong.map(r => `
      <li>
        <strong>${esc(r.state)} ${r.chamber === "Senate" ? "Senate" : "governor"}</strong>
        <span>Forecast <span class="rating-chip ${r.rating}">${LABELS[r.rating]}</span>${r.predictedMargin !== null ? ` ${fmtMargin(r.predictedMargin)}` : ""}. ${PARTY[r.actualParty] || esc(r.actualParty)} win, ${marginText(r)}${r.error !== null ? ` (margin miss of ${r.error.toFixed(1)} pts)` : ""}.</span>
      </li>`).join("")
      : `<li class="r26-muted">No incorrect winner calls among the races called so far.</li>`;
  }

  // ---------- (3) maps ----------
  const maps = {
    senate: { races: SEN, mode: "predicted", selected: null, margins: true },
    governor: { races: GOV, mode: "predicted", selected: null, margins: false },
  };

  function tileClass(r, mode){
    const cls = ["accuracy-state", "r26-tile"];
    if (mode === "predicted") cls.push(`tone-${r.rating}`);
    else if (!r.decided) cls.push(r.hasVotes ? "is-uncalled" : "is-pending");
    else if (mode === "actual") cls.push(`act-${r.actualParty}`);
    else cls.push(r.correct === null ? "is-pending" : r.correct ? "is-correct" : "is-incorrect");
    return cls.join(" ");
  }

  function tileLabel(r, mode){
    const base = `${r.state} ${r.chamber}`;
    if (mode === "predicted") return `${base}: predicted ${LABELS[r.rating]}${r.predictedMargin !== null ? `, ${fmtMargin(r.predictedMargin)}` : ""}`;
    if (!r.decided) return r.hasVotes ? `${base}: ${STATUS[r.status].toLowerCase()}, current margin ${fmtLead(r.lead.party, r.leadPts)}` : `${base}: result pending`;
    const st = STATUS[r.status].toLowerCase();
    if (mode === "actual") return `${base}: ${PARTY[r.actualParty] || r.actualParty} win, ${marginText(r)} (${st})`;
    return `${base}: winner ${r.correct ? "predicted correctly" : r.correct === false ? "predicted incorrectly" : "not scored"} (${st})`;
  }

  function legend(key){
    const m = maps[key];
    const items = m.mode === "predicted"
      ? [["tone-SD","Safe D"],["tone-LD","Likely D"],["tone-TD","Lean D"],["tone-TU","Toss-up"],["tone-TR","Lean R"],["tone-LR","Likely R"],["tone-SR","Safe R"]]
      : m.mode === "actual"
        ? [["act-D","Democratic win"],["act-R","Republican win"],["act-I","Independent win"],["is-uncalled","Uncalled / runoff"],["is-pending","Pending"]]
        : [["is-correct","Winner correct"],["is-incorrect","Winner incorrect"],["is-uncalled","Uncalled / runoff"],["is-pending","Pending"]];
    document.getElementById(`r26-${key}-legend`).innerHTML = items.map(([c, l]) => `<span><i class="r26-swatch ${c}"></i> ${l}</span>`).join("");
  }

  function drawMap(key){
    const m = maps[key];
    const el = document.getElementById(`r26-${key}-map`);
    const byAbbr = Object.fromEntries(m.races.map(r => [r.abbr, r]));
    el.innerHTML = Object.entries(RESULTS_TILE_GRID).map(([abbr, [x, y]]) => {
      const r = byAbbr[abbr];
      if (!r) return `<span class="accuracy-state r26-tile no-race" style="--x:${x}; --y:${y};" aria-hidden="true"><span>${abbr}</span></span>`;
      const active = m.selected === abbr;
      return `<button type="button" class="${tileClass(r, m.mode)}${active ? " active" : ""}" style="--x:${x}; --y:${y};" data-abbr="${abbr}" aria-pressed="${active}" aria-label="${esc(tileLabel(r, m.mode))}"><span>${abbr}</span></button>`;
    }).join("");
    legend(key);
  }

  function panel(key){
    const m = maps[key];
    const r = m.races.find(x => x.abbr === m.selected);
    const el = document.getElementById(`r26-${key}-panel`);
    if (!r){
      el.innerHTML = `<p class="section-label">Selected ${key === "senate" ? "Senate" : "governor"} race</p><h3>Choose a state</h3><p>Select a highlighted state on the map. You can use Tab and Enter on a keyboard.</p>`;
      return;
    }
    const verdict = r.correct === null ? notDecidedLabel(r) : r.correct ? "Correct" : "Incorrect";
    const candRows = r.cands.map(c => `<dt>${esc(c.name)} (${esc(c.party)})</dt><dd>${fmtPct(c.pct)}</dd>`).join("");
    el.innerHTML = `
      <p class="section-label">Selected ${r.chamber === "Senate" ? "Senate" : "governor"} race</p>
      <h3>${esc(r.state)}</h3>
      <dl class="panel-metrics">
        <dt>Final rating</dt><dd><span class="rating-chip ${r.rating}">${LABELS[r.rating]}</span></dd>
        <dt>Predicted winner</dt><dd>${r.predictedParty ? PARTY[r.predictedParty] : "Not scored"}</dd>
        ${m.margins ? `<dt>Predicted margin</dt><dd>${fmtMargin(r.predictedMargin) || "—"}</dd>` : ""}
        <dt>Actual winner</dt><dd>${r.decided ? (PARTY[r.actualParty] || esc(r.actualParty)) : notDecidedLabel(r)}</dd>
        <dt>${r.decided ? "Actual margin" : "Current margin"}</dt><dd>${marginText(r) || "Pending"}</dd>
        ${m.margins ? `<dt>Margin error</dt><dd>${r.error !== null ? `${r.error.toFixed(1)} pts` : "—"}</dd>` : ""}
        <dt>Winner call</dt><dd>${verdict}</dd>
        <dt>Result status</dt><dd>${statusTag(r.status)}</dd>
        ${r.incumbentName ? `<dt>Incumbent</dt><dd>${esc(r.incumbentName)}</dd>` : ""}
      </dl>
      ${candRows ? `<dl class="panel-metrics r26-cands">${candRows}${r.expectedVote !== null ? `<dt>Expected vote counted</dt><dd>${r.expectedVote}%</dd>` : ""}</dl>` : ""}
      ${r.note ? `<p class="hero-footnote">${esc(r.note)}</p>` : ""}
      <p class="hero-footnote">${r.status !== "pending"
        ? `${r.decided && r.calledBy ? `Called by ${esc(r.calledBy)}. ` : r.status === "uncalled" ? "<strong>Not yet called.</strong> " : r.status === "runoff" ? "<strong>Goes to a runoff; no winner yet.</strong> " : ""}Source: ${r.sourceUrl ? `<a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">${esc(r.source || r.sourceUrl)}</a>` : esc(r.source) || "not recorded"}${r.asOf ? ` · as of ${esc(r.asOf)}` : ""}`
        : "No verified result has been entered for this race yet."}</p>`;
  }

  function initMap(key){
    const el = document.getElementById(`r26-${key}-map`);
    el.addEventListener("click", e => {
      const b = e.target.closest("button[data-abbr]");
      if (!b) return;
      maps[key].selected = b.dataset.abbr;
      drawMap(key);
      panel(key);
      const again = el.querySelector(`button[data-abbr="${b.dataset.abbr}"]`);
      if (again) again.focus();
    });
    document.querySelector(`.r26-mode-tabs[data-map="${key}"]`).addEventListener("click", e => {
      const b = e.target.closest("button[data-mode]");
      if (!b) return;
      maps[key].mode = b.dataset.mode;
      b.parentElement.querySelectorAll("button").forEach(x => {
        const on = x === b;
        x.classList.toggle("active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      drawMap(key);
    });
    drawMap(key);
    panel(key);
  }

  // ---------- (4) rating tiers ----------
  let tierSet = "all";
  function renderTiers(){
    const races = tierSet === "senate" ? SEN : tierSet === "governor" ? GOV : [...SEN, ...GOV];
    const rows = TIERS.map(t => {
      const rs = races.filter(r => t.codes.includes(r.rating));
      const counted = rs.filter(counts);
      const correct = counted.filter(r => r.correct).length;
      const errs = counted.filter(r => r.error !== null).map(r => r.error);
      return { tier: t.key, total: rs.length, counted: counted.length, correct, wrong: counted.length - correct, pending: rs.length - counted.length, avgErr: avg(errs) };
    }).filter(r => r.total > 0);
    const max = Math.max(...rows.map(r => r.total), 1);

    document.getElementById("r26-tier-chart").innerHTML = rows.map(r => {
      const w = n => `${(n / max) * 100}%`;
      const label = r.counted ? `${r.correct}/${r.counted} correct · ${pct(r.correct, r.counted)}` : "None called yet";
      return `
        <div class="r26-tier-row" role="img" aria-label="${r.tier}: ${r.total} races, ${r.correct} correct, ${r.wrong} incorrect, ${r.pending} not yet called">
          <span class="r26-tier-name">${r.tier}<small>${r.total} race${r.total === 1 ? "" : "s"}</small></span>
          <span class="r26-tier-track">
            <span class="r26-bar correct" style="width:${w(r.correct)}"></span><span class="r26-bar incorrect" style="width:${w(r.wrong)}"></span><span class="r26-bar pending" style="width:${w(r.pending)}"></span>
          </span>
          <span class="r26-tier-value">${label}</span>
        </div>`;
    }).join("");

    document.getElementById("r26-tier-caption").textContent =
      `Winner accuracy by final rating tier: ${tierSet === "senate" ? "Senate" : tierSet === "governor" ? "Governor" : "Senate and governor combined"}`;
    document.getElementById("r26-tier-table").innerHTML = rows.map(r => `
      <tr>
        <th scope="row">${r.tier}</th>
        <td>${r.total}</td><td>${r.counted}</td><td>${r.correct}</td><td>${r.wrong}</td><td>${r.pending}</td>
        <td>${r.counted ? pct(r.correct, r.counted) : "Pending"}</td>
        <td>${r.avgErr !== null ? `${r.avgErr.toFixed(1)} pts` : tierSet === "governor" ? "n/a (ratings only)" : "—"}</td>
      </tr>`).join("");
  }

  function initTierTabs(){
    document.getElementById("r26-tier-tabs").addEventListener("click", e => {
      const b = e.target.closest("button[data-set]");
      if (!b) return;
      tierSet = b.dataset.set;
      b.parentElement.querySelectorAll("button").forEach(x => {
        const on = x === b;
        x.classList.toggle("active", on);
        x.setAttribute("aria-pressed", String(on));
      });
      renderTiers();
    });
  }

  // ---------- (5) state tables ----------
  function renderTable(key){
    const races = key === "senate" ? SEN : GOV;
    const q = document.getElementById(`r26-${key}-search`).value.trim().toLowerCase();
    const f = document.getElementById(`r26-${key}-filter`).value;
    const shown = races.filter(r => {
      const text = `${r.state} ${r.abbr} ${r.incumbentName || ""} ${r.cands.map(c => c.name).join(" ")}`.toLowerCase();
      if (q && !text.includes(q)) return false;
      if (f === "pending") return r.status === "pending";
      if (f === "uncalled") return r.status === "uncalled" || r.status === "runoff";
      if (f === "called") return r.decided;
      if (f === "incorrect") return r.correct === false;
      return true;
    }).sort((a, b) => a.state.localeCompare(b.state));

    const muted = t => `<span class="r26-muted">${t}</span>`;
    document.getElementById(`r26-${key}-table`).innerHTML = shown.length ? shown.map(r => {
      const rowCls = r.correct === true ? "correct-row" : r.correct === false ? "incorrect-row" : "pending-row";
      const predicted = key === "senate"
        ? `${fmtMargin(r.predictedMargin) || "—"} <span class="rating-chip ${r.rating}">${LABELS[r.rating]}</span>`
        : `<span class="rating-chip ${r.rating}">${LABELS[r.rating]}</span>`;
      const winner = r.correct === null ? muted(notDecidedLabel(r)) : r.correct ? `<span class="r26-ok">Correct</span>` : `<span class="r26-miss">Incorrect</span>`;
      const share = c => c ? fmtPct(c.pct) : muted("—");
      return `
        <tr class="${rowCls}${r.decided ? "" : r.hasVotes ? " uncalled-row" : ""}">
          <th scope="row">${esc(r.state)}</th>
          <td>${partyTag(r.predictedParty)}</td>
          <td>${predicted}</td>
          <td>${r.decided ? partyTag(r.actualParty) : muted(notDecidedLabel(r))}</td>
          <td>${r.hasVotes ? share(r.dem) : muted("—")}</td>
          <td>${r.hasVotes ? share(r.rep) : muted("—")}</td>
          <td>${r.hasVotes ? (r.decided ? marginText(r) : `${fmtLead(r.lead.party, r.leadPts)} <span class="r26-status ${r.status}">${STATUS[r.status]}</span>`) : muted("Pending")}</td>
          <td>${r.error !== null ? `${r.error.toFixed(1)} pts` : muted(key === "governor" ? "n/a" : "—")}</td>
          <td>${winner}</td>
          <td>${statusTag(r.status)}${r.sourceUrl ? ` <a class="r26-src" href="${esc(r.sourceUrl)}" target="_blank" rel="noopener" aria-label="Source for ${esc(r.state)}">Source</a>` : ""}</td>
        </tr>`;
    }).join("") : `<tr><td colspan="10" class="r26-empty">No races match this search.</td></tr>`;
    document.getElementById(`r26-${key}-count`).textContent = `${shown.length} of ${races.length} races`;
  }

  function initTable(key){
    document.getElementById(`r26-${key}-search`).addEventListener("input", () => renderTable(key));
    document.getElementById(`r26-${key}-filter`).addEventListener("change", () => renderTable(key));
    renderTable(key);
  }

  // ---------- (6) reflection + (7) methodology ----------
  function renderReflection(){
    const paras = (RESULTS_2026.reflection || []).filter(p => String(p).trim());
    document.getElementById("r26-reflection").innerHTML = paras.length
      ? paras.map(p => `<p>${esc(p)}</p>`).join("")
      : `<p>My reflection will be posted here once enough results have been verified to judge the forecast fairly.</p>`;
    document.getElementById("r26-snapshot").textContent = `final update ${RESULTS_2026.forecastSnapshot}`;
    document.getElementById("r26-checked").textContent = RESULTS_2026.resultsLastChecked
      ? `Results last checked ${RESULTS_2026.resultsLastChecked}.`
      : "No results have been entered yet.";
  }

  // ---------- shared summary (used by the Track Record featured card) ----------
  // Called or certified races only. Uncalled, runoff and pending races are never counted.
  window.scoreResults2026 = function(){
    const score = races => {
      const counted = races.filter(counts);
      return { total: races.length, counted: counted.length, correct: counted.filter(r => r.correct).length };
    };
    return { senate: score(SEN), governor: score(GOV), overall: score([...SEN, ...GOV]) };
  };

  // ---------- wire-up ----------
  document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("r26-stamp")) return; // not on 2026-results.html
    renderOverview();
    kpis("r26-senate-kpis", SEN, { margins: true });
    kpis("r26-governor-kpis", GOV, { margins: false });
    renderWrongCalls();
    renderTiers();
    initMap("senate");
    initMap("governor");
    initTierTabs();
    initTable("senate");
    initTable("governor");
    renderReflection();
  });
})();
