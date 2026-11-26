/* ==========================================================
   HISTORICAL FORECASTING PERFORMANCE — data + calculations
   (track-record-history.html, the Track Record overview)

   HISTORICAL_PERFORMANCE holds one record per forecast set:
   how many winner calls were correct out of the total races
   forecast. Every subtotal, total, percentage, chart bar and
   tooltip on the page is calculated from these records.
   Nothing is hard-coded.

   To add a future election, append a record. The headline
   cards, cycle panels, table, chart and (for Senate records)
   the Senate section update automatically.

   `page` is the detailed archive for that record. The anchors
   already exist on the archive pages (the 2026 page opens the
   matching office tab from #senate / #governors).
   ========================================================== */
(function(){
  "use strict";

  const HISTORICAL_PERFORMANCE = Object.freeze([
    { id: "2024-president", year: 2024, office: "Presidential", label: "2024 Presidential", unit: "states", correct: 48,  total: 50,  page: "track-record.html" },
    { id: "2024-senate",    year: 2024, office: "Senate",       label: "2024 Senate",       unit: "races",  correct: 33,  total: 34,  page: "track-record.html#senate-performance-dashboard" },
    { id: "2024-house",     year: 2024, office: "House",        label: "2024 House",        unit: "seats",  correct: 428, total: 435, page: "track-record.html#house-2024" },
    { id: "2026-senate",    year: 2026, office: "Senate",       label: "2026 Senate",       unit: "races",  correct: 29,  total: 35,  page: "track-record-2026.html#senate" },
    { id: "2026-governors", year: 2026, office: "Governors",    label: "2026 Governors",    unit: "races",  correct: 33,  total: 36,  page: "track-record-2026.html#governors" },
  ].map(Object.freeze));

  const ARCHIVES = { 2024: "track-record.html", 2026: "track-record-2026.html" };
  const CYCLE_NAMES = { 2024: "General Election", 2026: "Midterm Election" };

  // ---------- calculations ----------
  const pct = (correct, total) => total > 0 ? (correct / total) * 100 : null;

  function tally(records){
    const correct = records.reduce((sum, r) => sum + r.correct, 0);
    const total = records.reduce((sum, r) => sum + r.total, 0);
    return { correct, total, incorrect: total - correct, accuracy: pct(correct, total), count: records.length };
  }

  function summarise(records){
    const years = [...new Set(records.map(r => r.year))].sort((a, b) => a - b);
    const senate = records.filter(r => r.office === "Senate");
    return {
      records: records.map(r => ({ ...r, incorrect: r.total - r.correct, accuracy: pct(r.correct, r.total) })),
      byYear: years.map(year => ({ year, ...tally(records.filter(r => r.year === year)) })),
      senate: { records: senate.map(r => ({ ...r, incorrect: r.total - r.correct, accuracy: pct(r.correct, r.total) })), ...tally(senate) },
      overall: tally(records),
    };
  }

  const SUMMARY = summarise(HISTORICAL_PERFORMANCE);

  // ---------- integrity check against the published figures ----------
  const round2 = v => Math.round(v * 100) / 100;
  const EXPECTED = [
    ["2024",     SUMMARY.byYear.find(y => y.year === 2024), 509, 519, 98.07],
    ["2026",     SUMMARY.byYear.find(y => y.year === 2026), 62,  71,  87.32],
    ["Combined", SUMMARY.overall,                           571, 590, 96.78],
    ["Senate",   SUMMARY.senate,                            62,  69,  89.86],
  ];
  const problems = EXPECTED
    .filter(([, t, c, n, p]) => !t || t.correct !== c || t.total !== n || round2(t.accuracy) !== p)
    .map(([name, t, c, n, p]) => `${name}: ${t ? `${t.correct}/${t.total} = ${t.accuracy.toFixed(2)}%` : "missing"}, expected ${c}/${n} = ${p}%`);
  if (problems.length && typeof console !== "undefined") console.warn("Historical performance totals do not match:", problems.join("; "));

  window.HISTORICAL_PERFORMANCE = HISTORICAL_PERFORMANCE;
  window.HISTORICAL_SUMMARY = SUMMARY;

  // ---------- rendering helpers ----------
  const fmtPct = v => v === null ? "—" : `${v.toFixed(2)}%`;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; return el; };
  const card = (n, l, cls = "") => `<div class="stat-card${cls ? ` ${cls}` : ""}"><span class="stat-number">${esc(n)}</span><span class="stat-label">${esc(l)}</span></div>`;

  // ---------- headline dashboard + cycle panels ----------
  function renderDashboard(){
    const o = SUMMARY.overall;
    set("history-kpis", [
      card(`${o.correct}/${o.total}`, "Correct winner predictions"),
      card(fmtPct(o.accuracy), "Overall winner accuracy"),
      card(String(o.incorrect), "Incorrect winner predictions"),
      card(String(SUMMARY.byYear.length), "US election cycles evaluated"),
    ].join(""));

    set("history-cycles", SUMMARY.byYear.map(y => {
      const recs = SUMMARY.records.filter(r => r.year === y.year);
      const archive = ARCHIVES[y.year];
      return `<article class="forecast-map history-cycle">
        <div class="map-header">
          <span>${y.year} cycle</span>
          <span>${y.count} forecast ${y.count === 1 ? "set" : "sets"}</span>
        </div>
        <div class="history-cycle-body">
          <h3>${y.year} ${esc(CYCLE_NAMES[y.year] || "Elections")}</h3>
          <div class="history-cycle-totals">
            <div><span class="stat-number">${y.correct}/${y.total}</span><span class="stat-label">Correct</span></div>
            <div><span class="stat-number history-accent">${fmtPct(y.accuracy)}</span><span class="stat-label">Accuracy</span></div>
          </div>
          <dl class="panel-metrics history-cycle-list">
            ${recs.map(r => `<dt><a href="${esc(r.page)}">${esc(r.office)}</a></dt><dd>${r.correct}/${r.total}</dd>`).join("")}
          </dl>
          ${archive ? `<a class="history-cycle-link" href="${esc(archive)}">${y.year} Election Archive →</a>` : ""}
        </div>
      </article>`;
    }).join(""));
  }

  // ---------- performance-by-election table ----------
  function renderTable(){
    set("history-table", SUMMARY.records.map(r => `<tr>
      <th scope="row"><a href="${esc(r.page)}">${esc(r.label)}</a></th>
      <td data-label="Correct">${r.correct}/${r.total}</td>
      <td data-label="Incorrect">${r.incorrect}</td>
      <td data-label="Accuracy">${fmtPct(r.accuracy)}</td>
    </tr>`).join(""));
    const o = SUMMARY.overall;
    set("history-total", `<tr>
      <th scope="row">Combined total</th>
      <td data-label="Correct">${o.correct}/${o.total}</td>
      <td data-label="Incorrect">${o.incorrect}</td>
      <td data-label="Accuracy">${fmtPct(o.accuracy)}</td>
    </tr>`);
  }

  // ---------- winner-accuracy bar chart ----------
  // Same structure, row layout and tooltip as the site's margin charts
  // (.mchart in style.css). The axis always runs from 0% to 100%, so
  // bar lengths are proportional to accuracy and the scale is not cropped.
  function renderChart(){
    const el = document.getElementById("history-chart");
    if (!el) return;
    const ticks = [0, 25, 50, 75, 100];
    const o = SUMMARY.overall;
    el.innerHTML = `
      <div class="mchart-axis" aria-hidden="true">
        <span class="mchart-label"></span>
        <div class="mchart-track">${ticks.map(t => `<span class="mchart-tick" style="left:${t}%">${t}%</span>`).join("")}</div>
      </div>
      ${SUMMARY.records.map(r => `
        <div class="mchart-row hbar-row" tabindex="0" role="img"
             aria-label="${esc(r.label)}: ${r.correct} of ${r.total} correct, ${fmtPct(r.accuracy)} winner accuracy"
             data-label="${esc(r.label)}" data-correct="${r.correct}" data-total="${r.total}" data-incorrect="${r.incorrect}" data-acc="${fmtPct(r.accuracy)}">
          <span class="mchart-label">${esc(r.label)}</span>
          <div class="mchart-track">
            ${ticks.map(t => `<span class="mchart-grid${t === 0 ? " zero" : ""}" style="left:${t}%"></span>`).join("")}
            <span class="hbar${r.accuracy < 20 ? " is-short" : ""}" style="width:${r.accuracy}%"><span class="hbar-value">${fmtPct(r.accuracy)}</span></span>
            <span class="hbar-ref" style="left:${o.accuracy}%"></span>
          </div>
        </div>`).join("")}
      <div class="mchart-tooltip" role="presentation" hidden></div>`;

    const rows = [...el.querySelectorAll(".hbar-row")];

    const tip = el.querySelector(".mchart-tooltip");
    const show = row => {
      tip.innerHTML = "";
      const title = document.createElement("strong");
      title.textContent = row.dataset.label;
      tip.appendChild(title);
      [[`${row.dataset.correct}/${row.dataset.total}`, "correct"], [row.dataset.incorrect, "incorrect"], [row.dataset.acc, "winner accuracy"]].forEach(([v, k]) => {
        const s = document.createElement("span");
        const b = document.createElement("b");
        b.textContent = v;
        s.append(b, ` ${k}`);
        tip.appendChild(s);
      });
      tip.hidden = false;
      tip.style.top = `${row.offsetTop + row.offsetHeight + 4}px`;
      rows.forEach(r => r.classList.toggle("is-active", r === row));
    };
    const hide = () => { tip.hidden = true; rows.forEach(r => r.classList.remove("is-active")); };
    rows.forEach(row => {
      row.addEventListener("pointerenter", () => show(row));
      row.addEventListener("focus", () => show(row));
      row.addEventListener("click", () => show(row));
      row.addEventListener("pointerleave", hide);
      row.addEventListener("blur", hide);
    });

    set("history-chart-ref", `Combined accuracy across all elections: ${fmtPct(o.accuracy)} (${o.correct}/${o.total})`);
  }

  // ---------- US Senate record ----------
  function renderSenate(){
    const s = SUMMARY.senate;
    set("history-senate", [
      ...s.records.map(r => `<a class="stat-card history-link-card" href="${esc(r.page)}"><span class="stat-number">${r.correct}/${r.total}</span><span class="stat-label">${esc(r.label)} · ${fmtPct(r.accuracy)}</span></a>`),
      card(`${s.correct}/${s.total}`, "Combined Senate record"),
      card(fmtPct(s.accuracy), "Combined Senate accuracy", "history-accent-card"),
    ].join(""));
  }

  function render(){
    renderDashboard();
    renderTable();
    renderChart();
    renderSenate();
    const stamp = document.getElementById("history-stamp");
    if (stamp) stamp.textContent = SUMMARY.byYear.map(y => y.year).join(" · ");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})();
