(function () {
  var KEY = "notes-app-v1";
  var notes = [], activeId = null, query = "", saveTimer = null, memoryOnly = false;

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(notes)); }
    catch (e) { memoryOnly = true; }
  }
  function queueSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 250);
  }
  window.addEventListener("beforeunload", function () {
    clearTimeout(saveTimer);
    save();
  });

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function fmt(t) {
    var d = new Date(t), now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    return d.toLocaleDateString([], {
      month: "short", day: "numeric",
      year: d.getFullYear() === now.getFullYear() ? undefined : "numeric"
    });
  }
  function find(id) { return notes.find(function (n) { return n.id === id; }); }

  function visible() {
    var q = query.trim().toLowerCase();
    return notes.filter(function (n) {
      return !q || (n.title + " " + n.body).toLowerCase().indexOf(q) > -1;
    }).sort(function (a, b) {
      return (b.pinned - a.pinned) || (b.updated - a.updated);
    });
  }

  function itemHTML(n) {
    var title = n.title.trim() || "Untitled note";
    var preview = n.body.trim().split("\n")[0] || "No additional text";
    return '<li class="item' + (n.id === activeId ? " active" : "") + '" data-id="' + n.id +
      '" tabindex="0" role="button">' +
      '<div class="t">' + (n.pinned ? '<span class="pinmark" aria-label="Pinned">&#9733;</span>' : "") +
      "<span>" + esc(title) + "</span></div>" +
      '<div class="p">' + esc(preview) + "</div>" +
      '<div class="d">' + fmt(n.updated) + "</div></li>";
  }

  function renderList() {
    var list = visible(), el = document.getElementById("list"), html = "";
    if (!list.length) {
      el.innerHTML = '<li class="empty">' +
        (query ? "No notes match “" + esc(query) + "”." : "No notes yet. Select New note to start.") +
        "</li>";
      return;
    }
    var pinned = list.filter(function (n) { return n.pinned; });
    var rest = list.filter(function (n) { return !n.pinned; });
    if (pinned.length) html += '<li class="group">Pinned</li>' + pinned.map(itemHTML).join("");
    if (rest.length) html += (pinned.length ? '<li class="group">Notes</li>' : "") + rest.map(itemHTML).join("");
    el.innerHTML = html;
  }

  function renderMain() {
    var m = document.getElementById("main"), n = find(activeId);
    document.getElementById("app").classList.toggle("editing", !!n);

    if (!n) {
      m.innerHTML = '<div class="blank">Select a note or create a new one.</div>';
      return;
    }

    m.innerHTML =
      '<div class="bar"><button class="btn back" id="back">Back</button>' +
      '<span class="meta" id="meta"></span>' +
      '<button class="btn pinbtn" id="pin" aria-pressed="' + n.pinned + '">' + (n.pinned ? "Unpin" : "Pin") + "</button>" +
      '<button class="btn danger" id="del">Delete</button></div>' +
      '<input class="title" id="title" placeholder="Title" aria-label="Note title">' +
      '<textarea class="body" id="body" placeholder="Start writing" aria-label="Note body"></textarea>';

    var t = document.getElementById("title"), b = document.getElementById("body");
    t.value = n.title;
    b.value = n.body;

    function updateMeta() {
      document.getElementById("meta").textContent =
        "Edited " + fmt(n.updated) + (memoryOnly ? " · not saved to this browser" : "");
    }
    updateMeta();

    function edit() {
      n.title = t.value;
      n.body = b.value;
      n.updated = Date.now();
      queueSave();
      updateMeta();
      renderList();
    }
    t.addEventListener("input", edit);
    b.addEventListener("input", edit);

    document.getElementById("pin").onclick = function () {
      n.pinned = !n.pinned;
      save();
      renderList();
      renderMain();
    };
    document.getElementById("del").onclick = function () {
      if (!confirm("Delete this note? This can't be undone.")) return;
      notes = notes.filter(function (x) { return x.id !== n.id; });
      activeId = null;
      save();
      renderList();
      renderMain();
    };
    document.getElementById("back").onclick = function () {
      activeId = null;
      renderList();
      renderMain();
    };
  }

  function select(id) {
    activeId = id;
    renderList();
    renderMain();
  }

  document.getElementById("new").onclick = function () {
    var n = { id: uid(), title: "", body: "", pinned: false, created: Date.now(), updated: Date.now() };
    notes.unshift(n);
    query = "";
    document.getElementById("q").value = "";
    save();
    select(n.id);
    var t = document.getElementById("title");
    if (t) t.focus();
  };

  document.getElementById("q").addEventListener("input", function (e) {
    query = e.target.value;
    renderList();
  });

  var listEl = document.getElementById("list");
  listEl.addEventListener("click", function (e) {
    var li = e.target.closest(".item");
    if (li) select(li.dataset.id);
  });
  listEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      var li = e.target.closest(".item");
      if (li) { e.preventDefault(); select(li.dataset.id); }
    }
  });

  document.getElementById("theme").onclick = function () {
    var r = document.documentElement;
    var dark = r.dataset.theme
      ? r.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme:dark)").matches;
    r.dataset.theme = dark ? "light" : "dark";
  };

  notes = load().map(function (n) {
    return {
      id: n.id || uid(),
      title: n.title || "",
      body: n.body || "",
      pinned: !!n.pinned,
      created: n.created || Date.now(),
      updated: n.updated || Date.now()
    };
  });
  renderList();
  renderMain();
})();