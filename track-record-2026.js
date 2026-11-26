/* ==========================================================
   2026 TRACK RECORD — page behaviour (track-record-2026.html)

   Every figure is calculated from RESULTS_2026 (results-2026.js):
     prediction = frozen copy of the final forecast in data.js
     result     = latest called / certified result, with source

   This page reads the result objects directly.

   Layout and components are the 2024 Track Record's
   (track-record.html), and the Senate margin chart, notable
   misses and audit summary reuse the shared helpers in
   script.js: renderMarginChart, renderNotableMisses and
   renderAccuracySummary.
   ========================================================== */
(function(){
  "use strict";
  if (typeof RESULTS_2026 === "undefined") return;

  const COMPETITIVE = 6; // same definition as the 2024 page: actual margin under 6 points
  const LABELS = { SD:"Safe D", LD:"Likely D", TD:"Lean D", TU:"Toss-up", TR:"Lean R", LR:"Likely R", SR:"Safe R" };
  const PARTY = { D:"Democratic", R:"Republican", I:"Independent" };
  const DECIDED = new Set(["called", "certified"]);
  const GRID = typeof RESULTS_TILE_GRID !== "undefined" ? RESULTS_TILE_GRID : {};
  const NAMES = { AL:"Alabama", AK:"Alaska", AZ:"Arizona", AR:"Arkansas", CA:"California", CO:"Colorado", CT:"Connecticut", DE:"Delaware", FL:"Florida", GA:"Georgia", HI:"Hawaii", ID:"Idaho", IL:"Illinois", IN:"Indiana", IA:"Iowa", KS:"Kansas", KY:"Kentucky", LA:"Louisiana", ME:"Maine", MD:"Maryland", MA:"Massachusetts", MI:"Michigan", MN:"Minnesota", MS:"Mississippi", MO:"Missouri", MT:"Montana", NE:"Nebraska", NV:"Nevada", NH:"New Hampshire", NJ:"New Jersey", NM:"New Mexico", NY:"New York", NC:"North Carolina", ND:"North Dakota", OH:"Ohio", OK:"Oklahoma", OR:"Oregon", PA:"Pennsylvania", RI:"Rhode Island", SC:"South Carolina", SD:"South Dakota", TN:"Tennessee", TX:"Texas", UT:"Utah", VT:"Vermont", VA:"Virginia", WA:"Washington", WV:"West Virginia", WI:"Wisconsin", WY:"Wyoming" };
  const ABBR = Object.fromEntries(Object.entries(NAMES).map(([a, n]) => [n, a]));

  // ---------- helpers ----------
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const isNum = v => typeof v === "number" && Number.isFinite(v);
  const avg = xs => xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
  const median = xs => {
    if (!xs.length) return null;
    const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const fmtMargin = m => !isNum(m) ? "—" : Math.abs(m) < 0.05 ? "Even" : `${m > 0 ? "D" : "R"}+${Math.abs(m).toFixed(1)}`;
  // Leader's lead in points, labelled by the leader's party (an independent lead shows as I+).
  const fmtLead = r => !r.lead ? "—" : `${r.lead.party}+${r.leadPts.toFixed(1)}`;
  const fmtPct = (a, b) => b ? `${((a / b) * 100).toFixed(1)}%` : "Not available";
  const NA = "Not available";
  const card = (num, label, cls = "") => `<div class="stat-card${cls ? " " + cls : ""}"><span class="stat-number">${num}</span><span class="stat-label">${label}</span></div>`;

  // ---------- normalise one race ----------
  // The predicted party comes from the rating
  // (Toss-ups use the sign of the margin), and the margin is first place minus
  // second place, signed negative for a Republican lead and positive otherwise.
  function analyse(race, office){
    const p = race.prediction || {};
    const r = race.result || {};
    const status = r.status || "pending";
    const predicted =
      /D$/.test(p.rating) ? "D" :
      /R$/.test(p.rating) ? "R" :
      isNum(p.margin) && p.margin !== 0 ? (p.margin > 0 ? "D" : "R") : null;
    const cands = (Array.isArray(r.candidates) ? r.candidates : []).filter(c => isNum(c.pct)).sort((a, b) => b.pct - a.pct);
    const hasVotes = status !== "pending" && cands.length >= 2;
    const lead = hasVotes ? cands[0] : null;
    const leadPts = hasVotes ? cands[0].pct - cands[1].pct : null;
    const signed = hasVotes ? (lead.party === "R" ? -leadPts : leadPts) : null;
    const decided = DECIDED.has(status) && !!r.winner;
    const actual = decided ? r.winner : null;
    const actualMargin = decided ? signed : null;
    const predictedMargin = isNum(p.margin) ? p.margin : null;
    const signedErr = isNum(predictedMargin) && isNum(actualMargin) ? predictedMargin - actualMargin : null;
    const winnerCand = decided ? cands.find(c => c.party === r.winner) || null : null;
    return {
      ...race, office, status, predicted, actual, decided, cands, lead, leadPts, actualMargin, predictedMargin,
      rating: p.rating, ratingLabel: LABELS[p.rating] || "Unrated",
      signedErr, error: isNum(signedErr) ? Math.abs(signedErr) : null,
      correct: decided && predicted ? predicted === actual : null,
      competitive: decided && isNum(actualMargin) && Math.abs(actualMargin) < COMPETITIVE,
      winnerCand, calledBy: r.calledBy || "", source: r.source || "", sourceUrl: r.sourceUrl || "",
      asOf: r.asOf || "", expectedVote: isNum(r.expectedVote) ? r.expectedVote : null, note: r.note || "",
    };
  }

  function stats(races){
    const evaluated = races.filter(r => r.correct !== null);
    const correct = evaluated.filter(r => r.correct);
    const withErr = races.filter(r => isNum(r.error));
    const comp = evaluated.filter(r => r.competitive);
    return {
      total: races.length, evaluated, correct, wrong: evaluated.filter(r => !r.correct),
      unresolved: races.filter(r => r.correct === null),
      withErr,
      mae: avg(withErr.map(r => r.error)),
      med: median(withErr.map(r => r.error)),
      bias: avg(withErr.map(r => r.signedErr)),
      comp, compCorrect: comp.filter(r => r.correct),
      compMae: avg(comp.filter(r => isNum(r.error)).map(r => r.error)),
      best: [...withErr].sort((a, b) => a.error - b.error)[0] || null,
      worst: [...withErr].sort((a, b) => b.error - a.error)[0] || null,
    };
  }

  const fmtBias = b => !isNum(b) ? NA : `${b > 0 ? "+" : b < 0 ? "−" : ""}${Math.abs(b).toFixed(1)}`;
  const biasWords = b => !isNum(b) ? "" : b > 0 ? "forecasts too Democratic" : b < 0 ? "forecasts too Republican" : "no lean";

  const SEN = RESULTS_2026.senate.map(r => analyse(r, "Senate"));
  const GOV = RESULTS_2026.governor.map(r => analyse(r, "Governor"));
  const OFFICES = {
    senate: { key: "senate", label: "Senate", races: SEN, hasMargins: true },
    governors: { key: "governors", label: "Governor", races: GOV, hasMargins: false },
  };

  // Shape expected by the shared 2024 chart helpers in script.js:
  // unsigned margins plus the party they belong to.
  const toArchiveRow = r => ({
    state: r.state, abbr: r.abbr,
    predicted: r.predicted, actual: r.actual,
    predictedMargin: Math.abs(r.predictedMargin), actualMargin: Math.abs(r.actualMargin),
  });

  // ---------- overall summary ----------
  function renderOverall(){
    const s = stats(SEN), g = stats(GOV);
    const all = [...SEN, ...GOV], a = stats(all);
    document.getElementById("tr26-overall").innerHTML = [
      card(`${s.correct.length}/${s.evaluated.length}`, "Senate predictions correct"),
      card(`${g.correct.length}/${g.evaluated.length}`, "Governor predictions correct"),
      card(fmtPct(a.correct.length, a.evaluated.length), `Combined winner accuracy: ${a.correct.length}/${a.evaluated.length}`),
      card(String(a.wrong.length), `Incorrect predictions (${s.wrong.length} Senate, ${g.wrong.length} governor)`),
      card(isNum(s.mae) ? s.mae.toFixed(1) : NA, isNum(s.mae)
        ? `Average margin error (pts), ${s.withErr.length} Senate races with margin forecasts`
        : "Average margin error"),
    ].join("");
    const unresolved = a.unresolved.length;
    document.getElementById("tr26-stamp").textContent = unresolved ? `${a.evaluated.length}/${all.length} decided` : `${a.correct.length}/${all.length} correct`;
    const certified = all.filter(r => r.status === "certified").length;
    document.getElementById("tr26-overall-note").textContent =
      `${a.evaluated.length} of ${all.length} races scored${unresolved ? `; ${unresolved} still without a declared winner and not counted` : ""}. ` +
      `${certified ? `${certified} certified, ${a.evaluated.length - certified} called by a decision desk` : "All scored results are decision-desk calls; none had been certified when the results were last checked"} (${RESULTS_2026.resultsLastChecked}). ` +
      "Governor forecasts had no numerical margins, so overall margin accuracy covers Senate races only.";
  }

  // ---------- maps ----------
  function forecastPick(o, abbr){
    const el = document.getElementById(`${o.key}-forecast-pick`);
    const r = o.races.find(x => x.abbr === abbr);
    if (!r){
      el.innerHTML = `<dt>${esc(NAMES[abbr])}</dt><dd>${o.key === "senate" ? "Not up in 2026 (holdover seats)" : "No race in 2026"}</dd>`;
      return;
    }
    el.innerHTML = `
      <dt>${esc(r.state)}: original rating</dt><dd>${r.ratingLabel}</dd>
      <dt>Predicted winner</dt><dd>${r.predicted ? PARTY[r.predicted] : "None"}</dd>
      <dt>Predicted margin</dt><dd>${isNum(r.predictedMargin) ? fmtMargin(r.predictedMargin) : "Rating only, no margin published"}</dd>`;
  }

  function tiles(o, mapId, classFor, onSelect){
    const map = document.getElementById(mapId);
    map.innerHTML = Object.entries(GRID).map(([abbr, [x, y]]) => {
      const r = o.races.find(rr => rr.abbr === abbr);
      const { cls, label } = classFor(r, abbr);
      return `<button type="button" class="accuracy-state ${cls}" style="--x:${x}; --y:${y};" data-state="${abbr}" aria-label="${esc(label)}"><span>${abbr}</span></button>`;
    }).join("");
    map.addEventListener("click", e => {
      const b = e.target.closest(".accuracy-state");
      if (!b) return;
      map.querySelectorAll(".accuracy-state").forEach(t => t.classList.toggle("active", t === b));
      onSelect(b.dataset.state);
    });
    return map;
  }

  function renderForecastMap(o){
    const map = tiles(o, `${o.key}-forecast-map`, (r, abbr) => r
      ? { cls: r.predicted === "D" ? "forecast-dem" : r.predicted === "R" ? "forecast-rep" : "tr26-none", label: `${r.state}, ${r.ratingLabel}, predicted ${PARTY[r.predicted] || "none"}` }
      : { cls: "tr26-no-race", label: `${NAMES[abbr]}, ${o.key === "senate" ? "no Senate election in 2026" : "no governor's race in 2026"}` },
      abbr => forecastPick(o, abbr));
    const first = defaultRace(o);
    map.querySelector(`[data-state="${first.abbr}"]`)?.classList.add("active");
    forecastPick(o, first.abbr);
  }

  function accuracyClass(r, abbr, o){
    if (!r) return { cls: "tr26-no-race", label: `${NAMES[abbr]}, no ${o.key === "senate" ? "Senate election" : "governor's race"} in 2026` };
    if (r.correct === null) return { cls: "tr26-unresolved", label: `${r.state}, no verified result` };
    return { cls: r.correct ? "correct" : "incorrect", label: `${r.state}, ${r.correct ? "correct" : "incorrect"} prediction` };
  }

  function explain(r){
    const fc = `The final forecast rated ${r.state} ${r.ratingLabel}${isNum(r.predictedMargin) ? ` with a projected margin of ${fmtMargin(r.predictedMargin)}` : ""}.`;
    if (r.correct === null) return `${fc} No winner had been declared when the results were last checked, so this race isn't scored.`;
    const who = r.winnerCand ? `${r.winnerCand.name} (${r.actual})` : PARTY[r.actual];
    const res = ` ${who} won by ${r.leadPts.toFixed(1)} points (${r.status === "certified" ? "certified result" : `called by ${r.calledBy || "a decision desk"}`}).`;
    if (!isNum(r.error)) return fc + res + (r.correct ? " The rating named the winning party." : " The rating named the losing party.");
    const dir = r.signedErr > 0 ? "Democratic" : "Republican";
    return fc + res + (r.error < 0.05 ? " The projected margin matched the result." : ` The projected margin was ${r.error.toFixed(1)} points more ${dir} than the result.`);
  }

  function renderPanel(o, abbr){
    const r = o.races.find(x => x.abbr === abbr);
    const head = document.getElementById(`${o.key}-panel-state`);
    const dl = document.getElementById(`${o.key}-panel-metrics`);
    const p = document.getElementById(`${o.key}-panel-explanation`);
    if (!r){
      head.textContent = NAMES[abbr];
      dl.innerHTML = "";
      p.textContent = o.key === "senate"
        ? `No Senate election in ${NAMES[abbr]} in 2026. Its seats are holdovers and are not counted as predictions.`
        : `No governor's race in ${NAMES[abbr]} in 2026.`;
      return;
    }
    head.textContent = `${r.state} ${o.key === "senate" ? "Senate" : "Governor"}`;
    const src = r.sourceUrl ? `<a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">Source</a>` : "No source";
    dl.innerHTML = `
      <dt>Original prediction</dt><dd>${!r.predicted ? "None" : isNum(r.predictedMargin) ? fmtMargin(r.predictedMargin) : `${PARTY[r.predicted]} win`}</dd>
      <dt>Original rating</dt><dd>${r.ratingLabel}</dd>
      <dt>Actual result</dt><dd>${r.decided ? fmtLead(r) : r.lead ? `${fmtLead(r)} (no winner declared)` : "Pending"}</dd>
      <dt>Margin error</dt><dd>${isNum(r.error) ? `${r.error.toFixed(1)} pts` : NA}</dd>
      <dt>Winner call</dt><dd>${r.correct === null ? "Not scored" : r.correct ? "Correct" : "Incorrect"}</dd>
      <dt>Result status</dt><dd>${r.status === "certified" ? "Certified" : r.status === "called" ? "Called" : "Unresolved"}</dd>
      <dt>Result source</dt><dd>${src}</dd>`;
    p.textContent = explain(r);
  }

  function defaultRace(o){
    const s = stats(o.races);
    return [...s.wrong].sort((a, b) => (b.error ?? 0) - (a.error ?? 0))[0] || o.races[0];
  }

  function renderAccuracyMap(o){
    const map = tiles(o, `${o.key}-accuracy-map`, (r, abbr) => accuracyClass(r, abbr, o), abbr => renderPanel(o, abbr));
    const first = defaultRace(o);
    map.querySelector(`[data-state="${first.abbr}"]`)?.classList.add("active");
    renderPanel(o, first.abbr);
  }

  // ---------- KPIs beside the forecast map ----------
  function renderKpis(o){
    const s = stats(o.races);
    const el = document.getElementById(`${o.key}-kpis`);
    const winnerCard = card(`${s.correct.length}/${s.evaluated.length}`, "Winner accuracy");
    const compCard = card(s.comp.length ? `${s.compCorrect.length}/${s.comp.length}` : NA, "Competitive race accuracy");
    if (o.key === "senate"){
      const hd = SENATE.currentHoldoverD, hr = SENATE.currentHoldoverR;
      const pd = hd + o.races.filter(r => r.predicted === "D").length;
      const pr = hr + o.races.filter(r => r.predicted === "R").length;
      const ad = hd + o.races.filter(r => r.actual === "D").length;
      const ar = hr + o.races.filter(r => r.actual === "R").length;
      const ai = o.races.filter(r => r.actual === "I").length;
      const open = s.unresolved.length;
      el.innerHTML = [
        card(`${pd}-${pr}`, `Predicted Senate balance (D-R). ${o.races.length} contested seats plus ${hd + hr} holdovers (${hd} D, ${hr} R) not up in 2026`),
        card(`${ad}-${ar}`, `Actual Senate balance (D-R)${ai ? `, plus ${ai} independent` : ""}${open ? `, ${open} undecided` : ""}`),
        winnerCard,
        card(isNum(s.mae) ? s.mae.toFixed(1) : NA, "Average margin error"),
        compCard,
      ].join("");
      document.getElementById("senate-stamp").textContent = `${s.correct.length}/${s.evaluated.length} correct`;
    } else {
      const pd = o.races.filter(r => r.predicted === "D").length, pr = o.races.filter(r => r.predicted === "R").length;
      const ad = o.races.filter(r => r.actual === "D").length, ar = o.races.filter(r => r.actual === "R").length;
      el.innerHTML = [
        card(`${pd}-${pr}`, `Predicted 2026 winners (D-R), ${o.races.length} races`),
        card(`${ad}-${ar}`, `Actual 2026 winners (D-R)${s.unresolved.length ? `, ${s.unresolved.length} undecided` : ""}`),
        winnerCard,
        card(NA, "Average margin error (ratings only)"),
        compCard,
      ].join("");
      document.getElementById("governors-stamp").textContent = `${s.correct.length}/${s.evaluated.length} correct`;
    }
  }

  // ---------- dashboard ----------
  function renderDashboard(o){
    const s = stats(o.races);
    const cards = [
      card(isNum(s.mae) ? s.mae.toFixed(1) : NA, "Average forecast margin error (pts)"),
      card(fmtBias(s.bias), isNum(s.bias) ? `Average partisan bias (${biasWords(s.bias)})` : "Average partisan bias"),
      card(s.comp.length ? fmtPct(s.compCorrect.length, s.comp.length) : NA, `Competitive-race accuracy: ${s.compCorrect.length}/${s.comp.length} decided by under ${COMPETITIVE} pts`),
      card(fmtPct(s.correct.length, s.evaluated.length), `Overall winner accuracy: ${s.correct.length}/${s.evaluated.length}`),
    ];
    if (o.hasMargins && s.withErr.length){
      cards.push(
        card(s.med.toFixed(1), "Median Margin Error"),
        card(isNum(s.compMae) ? s.compMae.toFixed(1) : NA, "Competitive Race Average Error"),
        card(s.best.abbr, `Closest prediction: ${s.best.error.toFixed(1)} pts`),
        card(s.worst.abbr, `Largest miss: ${s.worst.error.toFixed(1)} pts`),
      );
    }
    document.getElementById(`${o.key}-dashboard`).innerHTML = cards.join("");
    document.getElementById(`${o.key}-dashboard-note`).textContent = o.hasMargins
      ? `Margin error and bias use the ${s.withErr.length} decided races with a published margin forecast. Bias is predicted minus actual Democratic margin: positive means too Democratic, negative too Republican. Competitive means an actual margin under ${COMPETITIVE} points, the same definition as the 2024 Track Record.`
      : `Governor forecasts were published as ratings (Safe, Likely, Lean) with no projected margin, so margin error and bias can't be calculated and none is estimated. Competitive means an actual margin under ${COMPETITIVE} points, the same definition as the 2024 Track Record.`;
  }

  // ---------- margin audit ----------
  // Governor version of the shared chart: same markup and styles as
  // renderMarginChart in script.js, but with no forecast point, because
  // the governor forecasts published no margins.
  function renderActualOnlyChart(containerId, races){
    const el = document.getElementById(containerId);
    const rows = races.map(r => ({ ...r, a: r.actualMargin })).sort((x, y) => y.a - x.a);
    const extent = Math.max(5, ...rows.map(r => Math.abs(r.a)));
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
        const miss = r.correct === false;
        const summary = `${r.state}: rated ${r.ratingLabel}, actual ${fmtLead(r)}${miss ? ", wrong winner" : ""}`;
        return `
        <div class="mchart-row${miss ? " is-miss" : ""}" tabindex="0" role="img" aria-label="${esc(summary)}"
             data-state="${esc(r.state)}" data-rating="${r.ratingLabel}" data-a="${fmtLead(r)}" data-miss="${miss}">
          <span class="mchart-label">${r.abbr}${miss ? ' <span class="mchart-flag">Miss</span>' : ""}</span>
          <div class="mchart-track">
            ${ticks.map(t => `<span class="mchart-grid${t === 0 ? " zero" : ""}" style="left:${pos(t)}%"></span>`).join("")}
            <span class="mchart-dot actual ${r.a >= 0 ? "dem" : "rep"}" style="left:${pos(r.a)}%"></span>
          </div>
        </div>`;
      }).join("")}
      <div class="mchart-tooltip" role="presentation" hidden></div>`;
    const tip = el.querySelector(".mchart-tooltip");
    const show = row => {
      tip.innerHTML = "";
      const title = document.createElement("strong");
      title.textContent = row.dataset.state;
      tip.appendChild(title);
      [["rating (no margin forecast)", row.dataset.rating], ["actual", row.dataset.a]].forEach(([k, v]) => {
        const line = document.createElement("span");
        const val = document.createElement("b");
        val.textContent = v;
        line.append(val, ` ${k}`);
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

  function renderGovernorMisses(listId, races){
    const wrong = races.filter(r => r.correct === false).sort((a, b) => Math.abs(b.actualMargin) - Math.abs(a.actualMargin));
    document.getElementById(listId).innerHTML = wrong.length ? wrong.map(r => `
      <li>
        <span class="miss-race">${esc(r.state)}</span>
        <span>
          <span class="miss-tag wrong">Wrong winner</span>
          Rated <strong>${r.ratingLabel}</strong>; ${esc(r.winnerCand ? r.winnerCand.name : PARTY[r.actual])} (${r.actual}) won by <strong>${r.leadPts.toFixed(1)} pts</strong>. No margin was forecast, so there is no margin error.
        </span>
      </li>`).join("") : '<li class="miss-empty">No wrong winner calls in this set.</li>';
  }

  function renderAudit(o){
    const decided = o.races.filter(r => r.decided && isNum(r.actualMargin));
    const sets = {
      competitive: { races: decided.filter(r => r.competitive), note: `${o.label} races decided by under ${COMPETITIVE} points, the same competitive definition as the 2024 Track Record.` },
      all: { races: decided, note: `Every ${o.label.toLowerCase()} race with a declared winner (${decided.length} of ${o.races.length}).` },
    };
    const root = document.getElementById(`${o.key}-predicted-vs-actual`);
    const show = key => {
      const set = sets[key];
      root.querySelectorAll("[data-set]").forEach(b => {
        const on = b.dataset.set === key;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      document.getElementById(`${o.key}-audit-note`).textContent = set.note;
      if (o.hasMargins){
        const rows = set.races.filter(r => isNum(r.predictedMargin)).map(toArchiveRow);
        if (rows.length){
          renderAccuracySummary(`${o.key}-audit-summary`, rows);
          renderMarginChart(`${o.key}-margin-chart`, rows);
          renderNotableMisses(`${o.key}-misses`, rows);
        } else {
          document.getElementById(`${o.key}-audit-summary`).innerHTML = card(NA, "Not enough decided races with margin forecasts");
          document.getElementById(`${o.key}-margin-chart`).innerHTML = "";
          document.getElementById(`${o.key}-misses`).innerHTML = "";
        }
      } else {
        const s = stats(set.races);
        document.getElementById(`${o.key}-audit-summary`).innerHTML = [
          card(NA, "Average forecast error (no margin forecasts)"),
          card(NA, "Average lean of the forecast vs. result"),
          card(String(s.wrong.length), "Wrong winner calls in this set"),
          card(`${s.correct.length}/${s.evaluated.length}`, "Winners called correctly in this set"),
        ].join("");
        renderActualOnlyChart(`${o.key}-margin-chart`, set.races);
        renderGovernorMisses(`${o.key}-misses`, set.races);
      }
    };
    root.querySelectorAll("[data-set]").forEach(b => b.addEventListener("click", () => show(b.dataset.set)));
    show("all");
  }

  // ---------- race table ----------
  function renderTable(o){
    document.getElementById(`${o.key}-table`).innerHTML = [...o.races].sort((a, b) => a.state.localeCompare(b.state)).map(r => {
      const rowCls = r.correct === null ? "" : r.correct ? "correct-row" : "incorrect-row";
      const status = r.status === "certified" ? "Certified" : r.status === "called" ? `Called${r.calledBy ? ` (${esc(r.calledBy)})` : ""}` : "No winner declared";
      return `<tr class="${rowCls}">
        <td>${esc(r.state)}</td>
        <td>${r.ratingLabel}</td>
        <td>${r.predicted ? PARTY[r.predicted] : "None"}</td>
        <td>${isNum(r.predictedMargin) ? fmtMargin(r.predictedMargin) : "Rating only"}</td>
        <td>${r.decided ? esc(r.winnerCand ? `${r.winnerCand.name} (${r.actual})` : PARTY[r.actual]) : "Not declared"}</td>
        <td>${r.lead ? fmtLead(r) : "—"}</td>
        <td>${isNum(r.error) ? `${r.error.toFixed(1)} pts` : NA}</td>
        <td>${r.correct === null ? "Not scored" : r.correct ? "Yes" : "No"}</td>
        <td>${status}${r.sourceUrl ? ` · <a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">source</a>` : ""}${r.asOf ? `<br><small>${esc(r.asOf)}</small>` : ""}</td>
      </tr>`;
    }).join("");
  }

  // ---------- office switcher (Senate / Governors) ----------
  function initOfficeSwitch(){
    const buttons = document.querySelectorAll("[data-office]");
    const select = (key, push) => {
      if (!OFFICES[key]) key = "senate";
      document.querySelectorAll("[data-office-panel]").forEach(p => { p.hidden = p.dataset.officePanel !== key; });
      buttons.forEach(b => {
        const on = b.dataset.office === key;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      if (push) history.replaceState(null, "", `#${key}`);
    };
    buttons.forEach(b => b.addEventListener("click", () => select(b.dataset.office, true)));
    select(location.hash.replace("#", ""), false);
    window.addEventListener("hashchange", () => select(location.hash.replace("#", ""), false));
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderOverall();
    Object.values(OFFICES).forEach(o => {
      renderForecastMap(o);
      renderKpis(o);
      renderAccuracyMap(o);
      renderDashboard(o);
      renderAudit(o);
      renderTable(o);
    });
    initOfficeSwitch();
  });

  // Exposed for verification in the browser console.
  window.trackRecord2026 = { SEN, GOV, stats, ABBR };
})();
