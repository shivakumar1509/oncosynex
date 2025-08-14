// /oncosynex/assets/osx_widget.js
(function () {
  // -------------------------
  // Sizing knobs (edit here)
  // -------------------------
  // ≈ +1/2 inch ≈ +48 px
  const PANEL_WIDTH_PX  = 388;  // was ~340; +48px wider
  const PANEL_HEIGHT_PX = 468;  // was ~420; +48px taller

  // Height for the scrolling chat area (tweak if you change header sizes)
  const LOG_MAX_HEIGHT_PX = 300;

  // Typewriter speed (milliseconds per character)
  const TYPE_SPEED_MS = 15;

  // Popular question IDs (must exist in OSX_QA)
  const POPULAR_IDS = ['gen-01', 'supp-01', 'pr-01'];

  // Cartoon asset (change if you use PNG/WEBP)
  const CARTOON_URL = "/oncosynex/assets/assistant-lady.svg";

  // -------------------------
  // Inject CSS that overrides earlier styles
  // -------------------------
  const CSS = `
    #osx-widget {
      position: fixed;
      bottom: 16px;
      right: max(16px, calc((100vw - min(var(--max), 100% - 2*var(--edge)))/2));
      z-index: 9999;
    }

    /* FAB */
    .osx-fab {
      border: 0; border-radius: 999px; padding: 10px 14px;
      background: var(--btn, #1e64ff); color: var(--btn-ink, #fff);
      box-shadow: var(--shadow-soft, 0 6px 16px rgba(0,0,0,.25));
      font-weight: 800; cursor: pointer; font-size: 0.95rem;
    }
    .osx-fab:hover { transform: translateY(-1px); }

    /* PANEL (fixed size, no expand animation) */
    .osx-panel {
      position: fixed; bottom: 70px; right: 16px;
      width: ${PANEL_WIDTH_PX}px; height: ${PANEL_HEIGHT_PX}px;
      max-width: calc(100vw - 32px); max-height: calc(100vh - 120px);
      background: var(--panel, #fff); color: #0b1b3a;
      border: 1px solid #e6ebf4; border-radius: 16px;
      box-shadow: var(--shadow, 0 10px 28px rgba(0,0,0,.35));
      display: none; overflow: hidden;
    }
    .osx-panel.open { display: block; }

    .osx-panel-head {
      display:flex; align-items:center; justify-content:space-between;
      padding: 12px 14px; background: var(--bg, #0f2d6b); color:#fff;
    }
    .osx-close { background: transparent; border: 0; color: #fff; font-size: 20px; cursor: pointer; }

    /* Hero row with cartoon and welcome */
    .osx-panel-hero{
      display:flex; align-items:center; gap:14px;
      padding:12px 14px; background:#f6f9ff; border-bottom:1px solid #e6ebf4;
    }
    .osx-illustration{
      width:72px; height:72px; border-radius:999px; flex:0 0 72px;
      background:#fff center/80% no-repeat;
      background-image:url("${CARTOON_URL}");
      border:1px solid #e6ebf4; box-shadow:0 4px 10px rgba(0,0,0,.08);
    }
    .osx-welcome .osx-w1{ font-weight:800; font-size:1rem; color:#0b1b3a; }
    .osx-welcome .osx-w2{ font-size:.9rem; color:#395084; }

    /* Body: log + input area pinned to bottom */
    .osx-panel-body{
      display:grid; grid-template-rows: 1fr auto; gap:10px;
      height: calc(100% - 120px); /* subtract head+hero approx */
      padding: 10px 12px 12px
