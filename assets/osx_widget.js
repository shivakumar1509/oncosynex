// /oncosynex/assets/osx_widget.js
(function () {
  // ---- Inject minimal CSS so the widget is visible and on top ----
  const CSS = `
    #osx-widget { position: fixed; bottom: 16px; right: 16px; z-index: 9999; }
    .osx-fab { border: 0; border-radius: 999px; padding: 10px 14px;
      background: var(--btn, #1e64ff); color: var(--btn-ink, #fff);
      box-shadow: var(--shadow-soft, 0 6px 16px rgba(0,0,0,.25));
      font-weight: 800; cursor: pointer; font-size: 0.95rem; }
    .osx-fab:hover { transform: translateY(-1px); }
    .osx-panel { position: fixed; bottom: 70px; right: 16px; width: 340px;
      background: var(--panel, #fff); color: #0b1b3a;
      border: 1px solid #e6ebf4; border-radius: 12px;
      box-shadow: var(--shadow, 0 10px 28px rgba(0,0,0,.35));
      display: none; overflow: hidden; }
    .osx-panel.open { display: block; }
    .osx-panel-head { display:flex; align-items:center; justify-content:space-between;
      padding:10px 12px; background: var(--bg, #0f2d6b); color:#fff; }
    .osx-close { background: transparent; border: 0; color: #fff; font-size: 18px; cursor: pointer; }
    .osx-panel-body { padding: 10px 12px; }
    .osx-input { width:100%; padding:8px 10px; border:1px solid #d7e0f7; border-radius:8px; }
    .osx-suggestions { margin-top: 8px; display:flex; flex-wrap:wrap; gap:6px; }
    .osx-sugg { border: 1px solid #d7e0f7; border-radius:999px; padding:6px 10px; background:#f6f9ff; cursor:pointer; }
    .osx-log { max-height: 220px; overflow-y:auto; margin-top:10px; display:grid; gap:8px; }
    .osx-q { font-weight:700; }
    .osx-a { background:#f8fbff; border:1px solid #e6ebf4; border-radius:8px; padding:8px; }
  `;
  if (!document.getElementById('osx-widget-base-css')) {
    const s = document.createElement('style');
    s.id = 'osx-widget-base-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ---- Init after DOM ready ----
  const ready = (fn) => (document.readyState === "loading")
    ? document.addEventListener("DOMContentLoaded", fn)
    : fn();
  ready(init);

  function init() {
    // Ensure mount exists; if not, create it.
    let mount = document.getElementById("osx-widget");
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'osx-widget';
      document.body.appendChild(mount);
    }

    // Pull Q&A from global
    const QA = (window && Array.isArray(window.OSX_QA)) ? window.OSX_QA : [];
    if (QA.length === 0) {
      console.warn('[OSX] window.OSX_QA missing or empty. Make sure osx_qa.js is loaded BEFORE this file.');
    }

    // --- Build UI ---
    const btn = document.createElement("button");
    btn.className = "osx-fab";
    btn.type = "button";
    btn.textContent = "Ask OncoSyNex";

    const panel = document.createElement("div");
    panel.className = "osx-panel";
    panel.innerHTML = `
      <div class="osx-panel-head">
        <strong>OncoSyNex AI</strong>
        <button class="osx-close" aria-label="Close">×</button>
      </div>
      <div class="osx-panel-body">
        <input class="osx-input" placeholder="Ask a question…" />
        <div class="osx-suggestions"></div>
        <div class="osx-log"></div>
      </div>
    `;

    mount.appendChild(btn);
    mount.appendChild(panel);

    const closeBtn = panel.querySelector(".osx-close");
    const input = panel.querySelector(".osx-input");
    const sugg = panel.querySelector(".osx-suggestions");
    const log = panel.querySelector(".osx-log");

    // Seed suggestions (top 5)
    sugg.innerHTML = (QA.slice(0, 5).map(x =>
      `<button class="osx-sugg" type="button">${escapeHtml(x.q)}</button>`
    ).join("")) || "";

    // Events
    btn.addEventListener("click", () => panel.classList.add("open"));
    closeBtn.addEventListener("click", () => panel.classList.remove("open"));

    panel.addEventListener("click", (e) => {
      const b = e.target.closest(".osx-sugg");
      if (!b) return;
      input.value = b.textContent;
      answer(b.textContent);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        answer(input.value.trim());
      }
    });

    function answer(qtext) {
      if (!qtext) return;
      const qlow = qtext.toLowerCase();
      const found = QA.find(x => (x.q || '').toLowerCase() === qlow)
                || QA.find(x => (x.keywords || []).join(' ').toLowerCase().includes(qlow))
                || null;

      const wrap = document.createElement("div");
      wrap.className = "osx-exchange";
      wrap.innerHTML = `
        <div class="osx-q">${escapeHtml(qtext)}</div>
        <div class="osx-a">${found ? escapeHtml(found.a) : "I don’t have a preset answer for that yet."}</div>
      `;
      log.appendChild(wrap);
      log.scrollTop = log.scrollHeight;
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, m => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      }[m]));
    }
  }
})();
