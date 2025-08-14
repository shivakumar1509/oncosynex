// /oncosynex/assets/osx_widget.js
(function () {
  // ---- Minimal CSS (widget, illustration, bottom popular + input) ----
  const CSS = `
    #osx-widget { position: fixed; bottom: 16px; right: 16px; z-index: 9999; }
    .osx-fab { border: 0; border-radius: 999px; padding: 10px 14px;
      background: var(--btn, #1e64ff); color: var(--btn-ink, #fff);
      box-shadow: var(--shadow-soft, 0 6px 16px rgba(0,0,0,.25));
      font-weight: 800; cursor: pointer; font-size: 0.95rem; }
    .osx-fab:hover { transform: translateY(-1px); }

    .osx-panel { position: fixed; bottom: 70px; right: 16px; width: 360px;
      background: var(--panel, #fff); color: #0b1b3a;
      border: 1px solid #e6ebf4; border-radius: 12px;
      box-shadow: var(--shadow, 0 10px 28px rgba(0,0,0,.35));
      display: none; overflow: hidden; }
    .osx-panel.open { display: block; }

    .osx-panel-head { display:flex; align-items:center; justify-content:space-between;
      padding:10px 12px; background: var(--bg, #0f2d6b); color:#fff; }
    .osx-close { background: transparent; border: 0; color: #fff; font-size: 18px; cursor: pointer; }

    .osx-panel-body { padding: 10px 12px 0 12px; display:grid; gap:10px; }
    .osx-hero { display:flex; align-items:center; gap:10px; }
    .osx-illwrap { flex:0 0 64px; width:64px; height:64px; }
    .osx-illwrap svg { width:64px; height:64px; display:block; }
    .osx-hero-text { font-size: 0.9rem; color:#223257; line-height:1.3; }

    .osx-log { max-height: 220px; overflow-y:auto; margin-top:6px; display:grid; gap:8px; padding-bottom:8px; }
    .osx-exchange { display:grid; gap:4px; }
    .osx-q { font-weight:700; }
    .osx-a { background:#f8fbff; border:1px solid #e6ebf4; border-radius:8px; padding:8px; }

    /* Bottom area: popular + input row */
    .osx-bottom { border-top:1px solid #e6ebf4; background:#fbfdff; display:grid; gap:6px; padding:8px 12px; }
    .osx-popular-title { font-size: 0.8rem; font-weight:800; color:#314579; }
    .osx-popular-buttons { display:flex; flex-wrap:wrap; gap:6px; }
    .osx-sugg { border: 1px solid #d7e0f7; border-radius:999px; padding:6px 10px; background:#f6f9ff; cursor:pointer; font-size:0.85rem; }

    .osx-input-row { display:flex; align-items:center; gap:6px; }
    .osx-input { flex:1; min-width:0; padding:8px 10px; border:1px solid #d7e0f7; border-radius:8px; font-size:0.9rem; }
    .osx-send { flex:0 0 auto; border:0; border-radius:8px; padding:8px 10px;
      background: var(--btn, #1e64ff); color: var(--btn-ink, #fff); font-weight:800; cursor:pointer; }
    .osx-send:hover { filter: brightness(1.05); }
  `;
  if (!document.getElementById('osx-widget-base-css')) {
    const s = document.createElement('style');
    s.id = 'osx-widget-base-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // Choose EXACTLY three popular items by ID
  const POPULAR_IDS = ['gen-01', 'supp-01', 'pr-01'];

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
        <div class="osx-hero">
          <div class="osx-illwrap" aria-hidden="true">
            ${ladySVG()}
          </div>
          <div class="osx-hero-text">
            Ask product, pricing, or workflow questions. Use the box below and press <b>Enter</b>.
          </div>
        </div>
        <div class="osx-log"></div>
      </div>
      <div class="osx-bottom">
        <div class="osx-popular-title">Popular questions</div>
        <div class="osx-popular-buttons"></div>
        <div class="osx-input-row">
          <input class="osx-input" placeholder="Type your question…" aria-label="Type your question" />
          <button class="osx-send" type="button" aria-label="Send">Send</button>
        </div>
      </div>
    `;

    mount.appendChild(btn);
    mount.appendChild(panel);

    const closeBtn = panel.querySelector(".osx-close");
    const input = panel.querySelector(".osx-input");
    const sendBtn = panel.querySelector(".osx-send");
    const log = panel.querySelector(".osx-log");
    const popularWrap = panel.querySelector(".osx-popular-buttons");

    // --- Bottom "Popular questions" (exactly three) ---
    const popularItems = getPopular(QA, POPULAR_IDS, 3);
    popularWrap.innerHTML = popularItems.map(x =>
      `<button class="osx-sugg" type="button" data-q="${escapeAttr(x.q)}">${escapeHtml(x.q)}</button>`
    ).join("");

    // Events
    btn.addEventListener("click", () => panel.classList.add("open"));
    closeBtn.addEventListener("click", () => panel.classList.remove("open"));

    panel.addEventListener("click", (e) => {
      const b = e.target.closest(".osx-sugg");
      if (!b) return;
      const q = b.getAttribute('data-q') || b.textContent;
      input.value = q;
      answer(q);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        answer(input.value.trim());
      }
    });
    sendBtn.addEventListener("click", () => {
      answer(input.value.trim());
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
      // keep the typed text for quick edits; comment next line to clear
      // input.value = '';
    }
  }

  function getPopular(QA, ids, max) {
    const byId = new Map(QA.map(x => [x.id, x]));
    const picked = [];
    ids.forEach(id => { if (byId.has(id) && picked.length < max) picked.push(byId.get(id)); });
    if (picked.length < max) {
      for (let i = 0; i < QA.length && picked.length < max; i++) {
        if (!ids.includes(QA[i].id)) picked.push(QA[i]);
      }
    }
    return picked.slice(0, max);
  }

  function ladySVG() {
    return `
<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Assistant illustration">
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6fa0ff"/><stop offset="1" stop-color="#1e64ff"/>
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="64" fill="url(#g1)" opacity="0.18"/>
  <path d="M34 58c0-18 13-30 30-30s30 12 30 30v14c0 8-6 14-14 14H48c-8 0-14-6-14-14V58z" fill="#2b2b50"/>
  <circle cx="64" cy="60" r="20" fill="#ffddb7"/>
  <rect x="38" y="28" width="52" height="10" rx="5" fill="#1e64ff"/>
  <rect x="28" y="48" width="12" height="22" rx="6" fill="#1e64ff"/>
  <rect x="88" y="48" width="12" height="22" rx="6" fill="#1e64ff"/>
  <circle cx="56" cy="58" r="2.5" fill="#23233a"/>
  <circle cx="72" cy="58" r="2.5" fill="#23233a"/>
  <path d="M56 68c2 3 6 5 8 5s6-2 8-5" stroke="#c86a3a" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M42 92c5-8 13-12 22-12s17 4 22 12v10H42V92z" fill="#1e64ff" opacity="0.85"/>
</svg>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }
  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
})();
