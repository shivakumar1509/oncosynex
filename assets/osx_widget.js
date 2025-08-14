/* osx_widget.js — OncoSyNex floating chat widget
   - Expects a global `OSX_QA` array (loaded by osx_qa.js).
   - Injects its own DOM + CSS.
   - Exposes `window.OsxWidget.open()` and `window.OsxWidget.reset()`.
*/
(function () {
  /* ---------- Helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const el = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstChild;
  };
  const escapeHtml = (s) =>
    s.replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  /* ---------- Styles (scoped-ish) ---------- */
  const CSS = `
  :root{
    --osx-brand: var(--brand, #1e64ff);
    --osx-bg: var(--panel, #ffffff);
    --osx-ink: #0f1a2a;
    --osx-line: var(--line, #e6ebf4);
    --osx-shadow: var(--shadow, 0 16px 36px rgba(0,0,0,.28));
    --osx-radius: var(--radius, 16px);
  }
  .osx-fab{
    position: fixed; right: 18px; bottom: 18px;
    display: inline-flex; align-items: center; gap: 10px;
    padding: 12px 14px; border-radius: 999px;
    background: var(--osx-brand); color: #fff; font-weight: 900;
    border: 0; box-shadow: var(--osx-shadow); cursor: pointer; z-index: 120;
  }
  .osx-fab .osx-dot{ width:10px;height:10px;border-radius:99px;background:#22c55e; box-shadow:0 0 0 3px rgba(34,197,94,.18); }
  .osx-fab svg{ width:20px;height:20px; }

  .osx-chat{
    position: fixed; right: 18px; bottom: 80px; width: min(420px, 92vw);
    background: var(--osx-bg); color: var(--osx-ink);
    border: 1px solid var(--osx-line); border-radius: var(--osx-radius);
    box-shadow: var(--osx-shadow); overflow: hidden; z-index: 130; display: none;
    transform-origin: bottom right; animation: osx-pop .18s ease-out;
  }
  .osx-chat.open{ display:block; }
  @keyframes osx-pop{ from{ transform: scale(.94); opacity:0 } to{ transform: scale(1); opacity:1 } }

  .osx-head{ display:flex; align-items:center; gap:10px; padding:12px 14px;
    border-bottom:1px solid var(--osx-line);
    background:linear-gradient(180deg, rgba(255,255,255,.95), rgba(255,255,255,.85));
  }
  .osx-head .osx-avatar{ width:28px;height:28px;border-radius:8px; position: relative; }
  .osx-head .osx-avatar::after{ content:''; position:absolute; right:-3px; bottom:-3px; width:10px;height:10px;border-radius:99px;background:#22c55e; box-shadow:0 0 0 2px #fff; }
  .osx-head h3{ margin:0; font-size: .98rem; }
  .osx-head .osx-actions{ margin-left:auto; display:flex; gap:6px; }
  .osx-head .osx-actions button{ border:1px solid var(--osx-line); background:#f6f8ff; padding:6px 8px; border-radius:10px; cursor:pointer; font-weight:700 }

  .osx-feed{ height:min(60vh, 520px); overflow:auto; padding:0; background:linear-gradient(180deg, #f8fbff, #fff); }
  .osx-hero {
    display:flex; align-items:center; gap:12px;
    padding:12px; border-bottom:1px dashed var(--osx-line);
    background: linear-gradient(180deg, #f6faff, #ffffff);
    position: sticky; top: 0; z-index: 1;
  }
  .osx-hero .bubble {
    flex:1; background:#fff; border:1px solid var(--osx-line);
    border-radius:14px; padding:10px 12px; font-weight:600;
  }
  .osx-hero .toon {
    width:54px; height:54px; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,.12);
    overflow:hidden; background:#e7efff; display:grid; place-items:center; border:1px solid var(--osx-line);
  }

  .osx-body{ padding:14px; }
  .osx-msg{ display:flex; gap:10px; margin:10px 0; align-items:flex-start; }
  .osx-msg .osx-bubble{ max-width:68ch; padding:10px 12px; border-radius:14px; border:1px solid var(--osx-line); background:#fff; }
  .osx-msg.user{ justify-content:flex-end; }
  .osx-msg.user .osx-bubble{ background:#e8f0ff; border-color:#d8e5ff; }
  .osx-msg .osx-avatar-sm{ width:24px;height:24px;border-radius:8px; }

  .osx-typing{ display:inline-flex; gap:4px; }
  .osx-typing span{ width:6px;height:6px;border-radius:99px;background:#c1c9dd; animation: osx-bounce 1s infinite ease-in-out; }
  .osx-typing span:nth-child(2){ animation-delay:.15s } .osx-typing span:nth-child(3){ animation-delay:.3s }
  @keyframes osx-bounce{ 0%,80%,100%{ transform:translateY(0) } 40%{ transform:translateY(-4px) } }

  .osx-suggest{ display:flex; flex-wrap:wrap; gap:8px; margin-top:6px }
  .osx-chip{ background:#f2f6ff; border:1px solid var(--osx-line); border-radius:999px; padding:6px 10px; cursor:pointer; font-weight:700; font-size:.88rem }
  .osx-chip:hover{ background:#e8f0ff }

  .osx-compose{ display:flex; gap:8px; padding:10px; border-top:1px solid var(--osx-line); background:#fff }
  .osx-input{ flex:1; border:1px solid var(--osx-line); border-radius:12px; padding:10px 12px; font-size:1rem }
  .osx-send{ background: var(--osx-brand); color:#fff; border:0; border-radius:12px; padding:10px 14px; font-weight:800; cursor:pointer }
  `;

  /* ---------- DOM (button + chat) ---------- */
  const ROBOT_SVG_28 = `
    <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
      <rect x="10" y="16" width="44" height="34" rx="10" fill="#1e64ff"/>
      <circle cx="26" cy="33" r="6" fill="#ffffff"/>
      <circle cx="38" cy="33" r="6" fill="#ffffff"/>
      <circle cx="26" cy="33" r="3" fill="#1e64ff"/>
      <circle cx="38" cy="33" r="3" fill="#1e64ff"/>
      <rect x="24" y="42" width="16" height="3" rx="1.5" fill="#0b3aa4"/>
    </svg>
  `;
  const ROBOT_SVG_42 = `
    <svg viewBox="0 0 64 64" width="42" height="42" aria-hidden="true">
      <rect x="10" y="16" width="44" height="34" rx="10" fill="#1e64ff"/>
      <circle cx="26" cy="33" r="7" fill="#ffffff"/>
      <circle cx="38" cy="33" r="7" fill="#ffffff"/>
      <circle cx="26" cy="33" r="3.5" fill="#1e64ff"/>
      <circle cx="38" cy="33" r="3.5" fill="#1e64ff"/>
      <rect x="24" y="44" width="16" height="4" rx="2" fill="#0b3aa4"/>
      <rect x="30" y="10" width="4" height="8" rx="2" fill="#1e64ff"/>
      <circle cx="32" cy="10" r="3" fill="#0b3aa4"/>
    </svg>
  `;

  const styleTag = el(`<style>${CSS}</style>`);
  document.head.appendChild(styleTag);

  const fab = el(`
    <button class="osx-fab" id="osxFab" title="Ask OncoSyNex AI" aria-controls="osxChat">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H12l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 12.5v-7Z" fill="currentColor"/>
      </svg>
      Ask OncoSyNex AI
      <span class="osx-dot" aria-hidden="true"></span>
    </button>
  `);

  const chat = el(`
    <div class="osx-chat" id="osxChat" role="dialog" aria-modal="true" aria-label="Ask OncoSyNex AI">
      <div class="osx-head">
        <div class="osx-avatar" aria-hidden="true">${ROBOT_SVG_28}</div>
        <h3>OncoSyNex AI • online</h3>
        <div class="osx-actions">
          <button id="osxReset">Reset</button>
          <button id="osxClose">Close</button>
        </div>
      </div>
      <div class="osx-feed" id="osxFeed">
        <div class="osx-hero" id="osxHero">
          <div class="toon" aria-hidden="true">${ROBOT_SVG_42}</div>
          <div class="bubble">
            <strong>Hi! I’m your OncoSyNex assistant.</strong><br/>
            Ask me about <strong>ImmunoAI</strong>, <strong>Bioinformatics Suite</strong>, <strong>Antigens & plasmids</strong>, or <strong>pricing</strong>.
          </div>
        </div>
        <div class="osx-body" id="osxBody"></div>
      </div>
      <div class="osx-compose">
        <input class="osx-input" id="osxPrompt" type="text" placeholder="Type your question…" />
        <button class="osx-send" id="osxSend">Send</button>
      </div>
    </div>
  `);

  document.body.appendChild(fab);
  document.body.appendChild(chat);

  /* ---------- Q&A matcher ---------- */
  const QA = (window.OSX_QA && Array.isArray(window.OSX_QA)) ? window.OSX_QA : [
    {id:'placeholder', q:'What can you do?', a:'Load your osx_qa.js to provide product answers.', tags:['info']},
  ];

  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const toks = (s) => norm(s).split(' ').filter(Boolean);
  const jacc = (a,b)=>{const A=new Set(a),B=new Set(b);const I=[...A].filter(x=>B.has(x)).length;const U=new Set([...A,...B]).size;return U?I/U:0};
  function score(q, item){
    const qt = toks(q);
    const it = toks(item.q + ' ' + (item.keywords||[]).join(' '));
    let s = jacc(qt, it);
    (item.keywords||[]).forEach(k => { if (norm(q).includes(norm(k))) s += .15; });
    if (/price|cost|rate|subscription/.test(q) && item.tags?.includes('pricing')) s += .2;
    if (/demo|trial|walkthrough|contact/.test(q) && item.tags?.includes('demo')) s += .2;
    if (/security|privacy|compliance|hipaa|gdpr/.test(q) && item.tags?.includes('security')) s += .2;
    return s;
  }
  function match(q, limit=3){
    return QA.map(x => ({...x, _s: score(q,x)}))
             .filter(x => x._s > 0)
             .sort((a,b) => b._s - a._s)
             .slice(0, limit);
  }

  /* ---------- Chat feed ---------- */
  const feedBody = $('#osxBody');
  function feedMsg(role, html){
    const node = el(`
      <div class="osx-msg ${role}">
        ${role==='bot' ? `<div class="osx-avatar-sm" aria-hidden="true">${ROBOT_SVG_28}</div>` : ''}
        <div class="osx-bubble">${html}</div>
      </div>
    `);
    feedBody.appendChild(node);
    const feed = $('#osxFeed');
    feed.scrollTop = feed.scrollHeight;
    return node;
  }
  function typing(on=true){
    const id = 'osxTyping';
    if (on) {
      const n = el(`
        <div class="osx-msg bot" id="${id}">
          <div class="osx-avatar-sm" aria-hidden="true">${ROBOT_SVG_28}</div>
          <div class="osx-bubble"><span class="osx-typing"><span></span><span></span><span></span></span></div>
        </div>
      `);
      feedBody.appendChild(n);
      $('#osxFeed').scrollTop = $('#osxFeed').scrollHeight;
    } else {
      const n = document.getElementById(id);
      if (n) n.remove();
    }
  }

  function suggest(){
    const top = QA.slice(0,4).map(x => `<button class="osx-chip" data-qid="${x.id}">${x.q}</button>`).join('');
    const node = feedMsg('bot', `<strong>Popular questions</strong><div class="osx-suggest">${top}</div>`);
    node.querySelectorAll('[data-qid]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = QA.find(x => x.id === btn.dataset.qid);
        if (item) ask(item.q);
      });
    });
  }
  function answer(q){
    const m = match(q,3);
    if (!m.length) return { html: `I couldn’t find a match. Try rephrasing, or see <a href="/oncosynex/resources/platform/">platform resources</a> or <a href="/oncosynex/contact/#demo">schedule a demo</a>.` };
    if (m[0]._s >= 0.55) {
      const related = m.slice(1).map(x => `<button class="osx-chip" data-qid="${x.id}">${x.q}</button>`).join('');
      return { html: m[0].a + (related ? `<div style="margin-top:8px"><em>Related:</em> ${related}</div>` : '') };
    }
    const opts = m.map(x => `<li><button class="osx-chip" data-qid="${x.id}">${x.q}</button></li>`).join('');
    return { html: `Did you mean:<ul class="osx-suggest" style="list-style:none;padding:0;margin:6px 0 0">${opts}</ul>` };
  }
  async function ask(text){
    feedMsg('user', escapeHtml(text));
    typing(true);
    await new Promise(r => setTimeout(r, 300));
    typing(false);
    const { html } = answer(text);
    const node = feedMsg('bot', html);
    node.querySelectorAll?.('[data-qid]')?.forEach?.(btn => {
      btn.addEventListener('click', () => {
        const item = QA.find(x => x.id === btn.dataset.qid);
        if (item) ask(item.q);
      });
    });
  }

  function startChat(){
    // Reset feed but keep the hero section
    feedBody.innerHTML = '';
    feedMsg('bot', `Welcome! How can I help today?`);
    suggest();
  }

  /* ---------- Wire up ---------- */
  const prompt = $('#osxPrompt');
  const sendBtn = $('#osxSend');
  $('#osxFab').addEventListener('click', () => { $('#osxChat').classList.add('open'); startChat(); prompt.focus(); });
  $('#osxClose').addEventListener('click', () => $('#osxChat').classList.remove('open'));
  $('#osxReset').addEventListener('click', startChat);
  sendBtn.addEventListener('click', submitPrompt);
  prompt.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitPrompt(); });

  document.addEventListener('click', (e) => {
    const open = $('#osxChat').classList.contains('open');
    if (open && !e.target.closest('#osxChat') && !e.target.closest('#osxFab')) $('#osxChat').classList.remove('open');
  });

  function submitPrompt(){
    const v = prompt.value.trim();
    if (!v) return;
    prompt.value = '';
    ask(v);
  }

  // Expose simple API
  window.OsxWidget = {
    open(){ $('#osxChat').classList.add('open'); startChat(); $('#osxPrompt').focus(); },
    reset: startChat
  };
})();
