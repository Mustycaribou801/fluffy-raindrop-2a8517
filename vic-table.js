/* 2026 Victorian electorate table: search, sort and filter.
   The rows are static HTML generated from the CSV; this only reorders and hides them. */
(function () {
  var table = document.getElementById("vic-table");
  if (!table) return;
  var tbody = table.tBodies[0];
  var rows = Array.prototype.slice.call(tbody.rows);
  var search = document.getElementById("vic-search");
  var winner = document.getElementById("vic-winner");
  var sortSelect = document.getElementById("vic-sort");
  var count = document.getElementById("vic-count");
  var empty = document.getElementById("vic-empty");
  var chips = Array.prototype.slice.call(document.querySelectorAll(".vic-chip"));
  var headers = Array.prototype.slice.call(table.tHead.querySelectorAll("th"));
  var ORDER = { LIB: 0, NAT: 1, ALP: 2, ONP: 3, GRN: 4, IND: 5 };
  var state = { q: "", winner: "", filter: "all", key: "name", dir: "asc" };

  function value(row, key) {
    var d = row.dataset;
    if (key === "margin") return parseFloat(d.margin);
    if (key === "name") return d.name;
    if (key === "status") return d.status === "gain" ? 0 : 1;
    return ORDER[d[key]];
  }

  function apply() {
    var q = state.q.trim().toLowerCase();
    var shown = 0;
    var sorted = rows.slice().sort(function (a, b) {
      var va = value(a, state.key), vb = value(b, state.key), c;
      c = typeof va === "string" ? va.localeCompare(vb) : va - vb;
      if (state.dir === "desc") c = -c;
      return c || a.dataset.name.localeCompare(b.dataset.name);
    });
    sorted.forEach(function (row) {
      var d = row.dataset;
      var ok = (!q || d.name.toLowerCase().indexOf(q) !== -1) &&
        (!state.winner || d.winner === state.winner) &&
        (state.filter === "all" ||
          (state.filter === "close" ? d.close === "1" : d.status === state.filter));
      row.hidden = !ok;
      if (ok) shown++;
      tbody.appendChild(row);
    });
    count.textContent = "Showing " + shown + " of " + rows.length + " electorates";
    empty.hidden = shown !== 0;

    headers.forEach(function (th) {
      var btn = th.querySelector("button");
      if (btn && btn.dataset.sort === state.key) th.setAttribute("aria-sort", state.dir === "asc" ? "ascending" : "descending");
      else th.removeAttribute("aria-sort");
    });
    var opt = state.key + ":" + state.dir;
    sortSelect.value = Array.prototype.some.call(sortSelect.options, function (o) { return o.value === opt; }) ? opt : "";
  }

  search.addEventListener("input", function () { state.q = search.value; apply(); });
  winner.addEventListener("change", function () { state.winner = winner.value; apply(); });
  sortSelect.addEventListener("change", function () {
    if (!sortSelect.value) return;
    var p = sortSelect.value.split(":");
    state.key = p[0]; state.dir = p[1]; apply();
  });
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      state.filter = chip.dataset.filter;
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      apply();
    });
  });
  headers.forEach(function (th) {
    var btn = th.querySelector("button");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var key = btn.dataset.sort;
      state.dir = state.key === key && state.dir === "asc" ? "desc" : "asc";
      state.key = key;
      apply();
    });
  });

  table.classList.add("is-enhanced");
  apply();
})();
