/* Article comments — loads and posts comments via /api/comments. */
(function(){
  const section = document.querySelector(".article-comments");
  if (!section) return;

  const slug = section.dataset.article;
  const list = section.querySelector(".comment-list");
  const empty = section.querySelector(".comment-empty");
  const countEl = section.querySelector(".comments-count");
  const form = section.querySelector(".comment-form");
  const status = section.querySelector(".comment-status");
  const submit = section.querySelector(".comment-submit");
  const NAME_KEY = "mc-comment-name";
  let total = 0;

  const fmt = iso => new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  function renderComment(c){
    const li = document.createElement("li");
    li.className = "comment";
    li.id = `comment-${c.id}`;

    const meta = document.createElement("div");
    meta.className = "comment-meta";
    const name = document.createElement("span");
    name.className = "comment-author";
    name.textContent = c.name;
    const time = document.createElement("time");
    time.dateTime = c.createdAt;
    time.textContent = fmt(c.createdAt);
    meta.append(name, time);

    const body = document.createElement("div");
    body.className = "comment-body";
    c.body.split(/\n{2,}/).forEach(par => {
      const p = document.createElement("p");
      par.split("\n").forEach((line, i) => {
        if (i) p.appendChild(document.createElement("br"));
        p.appendChild(document.createTextNode(line));
      });
      body.appendChild(p);
    });

    li.append(meta, body);
    return li;
  }

  function updateCount(){
    countEl.textContent = total ? `(${total})` : "";
    empty.hidden = total > 0;
  }

  async function load(){
    try {
      const res = await fetch(`/api/comments?article=${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      list.replaceChildren(...data.comments.map(renderComment));
      total = data.comments.length;
      updateCount();
    } catch {
      empty.hidden = false;
      empty.textContent = "Comments couldn't be loaded right now.";
    }
  }

  const savedName = localStorage.getItem(NAME_KEY);
  if (savedName) form.elements.name.value = savedName;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const name = form.elements.name.value.trim();
    const body = form.elements.body.value.trim();
    status.classList.remove("is-error");
    if (!name || !body){
      status.textContent = !name ? "Please enter your name." : "Please write a comment.";
      status.classList.add("is-error");
      return;
    }

    submit.disabled = true;
    status.textContent = "Posting…";
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article: slug, name, body, website: form.elements.website.value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");

      localStorage.setItem(NAME_KEY, name);
      form.elements.body.value = "";
      status.textContent = "Thanks — your comment is posted.";
      if (data.comment){
        const li = renderComment(data.comment);
        list.appendChild(li);
        total += 1;
        updateCount();
        li.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } catch (err){
      status.textContent = err.message;
      status.classList.add("is-error");
    } finally {
      submit.disabled = false;
    }
  });

  load();
})();
