// /oncosynex/assets/osx_widget.js
(function () {
  // -------------------------
  // Sizing knobs (edit here)
  // -------------------------
  // Approx. +1/2 inch = +48px
  const PANEL_WIDTH_PX = 388;        // was ~340; add ~48px
  const LOG_MAX_HEIGHT_PX = 268;     // was ~220; add ~48px

  // Typewriter speed (milliseconds per character)
  const TYPE_SPEED_MS = 15;

  // Popular question IDs (must exist in OSX_QA)
  const POPULAR_IDS = ['gen-01', 'supp-01', 'pr-01'];

  // -------------------------
  // Inject CSS that overrides any earlier styles
  // -------------------------
  const CSS = `
    #osx-widget { position: fixed; bottom: 16px; right: 16px; z-index: 9999; }

    .osx-fab {
      border: 0; border-radius: 999px; padding: 10px 14px;
      background: var(--btn, #1e64ff); color: var(--btn-ink, #fff);
      box-shadow: var(--shadow-soft, 0 6px 16px rgba(0,0,0,.25));
      font-weight: 800; cursor: pointer; font-size: 0.95rem;
    }
    .osx-fab:hover { transform: translateY(-1px); }

    .osx-panel {
      position: fixed; bottom: 70px; right: 16px; width: ${PANEL_WIDTH_PX}px;
      background: var(--panel, #fff); color: #0b1b3a;
      border: 1px solid #e6ebf4; border-radius: 12px;
      box-shadow: var(--shadow, 0 10px 28px rgba(0,0,0,.35));
      display: none; overflow: hidden;
    }
    .osx-panel.open { display: block; }

    .osx-panel-head { display:flex; align-items:center; justify-content:space-between;
      padding:10px 12px; background: var(--bg, #0f2d6b); color:#fff; }
    .osx-close { background: transparent; border: 0; color: #fff; font-size: 18px; cursor: pointer; }

    .osx-panel-body { padding: 10px 12px 0 12px; display:grid; gap:10px; }

    .osx-log { max-height: ${LOG_MAX_HEIGHT_PX}px; overflow-y:auto; margin-top:6px;
      display:grid; gap:8px; padding-bottom:8px; }
    .osx-exchange { display:grid; gap:4px; }
    .osx-q { font-weight:700; }
    .osx-a { background:#f8fbff; border:1px solid #e6ebf4; border-radius:8px; padding:8px; white-space:pre-wrap; }

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

  const ready = (fn) =>
    (document.readyState === "loading")
      ? document.addEventListener("DOMContentLoaded", fn)
      : fn();

  ready(init);

  function init() {
    // Ensure style overrides load last
    if (!document.getElementById('osx-widget-css')) {
      const s = document.createElement('style');
      s.id = 'osx-widget-css';
      s.textContent = CSS;
      document.head.appendChild(s);
    }

    // Mount target
    let mount = document.getElementById("osx-widget");
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'osx-widget';
      document.body.appendChild(mount);
    }

    // Get Q&A data
    let QA;
    try {
      // eslint-disable-next-line no-undef
      QA = (typeof OSX_QA !== "undefined") ? OSX_QA : (window.OSX_QA || []);
    } catch (e) {
      QA = window.OSX_QA || [];
    }
    if (!Array.isArray(QA)) QA = [];

    // UI
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

    // Popular (exactly 3)
    const popular = pickPopular(QA, POPULAR_IDS, 3);
    popularWrap.innerHTML = popular.map(x =>
      `<button class="osx-sugg" type="button" data-q="${escapeAttr(x.q)}">${escapeHtml(x.q)}</button>`
    ).join("");

    let greeted = false;

    // Events
    btn.addEventListener("click", () => {
      panel.classList.add("open");
      // Greet once per session, with typewriter
      if (!greeted) {
        greeted = true;
        typeAssistant("How can I help you?");
      }
      input.focus();
    });

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

    sendBtn.addEventListener("click", () => answer(input.value.trim()));

    // -------------------------
    // Core: answer with typewriter
    // -------------------------
    function answer(qtext) {
      if (!qtext) return;

      // Show user's question
      const wrap = document.createElement("div");
      wrap.className = "osx-exchange";
      wrap.innerHTML = `<div class="osx-q">${escapeHtml(qtext)}</div><div class="osx-a"></div>`;
      log.appendChild(wrap);
      log.scrollTop = log.scrollHeight;

      // Find best preset
      const qlow = qtext.toLowerCase();
      const found = QA.find(x => (x.q || '').toLowerCase() === qlow)
                || QA.find(x => (x.keywords || []).join(' ').toLowerCase().includes(qlow))
                || null;

      const answerEl = wrap.querySelector(".osx-a");
      const text = found ? String(found.a) : "I don’t have a preset answer for that yet.";
      typewriter(answerEl, text, TYPE_SPEED_MS);
    }

    function typeAssistant(text) {
      const wrap = document.createElement("div");
      wrap.className = "osx-exchange";
      wrap.innerHTML = `<div class="osx-a"></div>`;
      log.appendChild(wrap);
      log.scrollTop = log.scrollHeight;
      const answerEl = wrap.querySelector(".osx-a");
      typewriter(answerEl, text, TYPE_SPEED_MS);
    }
  }

  // -------------------------
  // Helpers
  // -------------------------
  function typewriter(el, text, speed) {
    el.textContent = "";
    let i = 0;
    const timer = setInterval(() => {
      el.textContent += text.charAt(i++);
      if (i >= text.length) clearInterval(timer);
      el.parentElement?.parentElement?.scrollTop && (el.parentElement.parentElement.scrollTop = el.parentElement.parentElement.scrollHeight);
    }, speed);
  }

  function pickPopular(QA, ids, max) {
    const map = new Map(QA.map(x => [x.id, x]));
    const out = [];
    ids.forEach(id => { if (map.has(id) && out.length < max) out.push(map.get(id)); });
    for (let i = 0; i < QA.length && out.length < max; i++) {
      if (!ids.includes(QA[i].id)) out.push(QA[i]);
    }
    return out.slice(0, max);
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
