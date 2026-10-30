// GIP++ menu. Its own window (button next to your name, or Ctrl+Shift+G). It does not add anything to Yappin's Settings.
// Built from Yappin's own classes and the page's own colours so it looks like part of the app.
// Everything from GIP++ carries a GIP++ tag; everything inherited from Yap++ carries a Yap++ tag.
(function () {
  if (window.__gipmenuinstalled) return;
  window.__gipmenuinstalled = true;
  const navid = 'gip-nav-button', panelid = 'gip-panel';
  const Y = window.YapPlus;

  const style = document.createElement('style');
  style.id = 'gip-menu-style';
  style.textContent = `
    #${navid}{display:flex;align-items:center;gap:8px}
    #${navid} svg{width:18px;height:18px;flex:0 0 18px}
    #${panelid}{padding:28px 40px;line-height:1.5;max-width:760px}
    #${panelid} h1{margin:0 0 4px;font-size:22px;display:flex;align-items:center;gap:10px}
    #${panelid} .gp-sub{opacity:.7;margin:0 0 16px;font-size:13px}
    #${panelid} .gp-tabs{display:flex;flex-wrap:wrap;gap:2px 6px;margin:0 0 18px;border-bottom:1px solid color-mix(in srgb,currentColor 16%,transparent)}
    #${panelid} .gp-tab{flex:0 0 auto;white-space:nowrap;background:none;border:0;border-bottom:2px solid transparent;color:inherit;opacity:.65;padding:8px 12px;cursor:pointer;font:inherit;font-weight:600}
    #${panelid} .gp-tab:hover{opacity:1}
    #${panelid} .gp-tab.on{opacity:1;border-bottom-color:currentColor}
    #${panelid} .gp-group{margin:0 0 26px}
    #${panelid} .gp-group h3{font-size:12px;text-transform:uppercase;letter-spacing:.06em;opacity:.65;margin:0 0 6px;display:flex;align-items:center;gap:8px}
    #${panelid} .gp-group .gp-note{font-size:12px;opacity:.6;margin:0 0 8px}
    #${panelid} .gp-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid color-mix(in srgb,currentColor 10%,transparent)}
    #${panelid} .gp-row:last-child{border-bottom:0}
    #${panelid} .gp-name{font-weight:600;display:flex;align-items:center;flex-wrap:wrap}
    #${panelid} .gp-desc{font-size:12px;opacity:.65;margin-top:2px}
    #${panelid} .gp-sw{position:relative;display:inline-block;width:40px;height:22px;flex:0 0 40px}
    #${panelid} .gp-sw input{opacity:0;width:0;height:0;position:absolute}
    #${panelid} .gp-sw span{position:absolute;inset:0;border-radius:22px;background:color-mix(in srgb,currentColor 25%,transparent);transition:background .15s;cursor:pointer}
    #${panelid} .gp-sw span::before{content:"";position:absolute;width:16px;height:16px;left:3px;top:3px;border-radius:50%;background:var(--gip-sw-knob,#fff);transition:transform .15s}
    #${panelid} .gp-sw input:checked + span{background:var(--accent,var(--gip-inv-bg,#6b8afd))}
    #${panelid} .gp-sw input:checked + span::before{transform:translateX(18px)}
    #${panelid} .gp-sw input:focus-visible + span{outline:2px solid currentColor;outline-offset:2px}
    #${panelid} .gp-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}
    #${panelid} .gp-chip{padding:4px 9px;border-radius:7px;font-size:12px;cursor:pointer;border:1px solid color-mix(in srgb,currentColor 25%,transparent);opacity:.6;background:none;color:inherit}
    #${panelid} .gp-chip.on{opacity:1;border-color:currentColor}
    #${panelid} .gp-line{display:flex;gap:8px;align-items:center;margin:6px 0}
    #${panelid} .gp-line .input{flex:1}
    #${panelid} .gp-links{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0 0 16px;font-size:13px}
    #${panelid} .gp-ver{font-size:12px;opacity:.6}
    #${panelid} .gp-credit{padding:12px 14px;border-radius:10px;border:1px solid color-mix(in srgb,currentColor 20%,transparent);margin:0 0 18px}
    #${panelid} .gp-credit b{font-size:14px}

    #${panelid} .gp-trow{display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid color-mix(in srgb,currentColor 10%,transparent)}
    #${panelid} .gp-trow:last-child{border-bottom:0}
    #${panelid} .gp-trow .gp-main{flex:1;min-width:0}
    #${panelid} .gp-thumb{cursor:pointer}
    #${panelid} .gp-x{background:none;border:1px solid color-mix(in srgb,currentColor 25%,transparent);color:inherit;border-radius:6px;padding:2px 8px;cursor:pointer;opacity:.7;font:inherit;font-size:12px}
    #${panelid} .gp-x:hover{opacity:1}
    #${panelid} input.gp-hue{-webkit-appearance:none;appearance:none;height:12px;border-radius:99px;border:0 !important;padding:0;flex:1;background:linear-gradient(90deg,hsl(0 90% 55%),hsl(60 90% 52%),hsl(120 80% 48%),hsl(180 85% 48%),hsl(240 90% 62%),hsl(300 85% 58%),hsl(360 90% 55%)) !important;box-shadow:inset 0 1px 3px rgba(0,0,0,.35) !important}
    #${panelid} input.gp-hue::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#fff;border:2px solid #222;box-shadow:0 1px 5px rgba(0,0,0,.5)}
    #${panelid} input.gp-hue:disabled{opacity:.35}
    #${panelid} textarea.gp-code{width:100%;font-family:monospace;font-size:12px;resize:vertical;min-height:90px}
    #${panelid} .gp-status{font-size:12px;opacity:.8;margin-top:4px;min-height:16px}
    #${panelid} .gp-mark{background:rgba(255,214,64,.4);color:inherit;border-radius:2px}
    #${panelid} .gp-res{padding:8px 0;border-bottom:1px solid color-mix(in srgb,currentColor 10%,transparent)}
    #${panelid} .gp-res .gp-meta{font-size:11px;opacity:.6}
    #${panelid} .gp-warn{font-size:12px;padding:8px 10px;border-radius:8px;border:1px solid color-mix(in srgb,currentColor 25%,transparent);margin:0 0 12px}
    #${panelid} a{text-decoration:underline}

    /* ---- readable layout (v2.2): sidebar + content ---- */
    #${panelid}{max-width:1000px;padding:24px 32px 40px;font-size:14px}
    #${panelid} h1{font-size:24px}
    #${panelid} .gp-layout{display:grid;grid-template-columns:176px minmax(0,1fr);gap:30px;align-items:start}
    #${panelid} .gp-side{position:sticky;top:0;display:flex;flex-direction:column;gap:2px}
    #${panelid} .gp-side h4{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.55;margin:16px 10px 4px}
    #${panelid} .gp-side h4:first-child{margin-top:0}
    #${panelid} .gp-side .gp-tab{display:block;width:100%;text-align:left;border:0;border-radius:8px;padding:9px 10px;margin:0;opacity:.8;font-weight:500;font-size:14px}
    #${panelid} .gp-side .gp-tab:hover{opacity:1;background:color-mix(in srgb,currentColor 8%,transparent)}
    #${panelid} .gp-side .gp-tab.on{opacity:1;font-weight:700;background:color-mix(in srgb,currentColor 15%,transparent)}
    #${panelid} .gp-content{min-width:0}
    #${panelid} .gp-head{margin:0 0 20px}
    #${panelid} .gp-head h2{margin:0 0 4px;font-size:21px}
    #${panelid} .gp-head p{margin:0;font-size:14px;opacity:.75}
    #${panelid} .gp-group{margin:0 0 30px}
    #${panelid} .gp-group h3{font-size:15px;font-weight:700;text-transform:none;letter-spacing:0;opacity:1;margin:0 0 4px}
    #${panelid} .gp-group .gp-note{font-size:13px;opacity:.72;margin:0 0 8px}
    #${panelid} .gp-row{padding:12px 0}
    #${panelid} .gp-row.gp-click{cursor:pointer}
    #${panelid} .gp-name{font-size:14px}
    #${panelid} .gp-desc{font-size:13px;opacity:.75;line-height:1.4;margin-top:3px}
    #${panelid} .gp-sub-row{margin-left:16px;padding-left:14px;border-left:2px solid color-mix(in srgb,currentColor 18%,transparent)}
    #${panelid} .gp-dim{opacity:.45}
    #${panelid} .gp-count{font-size:13px;opacity:.75;margin:8px 2px 18px}
    #${panelid} .gp-chip{opacity:.75;font-size:13px;padding:5px 10px}
    #${panelid} .gp-chip.on{opacity:1}
    #${panelid} .gp-links{font-size:13px;margin:0 0 20px}
    @media (max-width:720px){
      #${panelid}{padding:18px 16px 32px}
      #${panelid} .gp-layout{grid-template-columns:1fr;gap:16px}
      #${panelid} .gp-side{position:static;flex-direction:row;flex-wrap:wrap;gap:4px}
      #${panelid} .gp-side h4{display:none}
      #${panelid} .gp-side .gp-tab{width:auto}
    }

    /* ============ v3.3 window layout. Geometry is !important because Yappin's own .modal / button / heading rules must not squeeze it. ============ */
    #gip-menu-ov{position:fixed !important;inset:0 !important;z-index:2147482000;display:flex !important;align-items:center;justify-content:center;background:rgba(6,7,10,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);padding:3vh 3vw !important;box-sizing:border-box}
    #gip-menu-ov .gip-menu-win{position:relative !important;display:flex !important;flex-direction:column !important;gap:0 !important;width:min(1180px,100%) !important;max-width:none !important;min-width:0 !important;height:min(820px,100%) !important;max-height:100% !important;min-height:0 !important;margin:0 !important;padding:0 !important;overflow:hidden !important;border-radius:18px !important;box-shadow:0 30px 90px rgba(0,0,0,.6),0 0 0 1px color-mix(in srgb,currentColor 12%,transparent) !important;transform:none !important}
    #gip-menu-ov .gip-menu-win.gip-fill{background:var(--gip-win-bg,Canvas) !important}
    #gip-menu-ov #${panelid}{box-sizing:border-box;padding:0 !important;margin:0 !important;max-width:none !important;width:100% !important;flex:1 1 auto;min-height:0;display:flex !important;flex-direction:column;font-size:15px;line-height:1.5;color:inherit}
    #${panelid} *,#${panelid} *::before,#${panelid} *::after{box-sizing:border-box}
    #${panelid} button{height:auto;min-height:0;line-height:inherit;font-family:inherit}
    #${panelid} h2,#${panelid} h3,#${panelid} p{margin:0;padding:0;line-height:1.35}

    /* header */
    #${panelid} .gip-top{display:flex;align-items:center;gap:14px;padding:18px 26px;flex:0 0 auto;border-bottom:1px solid color-mix(in srgb,currentColor 12%,transparent);background:linear-gradient(180deg,color-mix(in srgb,currentColor 5%,transparent),transparent)}
    #${panelid} .gip-logo{display:flex;align-items:center;justify-content:center;width:38px;height:38px;flex:0 0 38px;border-radius:11px;background:var(--accent,var(--gip-inv-bg,#6b8afd));color:var(--gip-inv-fg,#fff)}
    #${panelid} .gip-logo svg{width:22px;height:22px}
    #${panelid} .gip-title{display:flex;flex-direction:column;gap:1px;margin-right:auto;min-width:0}
    #${panelid} .gip-title b{font-size:19px;letter-spacing:.01em;line-height:1.2}
    #${panelid} .gip-title span{font-size:12px;opacity:.6}
    #${panelid} .gip-x{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;flex:0 0 36px;padding:0;border-radius:10px;border:0;background:none;color:inherit;cursor:pointer;opacity:.7;font-size:24px;line-height:1}
    #${panelid} .gip-x:hover{opacity:1;background:color-mix(in srgb,currentColor 12%,transparent)}

    /* body: sidebar + content */
    #${panelid} .gp-layout{flex:1 1 auto;min-height:0;display:grid !important;grid-template-columns:236px minmax(0,1fr) !important;gap:0 !important;align-items:stretch}
    #${panelid} .gp-side{display:flex !important;flex-direction:column;gap:4px;padding:18px 14px !important;margin:0;position:static !important;overflow-y:auto;border-right:1px solid color-mix(in srgb,currentColor 12%,transparent);background:color-mix(in srgb,currentColor 3%,transparent);min-height:0}
    #${panelid} .gp-side .gp-tab{flex:0 0 auto !important;display:flex !important;align-items:center;gap:12px;width:100% !important;margin:0 !important;padding:12px 14px !important;border:0;border-radius:11px;background:none;color:inherit;font-size:15px;font-weight:500;text-align:left;cursor:pointer;opacity:.78;position:relative}
    #${panelid} .gp-side .gp-tab svg{width:20px;height:20px;flex:0 0 20px;opacity:.9}
    #${panelid} .gp-side .gp-tab:hover{opacity:1;background:color-mix(in srgb,currentColor 8%,transparent)}
    #${panelid} .gp-side .gp-tab.on{opacity:1;font-weight:700;background:color-mix(in srgb,var(--accent,var(--gip-inv-bg,#6b8afd)) 22%,transparent)}
    #${panelid} .gp-side .gp-tab.on::before{content:"";position:absolute;left:-14px;top:9px;bottom:9px;width:4px;border-radius:0 4px 4px 0;background:var(--accent,var(--gip-inv-bg,#6b8afd))}
    #${panelid} .gp-side .gp-sep{flex:1 1 auto;min-height:12px}
    #${panelid} .gp-content.gip-scroll{overflow-y:auto;padding:28px 36px 44px !important;min-width:0;min-height:0}
    #${panelid} .gp-head{margin:0 0 22px !important}
    #${panelid} .gp-head h2{font-size:24px;font-weight:700;margin:0 0 6px}
    #${panelid} .gp-head p{font-size:14px;opacity:.7}
    #${panelid} .gp-group{margin:0 0 26px}
    #${panelid} .gp-group h3{font-size:15px;font-weight:700;margin:0 0 4px}
    #${panelid} .gp-note{font-size:13px;opacity:.7;margin:0 0 10px;line-height:1.45}

    /* rows, switches, controls */
    #${panelid} .gp-row{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:14px 0;border-bottom:1px solid color-mix(in srgb,currentColor 9%,transparent)}
    #${panelid} .gp-row:last-child{border-bottom:0}
    #${panelid} .gp-name{font-size:15px;font-weight:600;display:flex;align-items:center;flex-wrap:wrap;gap:2px 0}
    #${panelid} .gp-desc{font-size:13px;opacity:.7;line-height:1.5;margin-top:3px}
    #${panelid} .gp-sw{width:46px;height:26px;flex:0 0 46px}
    #${panelid} .gp-sw span{border-radius:26px}
    #${panelid} .gp-sw span::before{width:20px;height:20px;left:3px;top:3px}
    #${panelid} .gp-sw input:checked + span::before{transform:translateX(20px)}
    #${panelid} input.input,#${panelid} select.input,#${panelid} textarea.input{padding:9px 12px;border-radius:10px;border:1px solid color-mix(in srgb,currentColor 22%,transparent);background:color-mix(in srgb,currentColor 5%,transparent);color:inherit;font:inherit;font-size:14px;min-height:38px;outline:0}
    #${panelid} input.input:focus,#${panelid} select.input:focus,#${panelid} textarea.input:focus{border-color:var(--accent,var(--gip-inv-bg,#6b8afd))}
    #${panelid} .btn{padding:8px 14px;border-radius:10px;min-height:36px;font-size:14px}
    #${panelid} .gp-line{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:8px 0}
    #${panelid} .gp-chips{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 12px}
    #${panelid} .gp-chip{padding:6px 13px;border-radius:99px;font-size:13px;opacity:.8;border:1px solid color-mix(in srgb,currentColor 25%,transparent);background:none;color:inherit;cursor:pointer}
    #${panelid} .gp-chip.on{opacity:1;background:color-mix(in srgb,var(--accent,var(--gip-inv-bg,#6b8afd)) 25%,transparent);border-color:var(--accent,var(--gip-inv-bg,#6b8afd))}
    #${panelid} .gp-count{font-size:13px;opacity:.7;margin:10px 2px 4px}
    #${panelid} .gp-trow{padding:12px 0}
    #${panelid} .gip-tag{font-size:9px !important;line-height:1.5 !important;padding:1px 6px;margin-left:8px;opacity:.85}

    /* features page */
    #${panelid} .gip-bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:0 0 4px}
    #${panelid} .gip-bar .input{flex:1 1 220px;min-width:0}
    #${panelid} .gip-bar .gp-chips{margin:0;flex:0 0 auto}
    #${panelid} .gip-cat{display:flex;align-items:center;gap:10px;width:100%;background:none;border:0;color:inherit;cursor:pointer;padding:6px 4px;margin:20px 0 8px;text-align:left}
    #${panelid} .gip-cat b{font-size:12px;text-transform:uppercase;letter-spacing:.09em;opacity:.65}
    #${panelid} .gip-cat .gp-ver{margin-left:auto;font-size:12px;opacity:.55}
    #${panelid} .gip-card{border:1px solid color-mix(in srgb,currentColor 13%,transparent);border-radius:14px;padding:2px 20px;background:color-mix(in srgb,currentColor 4%,transparent);box-shadow:0 1px 2px rgba(0,0,0,.15)}
    #${panelid} .gip-main{min-width:0;flex:1 1 auto}
    #${panelid} .gip-ctl{display:flex;align-items:center;gap:14px;flex:0 0 auto}
    #${panelid} .gip-opt-btn{background:none;border:1px solid color-mix(in srgb,currentColor 25%,transparent);color:inherit;border-radius:9px;padding:5px 12px;font-size:13px;cursor:pointer;opacity:.8}
    #${panelid} .gip-opt-btn:hover,#${panelid} .gip-opt-btn[aria-expanded="true"]{opacity:1;background:color-mix(in srgb,currentColor 10%,transparent)}
    #${panelid} .gip-opts{margin:0 0 12px;padding:2px 14px;border-radius:11px;background:color-mix(in srgb,currentColor 5%,transparent)}
    #${panelid} .gip-opts .gp-row{padding:11px 0}
    #${panelid} .gp-sub-row{margin:0;padding-left:0;border-left:0}
    #${panelid} .gp-dim{opacity:.45}

    /* collapsible sections */
    #${panelid} .gip-sec{border:1px solid color-mix(in srgb,currentColor 13%,transparent);border-radius:14px;margin:0 0 12px;overflow:hidden;background:color-mix(in srgb,currentColor 4%,transparent);box-shadow:0 1px 2px rgba(0,0,0,.15)}
    #${panelid} .gip-sec.open{background:color-mix(in srgb,currentColor 2%,transparent)}
    #${panelid} .gip-sec-h{display:flex;align-items:center;gap:14px;width:100%;padding:16px 20px;background:none;border:0;color:inherit;text-align:left;cursor:pointer}
    #${panelid} .gip-sec-h:hover{background:color-mix(in srgb,currentColor 6%,transparent)}
    #${panelid} .gip-sec-t{font-weight:700;font-size:16px}
    #${panelid} .gip-sec-d{font-size:13px;opacity:.68;margin-top:2px;line-height:1.4}
    #${panelid} .gip-chev{margin-left:auto;flex:0 0 18px;width:18px;height:18px;opacity:.6;transition:transform .15s}
    #${panelid} .gip-chev svg{width:18px;height:18px;display:block}
    #${panelid} .gip-sec.open .gip-chev{transform:rotate(90deg)}
    #${panelid} .gip-sec-body{display:none;padding:12px 20px 20px;border-top:1px solid color-mix(in srgb,currentColor 11%,transparent)}
    #${panelid} .gip-sec.open .gip-sec-body{display:block}
    #${panelid} .gip-sec-body .gp-group:first-child:last-child > h3{display:none}
    #${panelid} .gip-sec-body .gp-group:last-child{margin-bottom:0}

    /* the open button */
    .gip-menu-btn{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border-radius:9px;border:0;background:none;color:inherit;opacity:.75;cursor:pointer}
    .gip-menu-btn:hover{opacity:1;background:color-mix(in srgb,currentColor 12%,transparent)}
    .gip-menu-btn svg{width:19px;height:19px}
    .gip-menu-btn.in-bar{margin-left:4px}
    .gip-menu-btn.floating{position:fixed;left:12px;bottom:12px;z-index:2147481000;width:40px;height:40px;border-radius:50%;border:1px solid color-mix(in srgb,currentColor 28%,transparent);background:color-mix(in srgb,Canvas 82%,transparent);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:.9}

    @media (max-width:820px){
      #gip-menu-ov{padding:0 !important}
      #gip-menu-ov .gip-menu-win{border-radius:0 !important;height:100% !important;width:100% !important}
      #${panelid} .gp-layout{grid-template-columns:1fr !important;grid-template-rows:auto minmax(0,1fr)}
      #${panelid} .gp-side{flex-direction:row;overflow-x:auto;overflow-y:hidden;border-right:0;border-bottom:1px solid color-mix(in srgb,currentColor 12%,transparent);padding:10px !important}
      #${panelid} .gp-side .gp-tab{width:auto !important;white-space:nowrap;padding:9px 13px !important}
      #${panelid} .gp-side .gp-tab.on::before,#${panelid} .gp-side .gp-sep{display:none}
      #${panelid} .gp-content.gip-scroll{padding:20px 16px 32px !important}
    }
  `;
  document.head.appendChild(style);

  const ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/><path d="M4 4l3 3M20 4l-3 3M4 20l3-3M20 20l-3-3"/></svg>';
  const el = (tag, props, ...kids) => {
    const n = document.createElement(tag);
    if (props) Object.keys(props).forEach(k => { if (k === 'class') n.className = props[k]; else if (k === 'text') n.textContent = props[k]; else if (k.startsWith('on')) n.addEventListener(k.slice(2), props[k]); else n.setAttribute(k, props[k]); });
    kids.forEach(k => k != null && n.append(k));
    return n;
  };
  const sw = (checked, onchange) => { const i = el('input', { type: 'checkbox' }); i.checked = checked; i.addEventListener('change', () => onchange(i.checked)); return el('label', { class: 'gp-sw' }, i, el('span')); };
  const group = (title, origin, note) => {
    const g = el('div', { class: 'gp-group' }, el('h3', null, title, origin ? Y.tag(origin) : null));
    if (note) g.appendChild(el('div', { class: 'gp-note', text: note }));
    return g;
  };

  Y.ui = { el, sw, group };

  // Which section each feature is listed under. Anything not listed goes under "Other".
  const CATS = [['chat', 'Chat and messages'], ['voice', 'Voice'], ['nav', 'Servers and navigation'], ['look', 'Look and feel'], ['acct', 'Accounts and privacy'], ['fun', 'Fun'], ['other', 'Other']];
  const CAT_OF = {
    giptextcursor: 'chat', doubleclickreply: 'chat', charactercounter: 'chat', draftsaved: 'chat', notyping: 'chat', gipgifs: 'chat', imagesearch: 'chat', filenamedisguiser: 'chat', gipsearch: 'chat',
    gipvolume: 'voice', gipstreamaudio: 'voice', giphifimic: 'voice', customvoice: 'voice', gipvoice: 'voice', gipsounds: 'voice',
    gipnav: 'nav', gipreadall: 'nav', gipfolders: 'nav', gipserverinfo: 'nav',
    gipfx: 'look', gipprofileguard: 'look', gipbrand: 'look', custombackground: 'look',
    gipalts: 'acct', gipcounter: 'acct', gipnopopups: 'look',
    oneko: 'fun',
    gipwordfilter: 'chat', gipnicknames: 'chat', giplinkpreview: 'chat', gipcodeblocks: 'chat', gipdownloads: 'chat', gipemojidl: 'chat', gipemojitext: 'chat',
    gipimageblur: 'acct', gipvisualizer: 'voice',
  };
  function tabPlugins() {
    const root = el('div');
    let filter = 'all'; const openOpts = new Set(); const shut = new Set();
    const search = el('input', { class: 'input', placeholder: 'Search features\u2026', style: 'flex:1;min-width:180px', 'aria-label': 'Search features' });
    const chips = el('div', { class: 'gp-chips', style: 'margin:0' });
    [['all', 'All'], ['on', 'On'], ['off', 'Off']].forEach(([v, l]) => {
      const c = el('button', { class: 'gp-chip' + (v === 'all' ? ' on' : ''), type: 'button', text: l });
      c.addEventListener('click', () => { filter = v; chips.querySelectorAll('.gp-chip').forEach(x => x.classList.toggle('on', x === c)); draw(); });
      chips.appendChild(c);
    });
    const count = el('div', { class: 'gp-count', style: 'margin:4px 2px 0' }); const list = el('div');
    root.append(el('div', { class: 'gip-bar' }, search, chips), count, list);
    const draw = () => {
      const sc = root.closest('.gip-scroll'); const keep = sc ? sc.scrollTop : 0;
      const q = search.value.trim().toLowerCase(); list.innerHTML = '';
      const all = Y.PluginHost.all(); const on = all.filter(p => Y.PluginHost.isEnabled(p)).length;
      count.textContent = on + ' of ' + all.length + ' features on. Click a feature to switch it.';
      const filtering = !!q || filter !== 'all'; let shown = 0;
      CATS.forEach(([cid, title]) => {
        const inCat = all.filter(p => (CAT_OF[p.id] || 'other') === cid);
        const ps = inCat.filter(p => (!q || (p.name + ' ' + (p.description || '')).toLowerCase().includes(q)) && (filter === 'all' || (filter === 'on') === Y.PluginHost.isEnabled(p)));
        if (!ps.length) return; shown += ps.length;
        const closed = !filtering && shut.has(cid);
        const hd = el('button', { class: 'gip-cat', type: 'button', 'aria-expanded': String(!closed) }, el('b', { text: title }), el('span', { class: 'gp-ver', text: inCat.filter(p => Y.PluginHost.isEnabled(p)).length + ' of ' + inCat.length + ' on' }));
        hd.addEventListener('click', () => { if (shut.has(cid)) shut.delete(cid); else shut.add(cid); draw(); });
        list.appendChild(hd); if (closed) return;
        const card = el('div', { class: 'gip-card' }); list.appendChild(card);
        ps.forEach(p => {
          const enabled = Y.PluginHost.isEnabled(p); const swl = sw(enabled, (v) => { Y.PluginHost.setEnabled(p, v); draw(); });
          const opts = p.options || []; const isOpen = openOpts.has(p.id);
          const ob = opts.length ? el('button', { class: 'gip-opt-btn', type: 'button', 'aria-expanded': String(isOpen), text: 'Options' }) : null;
          if (ob) ob.addEventListener('click', (e) => { e.stopPropagation(); if (openOpts.has(p.id)) openOpts.delete(p.id); else openOpts.add(p.id); draw(); });
          const row = el('div', { class: 'gp-row gp-click' }, el('div', { class: 'gip-main' }, el('div', { class: 'gp-name' }, p.name, Y.tag(p.origin)), el('div', { class: 'gp-desc', text: p.description || '' })), el('div', { class: 'gip-ctl' }, ob, swl));
          row.addEventListener('click', (e) => { if (e.target.closest('.gp-sw, .gip-opt-btn')) return; swl.querySelector('input').click(); });
          card.appendChild(row);
          if (opts.length && isOpen) {
            const box = el('div', { class: 'gip-opts' }); if (!enabled) box.classList.add('gp-dim');
            opts.forEach(o => { const r = optionRow(p, o); r.classList.add('gp-sub-row'); box.appendChild(r); });
            card.appendChild(box);
          }
        });
      });
      if (!shown) list.appendChild(el('div', { class: 'gp-desc', style: 'margin-top:14px', text: 'No features match.' }));
      if (sc) sc.scrollTop = keep;
    };
    search.addEventListener('input', draw); draw();
    return root;
  }

  function optionRow(p, o) {
    const cur = Y.opt(p.id, o.key, o.dflt); let ctl;
    if (o.type === 'toggle') ctl = sw(cur, (v) => Y.setOpt(p.id, o.key, v));
    else if (o.type === 'select') {
      ctl = el('select', { class: 'input', style: 'width:auto' });
      o.choices.forEach(([v, l]) => { const op = el('option', { value: v, text: l }); if (v === cur) op.selected = true; ctl.appendChild(op); });
      ctl.addEventListener('change', () => Y.setOpt(p.id, o.key, ctl.value));
    }
    return el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name' }, o.label, Y.tag(p.origin)), o.desc ? el('div', { class: 'gp-desc', text: o.desc }) : null), ctl);
  }
  function tabSettingsParts() {
    const parts = {};

    const us = group('Updates', 'yap');
    const btn = el('button', { class: 'btn', text: 'Look for updates' }); const status = el('span', { class: 'gp-ver' });
    btn.addEventListener('click', async () => {
      btn.disabled = true; status.textContent = 'Checking\u2026';
      try {
        const r = await window.electronAPI.update();
        if (r.success) {
          if (r.count > 0) { status.textContent = `Updated ${r.count} file(s). Restart to apply.`; btn.textContent = 'Restart'; btn.disabled = false; btn.onclick = () => window.electronAPI.restartApp(); return; }
          status.textContent = 'Everything is up to date.';
        } else status.textContent = r.error || 'Updates are off for this edition.';
      } catch (e) { status.textContent = 'Could not reach the updater.'; }
      btn.disabled = false;
    });
    us.appendChild(el('div', { class: 'gp-line' }, btn, status));
    const autoRow = el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name' }, 'Update automatically', Y.tag('gip')), el('div', { class: 'gp-desc', text: 'Checks for updates when GIP++ opens and every few hours. May restart once on launch to apply an update.' })));
    (async () => { try { autoRow.append(sw(await window.electronAPI.getAutoUpdate(), (v) => window.electronAPI.setAutoUpdate(v))); } catch (e) {} })();
    us.appendChild(autoRow); parts.us = us;

    const ae = group('Text shortcut', 'yap', 'Type the shortcut in chat and it is replaced with your text. Example: /shrug becomes a shrug emoticon.');
    const cmd = el('input', { class: 'input', placeholder: 'Shortcut, for example /shrug', autocomplete: 'off' });
    const txt = el('input', { class: 'input', placeholder: 'Replace it with\u2026', autocomplete: 'off' });
    try { cmd.value = localStorage.getItem('yapplus.autoedit.cmd') || ''; txt.value = localStorage.getItem('yapplus.autoedit.text') || ''; } catch (e) {}
    cmd.addEventListener('input', () => { try { localStorage.setItem('yapplus.autoedit.cmd', cmd.value); } catch (e) {} });
    txt.addEventListener('input', () => { try { localStorage.setItem('yapplus.autoedit.text', txt.value); } catch (e) {} });
    ae.append(el('div', { class: 'gp-line' }, cmd), el('div', { class: 'gp-line' }, txt)); parts.ae = ae;

    const rs = group('Troubleshooting', 'gip', 'If something breaks, put GIP++ back to how it was on a fresh install. This only touches data GIP++ stores on this computer. Your Yappin login and your messages are never touched.');
    const KEEP = /^(gip\.(gifs|folders|voicepresets|customThemes)|yapplus\.gipvol)/;
    const wipe = (everything) => {
      try {
        Object.keys(localStorage).forEach(k => { if (/^(yapplus\.|gip\.)/.test(k) && (everything || !KEEP.test(k))) localStorage.removeItem(k); });
        if (everything) { try { indexedDB.deleteDatabase('gip-search'); } catch (e) {} }
        document.documentElement.style.removeProperty('--gip-h');
      } catch (e) { console.error('[GIP++] reset failed', e); }
      Y.toast('GIP++ was reset. Reloading\u2026', 1500); setTimeout(() => location.reload(), 900);
    };
    const r1 = el('button', { class: 'btn', text: 'Reset GIP++ settings\u2026' });
    r1.addEventListener('click', () => Y.confirm('Reset GIP++ settings?', 'Plugin switches, theme, accent, sounds and other options go back to defaults. Your GIF favorites, folder icons, voice settings and imported themes are kept. The app reloads.', 'Reset', () => wipe(false)));
    const r2 = el('button', { class: 'btn', text: 'Erase all GIP++ data\u2026' });
    r2.addEventListener('click', () => Y.confirm('Erase all GIP++ data?', 'This also deletes your GIF favorites, folder icons, voice volume and direction settings, imported themes and the message search index. It cannot be undone. The app reloads.', 'Erase everything', () => wipe(true)));
    rs.append(el('div', { class: 'gp-line' }, r1, r2)); parts.rs = rs;

    const alltypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'text/plain'];
    const fd = group('Anonymised filenames', 'yap', 'Pick which kinds of files get a random name when you upload them.');
    const chips = el('div', { class: 'gp-chips' });
    const custom = el('input', { class: 'input', placeholder: 'example: image/bmp', autocomplete: 'off' });
    const add = el('button', { class: 'btn', text: 'Add type' });
    const types = () => window.filenamedisguiser ? window.filenamedisguiser.getEnabledTypes() : [];
    const setTypes = (a) => { if (window.filenamedisguiser) window.filenamedisguiser.setEnabledTypes(a); };
    const drawChips = () => {
      chips.innerHTML = ''; const on = types();
      alltypes.concat(on.filter(t => !alltypes.includes(t))).forEach(t => {
        const c = el('button', { class: 'gp-chip' + (on.includes(t) ? ' on' : ''), text: t });
        c.addEventListener('click', () => { const cur = types(); setTypes(cur.includes(t) ? cur.filter(x => x !== t) : cur.concat([t])); drawChips(); });
        chips.appendChild(c);
      });
    };
    add.addEventListener('click', () => { const v = custom.value.trim().toLowerCase(); if (!v || !v.includes('/')) return; const cur = types(); if (!cur.includes(v)) setTypes(cur.concat([v])); custom.value = ''; drawChips(); });
    drawChips(); fd.append(chips, el('div', { class: 'gp-line' }, custom, add)); parts.fd = fd;

    const cb = group('Custom background', 'yap', 'Paste a direct link to an image and choose how strong it is.');
    const url = el('input', { class: 'input', placeholder: 'https://example.com/image.png', autocomplete: 'off' });
    const op = el('input', { type: 'range', min: 0, max: 100, step: 1, style: 'flex:1' });
    const opv = el('span', { class: 'gp-ver', text: '50%' });
    const css = el('textarea', { class: 'input', rows: 7, placeholder: '.msg-author { color: hotpink !important; }', style: 'width:100%;font-family:monospace;resize:vertical' });
    if (window.custombackground) {
      const c = window.custombackground;
      url.value = c.getUrl(); op.value = String(Math.round(c.getOpacity() * 100)); opv.textContent = op.value + '%'; css.value = c.getThemeCss();
      url.addEventListener('input', () => c.setUrl(url.value));
      op.addEventListener('input', () => { c.setOpacity(parseInt(op.value, 10) / 100); opv.textContent = op.value + '%'; });
      css.addEventListener('input', () => c.setThemeCss(css.value));
    }
    cb.append(el('div', { class: 'gp-line' }, url), el('div', { class: 'gp-line' }, el('span', { class: 'gp-ver', text: 'Opacity' }), op, opv), el('div', { class: 'gp-note', text: 'Custom CSS' }), css);
    parts.cb = cb;
    return parts;
  }


  function tabAccounts() {
    const root = el('div');
    const g = group('Accounts', 'gip', 'Each account is its own window with its own login, so you can have several open at once. The colour frame and name tag tell them apart. Each account also keeps its own theme and plugin settings.');
    const list = el('div'); g.appendChild(list);
    const msg = el('div', { class: 'gp-ver' });
    const api = window.electronAPI;
    const draw = async () => {
      list.innerHTML = '';
      let profiles = []; let me = null;
      try { profiles = await api.altsList(); me = await api.altsSelf(); } catch (e) { list.textContent = 'Account manager is not available.'; return; }
      profiles.forEach(p => {
        const color = el('input', { type: 'color', value: p.color || '#808080', title: 'Colour', style: 'width:34px;height:26px;padding:0;border:0;background:none;cursor:pointer' });
        color.addEventListener('change', async () => { await api.altsSave({ id: p.id, name: p.name, color: color.value }); draw(); });
        const nm = el('div', null, el('div', { class: 'gp-name' }, p.name, me && me.id === p.id ? el('span', { class: 'gp-ver', style: 'margin-left:8px', text: 'this window' }) : null, p.id === 'default' ? el('span', { class: 'gp-ver', style: 'margin-left:8px', text: 'main' }) : null));
        const btns = el('div', { class: 'gp-line', style: 'margin:0' });
        if (!(me && me.id === p.id)) btns.append(el('button', { class: 'btn', text: p.open ? 'Show' : 'Open', onclick: () => api.altsOpen(p.id) }));
        btns.append(el('button', { class: 'btn', text: 'Rename', onclick: () => Y.prompt('Account name', p.name, async (v) => { await api.altsSave({ id: p.id, name: v, color: p.color }); draw(); }) }));
        if (p.id !== 'default') btns.append(el('button', { class: 'btn', text: 'Remove', onclick: () => Y.confirm('Remove ' + p.name + '?', 'This signs that account out and deletes its saved data in GIP++ (settings, theme, login). The account itself is not touched.', 'Remove', async () => { const r = await api.altsDelete(p.id); if (!r.success) msg.textContent = r.error || 'Could not remove'; draw(); }) }));
        list.appendChild(el('div', { class: 'gp-row' }, el('div', { style: 'display:flex;align-items:center;gap:12px' }, color, nm), btns));
      });
    };
    const name = el('input', { class: 'input', placeholder: 'New account name (example: Alt 1)', maxlength: 32, autocomplete: 'off' });
    const col = el('input', { type: 'color', value: '#6b8afd', style: 'width:34px;height:30px;padding:0;border:0;background:none;cursor:pointer' });
    const add = el('button', { class: 'btn', text: 'Add account' });
    add.addEventListener('click', async () => {
      const n = name.value.trim(); if (!n) { msg.textContent = 'Give it a name first.'; return; }
      const r = await api.altsNew(n, col.value);
      if (!r.success) { msg.textContent = r.error || 'Could not add'; return; }
      name.value = ''; msg.textContent = 'Added. Click Open to sign in to it.'; draw();
    });
    g.append(el('div', { class: 'gp-line' }, name, col, add), msg);
    root.appendChild(g); draw();
    return root;
  }

  const THUMB_BASE = `
    :host{display:block;width:128px;height:74px;flex:0 0 128px;overflow:hidden;border-radius:6px;contain:layout paint;position:relative;border:1px solid rgba(128,128,128,.45)}
    .mockwrap{width:720px;height:416px;transform:scale(.1778);transform-origin:0 0;position:absolute;left:0;top:0}
    .app{width:720px;height:416px;position:relative;display:flex;gap:8px;padding:8px;box-sizing:border-box;font:14px system-ui,sans-serif;overflow:hidden}
    .rail{width:52px;display:flex;flex-direction:column;gap:8px;padding:8px 0;align-items:center;box-sizing:border-box}
    .rail-item{width:34px;height:34px;border-radius:10px;border:0;background:#8aa;opacity:.85;padding:0}
    .sidebar{width:150px;display:flex;flex-direction:column;padding:10px 0;position:relative;box-sizing:border-box}
    .channel-item{padding:6px 10px;margin:1px 6px}
    .user-bar{margin:auto 6px 0;padding:8px}
    .main{flex:1;display:flex;flex-direction:column;min-width:0}
    .main-head{padding:10px 14px;font-weight:700}
    .messages{flex:1;padding:10px 14px;display:flex;flex-direction:column;gap:10px}
    .msg{padding:6px 8px}
    .composer-box{margin:8px 14px 12px;padding:8px}
    .composer-box textarea{width:100%;border:0;resize:none;outline:0;font:inherit;display:block}
    .side-panel{width:110px;padding:10px;box-sizing:border-box}
  `;
  const THUMB_HTML = '<div class="app"><nav class="rail"><button class="rail-item"></button><button class="rail-item"></button><button class="rail-item"></button></nav><aside class="sidebar"><div class="channel-item active"><span class="channel-name"># general</span></div><div class="channel-item"><span class="channel-name"># memes</span></div><div class="channel-item"><span class="channel-name"># dev</span></div><div class="user-bar"><span class="user-bar-name">You</span></div></aside><main class="main"><div class="main-head"><span class="channel-name"># general</span></div><div class="messages"><div class="msg"><b class="msg-author">Mika</b><div class="msg-text">Hello there</div></div><div class="msg mentioned"><b class="msg-author">Rook</b><div class="msg-text">Nice theme</div></div></div><div class="composer-box"><textarea rows="1" placeholder="Message"></textarea></div></main><aside class="side-panel"><div class="msg-text">Online</div></aside></div>';
  // A miniature of the app inside a shadow root, with the theme's CSS applied to it (:root becomes :host). Contained, so it cannot touch the real page.
  function themeThumb(css) {
    const host = el('div', { class: 'gp-thumb', 'aria-hidden': 'true' });
    try {
      const sh = host.attachShadow({ mode: 'open' });
      const st = document.createElement('style');
      st.textContent = THUMB_BASE + String(css || '').replace(/:root/g, ':host') + '\n.app::after{bottom:-96px !important;height:140px !important}';
      const wrap = document.createElement('div'); wrap.className = 'mockwrap'; wrap.innerHTML = THUMB_HTML;
      sh.append(st, wrap);
    } catch (e) { host.style.background = '#888'; }
    return host;
  }

  function tabThemes() {
    const root = el('div');
    let available = {}; const customs = () => { try { return Y.customThemes.all(); } catch (e) { return {}; } };
    let themeEl = document.getElementById('yapplus-active-theme');
    if (!themeEl) { themeEl = document.createElement('style'); themeEl.id = 'yapplus-active-theme'; document.head.appendChild(themeEl); }
    const activeName = () => localStorage.getItem('yapplus.activeTheme') || '';
    const activeCss = () => available[activeName()] || '';

    // accent
    const accG = group('Accent colour', 'gip', 'Recolours every theme that has an accent colour (most of the GIP++ ones: Aero, Eco, Web 2.0, Catppuccin, Nord, Sakura, Aqua, Synthwave and more). Themes with a fixed look, like GIP & CO, CRT and Game Boy, ignore it.');
    const hue = el('input', { type: 'range', min: 0, max: 360, step: 1, class: 'gp-hue', 'aria-label': 'Accent colour' });
    const hueLbl = el('span', { class: 'gp-ver', style: 'min-width:70px;text-align:right' });
    const hueReset = el('button', { class: 'btn', text: 'Default' });
    const hueNote = el('div', { class: 'gp-status' });
    const saved = localStorage.getItem('gip.accentHue');
    hue.value = saved === null ? 205 : saved;
    const refreshAccent = () => {
      const uses = /--gip-h/.test(activeCss());
      hue.disabled = !uses; hueReset.disabled = !uses;
      const v = localStorage.getItem('gip.accentHue');
      hueLbl.textContent = !uses ? 'n/a' : (v === null ? 'Theme default' : 'Hue ' + v);
      hueNote.textContent = !activeName() ? 'Pick a theme below first.' : (uses ? '' : 'The current theme has no accent colour to change.');
    };
    hue.addEventListener('input', () => { try { localStorage.setItem('gip.accentHue', hue.value); } catch (e) {} Y.applyAccent(); refreshAccent(); });
    hueReset.addEventListener('click', () => { try { localStorage.removeItem('gip.accentHue'); } catch (e) {} Y.applyAccent(); refreshAccent(); });
    accG.append(el('div', { class: 'gp-line' }, hue, hueLbl, hueReset), hueNote);

    // theme list
    const search = el('input', { class: 'input', placeholder: 'Search themes\u2026', style: 'width:100%;margin:6px 0 8px' });
    let modeFilter = 'all';
    const modeChips = el('div', { class: 'gp-chips', style: 'margin:0 0 14px' });
    [['all', 'All'], ['dark', 'Dark'], ['light', 'Light']].forEach(([v, label]) => {
      const c = el('button', { class: 'gp-chip' + (v === 'all' ? ' on' : ''), text: label });
      c.addEventListener('click', () => { modeFilter = v; modeChips.querySelectorAll('.gp-chip').forEach(x => x.classList.toggle('on', x === c)); draw(search.value); });
      modeChips.appendChild(c);
    });
    const gipG = group('GIP++ themes', 'gip'), yapG = group('Themes from Yap++', 'yap');
    const gipL = el('div'), yapL = el('div'); gipG.appendChild(gipL); yapG.appendChild(yapL);

    // import / export
    const ioG = group('Import and export', 'gip', 'Share a theme as a code or a .css file, or add one without touching the themes folder. Only import themes from people you trust.');
    const status = el('div', { class: 'gp-status' });
    const say = (t) => { status.textContent = t; };
    const copyBtn = el('button', { class: 'btn', text: 'Copy share code' });
    const fileBtn = el('button', { class: 'btn', text: 'Save .css file' });
    const need = () => { if (!activeName() || !activeCss()) { say('Pick a theme first.'); return false; } return true; };
    copyBtn.addEventListener('click', async () => {
      if (!need()) return;
      const shareCode = Y.customThemes.encode(activeName().replace(/\.css$/, ''), activeCss());
      try { await navigator.clipboard.writeText(shareCode); say('Share code copied. Anyone can paste it below to add the theme.'); }
      catch (e) { codeBox.value = shareCode; codeBox.select(); say('Could not use the clipboard. The share code is in the box below: select it and copy it.'); }
    });
    fileBtn.addEventListener('click', () => {
      if (!need()) return;
      try {
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([activeCss()], { type: 'text/css' }));
        a.download = activeName(); document.body.appendChild(a); a.click(); a.remove(); say('Saved ' + activeName() + ' (check your Downloads folder).');
      } catch (e) { say('Could not save a file here. Use Copy share code instead.'); }
    });
    const codeBox = el('textarea', { class: 'input gp-code', placeholder: 'Paste a share code (GIPTHEME1:\u2026) or raw CSS here', spellcheck: 'false' });
    const nm = el('input', { class: 'input', placeholder: 'Theme name (for raw CSS)', maxlength: 40 });
    const addBtn = el('button', { class: 'btn primary', text: 'Add theme' });
    addBtn.addEventListener('click', () => {
      const text = codeBox.value.trim(); if (!text) { say('Paste a share code or CSS first.'); return; }
      let name = nm.value.trim(), css = '';
      const dec = Y.customThemes.decode(text);
      if (dec) { css = dec.css; name = name || dec.name; }
      else if (/^GIPTHEME/i.test(text)) { say('That share code is not valid.'); return; }
      else { css = Y.sanitizeCss(text); if (!name) { say('Give the theme a name.'); return; } }
      if (!css.trim()) { say('That theme is empty.'); return; }
      let file; try { file = Y.customThemes.add(name, css); } catch (e) { say('Could not save the theme (storage full?).'); return; }
      available[file] = Y.customThemes.all()[file]; codeBox.value = ''; nm.value = '';
      say('Added \u201c' + name + '\u201d. Switch it on in the list above.'); draw(search.value);
    });
    ioG.append(el('div', { class: 'gp-line' }, copyBtn, fileBtn), codeBox, el('div', { class: 'gp-line' }, nm, addBtn), status);

    root.append(accG, search, modeChips, gipG, yapG, ioG);

    const apply = (f) => {
      if (!f) { localStorage.removeItem('yapplus.activeTheme'); themeEl.textContent = ''; }
      else { localStorage.setItem('yapplus.activeTheme', f); themeEl.textContent = available[f] || ''; }
      try { Y.syncMode(themeEl.textContent); } catch (e) {}
      refreshAccent(); draw(search.value);
    };
    const draw = (q) => {
      gipL.innerHTML = ''; yapL.innerHTML = '';
      const active = activeName(); const f = (q || '').toLowerCase(); const cu = customs();
      Object.keys(available).sort().forEach(file => {
        if (!file.endsWith('.css')) return;
        const name = file.replace(/\.css$/, '').replace(/^gip-custom-/, ''); if (f && !name.toLowerCase().includes(f)) return;
        if (modeFilter !== 'all') { const m = /color-scheme\s*:\s*(light|dark)/i.exec(available[file] || ''); if (!m || m[1].toLowerCase() !== modeFilter) return; }
        const isCustom = Object.prototype.hasOwnProperty.call(cu, file);
        const origin = Y.themeOrigin(file);
        const th = themeThumb(available[file]); th.addEventListener('click', () => apply(active === file ? null : file));
        const nameEl = el('div', { class: 'gp-name', style: 'text-transform:capitalize' }, name.replace(/-/g, ' '), Y.tag(origin));
        if (isCustom) nameEl.appendChild(el('span', { class: 'gp-ver', style: 'margin-left:8px', text: 'custom' }));
        const row = el('div', { class: 'gp-trow' }, th, el('div', { class: 'gp-main' }, nameEl), isCustom ? el('button', { class: 'gp-x', text: 'Delete', onclick: () => {
          if (activeName() === file) apply(null); Y.customThemes.remove(file); delete available[file]; draw(search.value);
        } }) : null, sw(active === file, (on) => apply(on ? file : null)));
        (origin === 'gip' ? gipL : yapL).appendChild(row);
      });
      [gipL, yapL].forEach(l => { if (!l.children.length) l.appendChild(el('div', { class: 'gp-desc', text: 'None.' })); });
    };
    (async () => { try { available = await window.electronAPI.getThemes(); } catch (e) {} available = Object.assign({}, available, customs()); refreshAccent(); draw(''); })();
    search.addEventListener('input', () => draw(search.value));
    return root;
  }

  function tabAbout() {
    const root = el('div');
    const logo = el('img', { alt: 'GIP & CO', style: 'display:block;max-width:420px;width:100%;margin:0 0 18px;border-radius:8px' });
    (async () => { try { const d = await window.electronAPI.getAsset('GipBanner.png'); if (d) logo.src = d; else logo.remove(); } catch (e) { logo.remove(); } })();
    root.appendChild(logo);
    const credit = el('div', { class: 'gp-credit' }, el('b', { text: 'Built on Yap++' }), Y.tag('yap'),
      el('div', { class: 'gp-desc', text: 'GIP++ is a fork of Yap++ by salami (Ng, Liann), used under the Apache License 2.0. Thank you to salami and to Lemon for Yap++.' }));
    const a = group('GIP++', 'gip');
    a.append(el('div', { class: 'gp-desc', text: 'GIP & CO International. Illuc profectus sum. Illud feci.' }),
      el('div', { class: 'gp-desc', text: 'GIP++ is an unofficial client mod. It is not affiliated with Yapper Media LLC.' }));
    const dl = group('Disclaimers', 'gip');
    ['GIP++ is an unofficial client mod. It is not affiliated with, endorsed by or supported by Yapper Media LLC.',
     'Using a modified client may go against the platform\u2019s terms, and site updates can break features at any time. Use it at your own risk.',
     'Your favorites, folder icons, volume and direction settings are stored only on this computer. GIP++ does not upload them.',
     'User Counter (Plugins tab, on by default): sends a random install ID made on this computer so GIP++ can show how many people use it. It contains no name, account, login or settings. Switch the plugin off to stop it.',
     'Direction audio works best with headphones. Hi-Fi Mic and some other features are experimental.',
     'The software is provided \u201cas is\u201d, without warranty of any kind (Apache License 2.0).'
    ].forEach(t => dl.appendChild(el('div', { class: 'gp-desc', style: 'margin:4px 0', text: t })));
    const cm = group('Community', 'gip');
    const lk2 = (t, u) => { const a = el('a', { href: u, text: t, target: '_blank' }); a.addEventListener('click', (e) => { e.preventDefault(); try { window.electronAPI.openExternal(u); } catch (er) { window.open(u, '_blank'); } }); return a; };
    cm.append(el('div', { class: 'gp-desc' }, 'Server: ', lk2('yapin.gg/invite/gip', Y.LINKS.server)),
      el('div', { class: 'gp-desc' }, 'Report a bug: ', lk2('github.com/le-nt/GIPPLUSPLUS/issues', Y.LINKS.bugs)),
      el('div', { class: 'gp-desc' }, 'Source: ', lk2('github.com/le-nt/GIPPLUSPLUS', Y.LINKS.repo)));
    const y = group('Yap++', 'yap');
    y.append(el('div', { class: 'gp-desc' }, 'YouTube: ', el('a', { href: 'https://www.youtube.com/@sedesuu', target: '_blank', text: '@sedesuu' })),
      el('div', { class: 'gp-desc' }, 'Discord: ', el('a', { href: 'https://discord.com/users/1384802116106719384', target: '_blank', text: '.salamidev' })),
      el('div', { class: 'gp-desc', text: 'Neither Yap++ nor GIP++ saves, distributes or misuses your login tokens or login information.' }));
    root.append(credit, a, dl, cm, y);
    return root;
  }

  // ---------------------------------------------------------------------------------------------------------
  // The window. GIP++ no longer adds anything to Yappin's Settings (that is what used to leak into server settings
  // and break the real settings page). It opens as its own window from a small button or with Ctrl+Shift+G.
  // ---------------------------------------------------------------------------------------------------------
  const ovid = 'gip-menu-ov', btnid = 'gip-menu-btn';
  const PAGE_ICON = {
    plugins: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    look: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10.5" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="15.5" cy="10.5" r="1"/><path d="M12 21c-1.5 0-2-1.5-1-2.5s0-2.5 2-2.5h3"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    accounts: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    app: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  };
  const svg = (inner) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  const CHEV = svg('<path d="M9 6l6 6-6 6"/>');

  // Settings parts are built once per time the window is opened.
  let sp = null; const parts = () => sp || (sp = tabSettingsParts());
  const ext = (id) => (Y.extraTabs || []).find(t => t.id === id);

  // Sections inside a page. ext: the tab another plugin registered with YapPlus.registerTab.
  const SECS = {
    themes: { t: 'Themes and accent colour', d: 'Click a preview to switch a theme on. The slider recolours themes that support it.', b: () => tabThemes() },
    sounds: { t: 'Sound packs', d: 'Pick a sound pack and choose when it plays.', ext: 'sounds' },
    background: { t: 'Custom background', d: 'A picture or your own CSS behind the app.', b: () => parts().cb },
    voice: { t: 'Voice presets', d: 'Saved volume and direction for people, and presets.', ext: 'voice' },
    search: { t: 'Message search', d: 'Search the messages you have seen while this is on.', ext: 'search' },
    words: { t: 'Word filter', d: 'Hide, collapse or highlight messages with words you choose.', ext: 'words' },
    people: { t: 'Nicknames', d: 'Rename people for yourself only. Nobody else sees it.', ext: 'people' },
    downloads: { t: 'Downloads', d: 'Save files and emoji from chat with their real names.', ext: 'downloads' },
    emojitext: { t: 'Emoji text', d: 'Turns :emoji_names: written as text into the emoji picture.', ext: 'emojitext' },
    shortcut: { t: 'Text shortcut', d: 'Type a shortcut in chat and it is replaced with your text.', b: () => parts().ae },
    filenames: { t: 'Upload file names', d: 'Pick which kinds of files get a random name when you upload them.', b: () => parts().fd },
    accounts: { t: 'Your accounts', d: 'Use several accounts at once, each in its own window.', b: () => tabAccounts() },
    sync: { t: 'Sync settings between accounts', d: 'Copy GIP++ settings from one account to another.', ext: 'sync' },
    updates: { t: 'Updates', d: 'Check for a new GIP++ version.', b: () => parts().us },
    menubtn: { t: 'Menu button', d: 'Where the GIP++ button shows up, and the keyboard shortcut.', b: () => menuBtnSection() },
    health: { t: 'Health check', d: 'Finds features that stopped working after a Yappin update.', ext: 'health' },
    reset: { t: 'Reset and troubleshooting', d: 'Put GIP++ back to how it was on a fresh install.', b: () => parts().rs },
  };
  const PAGES = [
    { id: 'plugins', label: 'Features', head: ['Features', 'Switch features on or off. Changes apply straight away.'], build: () => tabPlugins() },
    { id: 'look', label: 'Appearance', head: ['Appearance', 'Themes, sounds and background.'], secs: ['themes', 'sounds', 'background'] },
    { id: 'chat', label: 'Chat and voice', head: ['Chat and voice', 'Tools for messages, people and calls. Open a section to use it.'], secs: ['voice', 'search', 'words', 'people', 'downloads', 'emojitext', 'shortcut', 'filenames'] },
    { id: 'accounts', label: 'Accounts', head: ['Accounts', 'Several logins at once, and moving settings between them.'], secs: ['accounts', 'sync'] },
    { id: 'app', label: 'App', head: ['App', 'Updates, the menu button, health and reset.'], secs: ['updates', 'menubtn', 'health', 'reset'] },
    { id: 'about', label: 'About', head: ['About', 'Version, credits and links.'], build: () => tabAbout() },
  ];
  const LISTED = new Set(Object.keys(SECS)); LISTED.add('plugins');

  function menuBtnSection() {
    const root = el('div'); const g = group('Menu button', 'gip', 'GIP++ opens in its own window and does not touch Yappin\u2019s Settings. You can always open it with Ctrl+Shift+G.');
    const sel = el('select', { class: 'input', style: 'width:auto' });
    [['auto', 'Next to my name (or floating if not there)'], ['userbar', 'Next to my name'], ['float', 'Floating corner button'], ['hidden', 'Hidden (keyboard shortcut only)']].forEach(([v, l]) => { const o = el('option', { value: v, text: l }); if (v === (localStorage.getItem('gip.menuBtn') || 'auto')) o.selected = true; sel.appendChild(o); });
    sel.addEventListener('change', () => { try { localStorage.setItem('gip.menuBtn', sel.value); } catch (e) {} placeBtn(); });
    g.appendChild(el('div', { class: 'gp-row' }, el('div', null, el('div', { class: 'gp-name' }, 'Where to show it', Y.tag('gip')), el('div', { class: 'gp-desc', text: 'Pick Floating if the button looks out of place next to your name.' })), sel));
    root.appendChild(g); return root;
  }

  function buildSection(id, state) {
    const s = SECS[id]; const e = s.ext ? ext(s.ext) : null;
    if (s.ext && !e) return null;
    const box = el('div', { class: 'gip-sec' + (state.open.has(id) ? ' open' : '') });
    const head = el('button', { class: 'gip-sec-h', type: 'button', 'aria-expanded': String(state.open.has(id)) }, el('div', null, el('div', { class: 'gip-sec-t', text: s.t }), el('div', { class: 'gip-sec-d', text: s.d })), el('span', { class: 'gip-chev', html: '' }));
    head.querySelector('.gip-chev').innerHTML = CHEV;
    const body = el('div', { class: 'gip-sec-body' }); let built = false;
    const fill = () => { if (built) return; built = true; try { body.appendChild(e ? e.build(Y.ui) : s.b()); } catch (err) { console.error('[GIP++] section failed', id, err); body.textContent = 'This section failed to load. See the console.'; } };
    if (state.open.has(id)) fill();
    head.addEventListener('click', () => { const o = !box.classList.contains('open'); box.classList.toggle('open', o); head.setAttribute('aria-expanded', String(o)); if (o) { state.open.add(id); fill(); } else state.open.delete(id); });
    box.append(head, body); return box;
  }

  function buildpanel(startPage, close) {
    const p = el('div', { id: panelid });
    const top = el('div', { class: 'gip-top' });
    const logo = el('div', { class: 'gip-logo' }); logo.innerHTML = svg('<path d="M5 12h14"/><path d="M12 5v14"/><path d="M4 4l3 3M20 4l-3 3M4 20l3-3M20 20l-3-3"/>');
    top.append(logo, el('div', { class: 'gip-title' }, el('b', { text: 'GIP++' }), el('span', { text: 'v' + Y.VERSION + ' \u00b7 unofficial client mod' })));
    const xb = el('button', { class: 'gip-x', type: 'button', title: 'Close (Esc)', 'aria-label': 'Close', text: '\u00d7' }); xb.addEventListener('click', close); top.appendChild(xb);
    const side = el('div', { class: 'gp-side', role: 'navigation', 'aria-label': 'GIP++ sections' }); const head = el('div', { class: 'gp-head' }); const body = el('div');
    const content = el('div', { class: 'gp-content gip-scroll' }, head, body);
    const state = { open: new Set(['themes', 'voice', 'accounts', 'updates']) };
    // Plugins that register a tab we have no section for yet go under App so nothing disappears.
    const extras = (Y.extraTabs || []).filter(t => !LISTED.has(t.id) && !Object.values(SECS).some(s => s.ext === t.id));
    extras.forEach(t => { SECS['x:' + t.id] = { t: t.label, d: 'Added by a feature.', ext: t.id }; });
    const pages = PAGES.map(pg => pg.id === 'app' && extras.length ? Object.assign({}, pg, { secs: pg.secs.concat(extras.map(t => 'x:' + t.id)) }) : pg);
    const show = (id) => {
      const pg = pages.find(x => x.id === id) || pages[0]; currentPage = pg.id;
      side.querySelectorAll('.gp-tab').forEach(b => b.classList.toggle('on', b.dataset.id === pg.id));
      body.innerHTML = ''; head.innerHTML = ''; content.scrollTop = 0;
      head.append(el('h2', { text: pg.head[0] }), el('p', { text: pg.head[1] }));
      try {
        if (pg.build) body.appendChild(pg.build());
        else pg.secs.forEach(sid => { const s = buildSection(sid, state); if (s) body.appendChild(s); });
      } catch (e) { console.error('[GIP++] page failed', pg.id, e); body.textContent = 'This page failed to load. See the console.'; }
    };
    pages.forEach((pg) => {
      if (pg.id === 'about') side.appendChild(el('div', { class: 'gp-sep' }));
      const b = el('button', { class: 'gp-tab', type: 'button', 'data-id': pg.id }); b.innerHTML = svg(PAGE_ICON[pg.id] || '') + '<span></span>'; b.querySelector('span').textContent = pg.label;
      b.addEventListener('click', () => show(pg.id)); side.appendChild(b);
    });
    p.append(top, el('div', { class: 'gp-layout' }, side, content)); show(startPage || currentPage);
    p.__show = show; return p;
  }

  let currentPage = 'plugins';
  function isOpen() { return !!document.getElementById(ovid); }
  function closeMenu() {
    const ov = document.getElementById(ovid); if (!ov) return;
    document.removeEventListener('keydown', ov.__key, true); ov.remove(); sp = null;
    const b = document.getElementById(btnid); if (b && b.isConnected) { try { b.focus({ preventScroll: true }); } catch (e) {} }
  }
  function openMenu(page) {
    const old = document.getElementById(ovid);
    if (old) { if (page && old.firstChild && old.firstChild.firstChild && old.firstChild.firstChild.__show) old.firstChild.firstChild.__show(page); return; }
    sp = null;
    const ov = el('div', { id: ovid }); const win = el('div', { class: 'modal gip-menu-win', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'GIP++' });
    let panel; try { panel = buildpanel(page, closeMenu); } catch (err) { console.error('[GIP++] menu failed', err); panel = el('div', { style: 'padding:28px 40px', text: 'The GIP++ menu failed to load. See the console.' }); }
    win.appendChild(panel); ov.appendChild(win); document.body.appendChild(ov);
    try { // if Yappin's .modal gives no solid background, borrow the page's own
      const bg = getComputedStyle(win).backgroundColor; const m = /rgba?\(([^)]+)\)/.exec(bg); const a = m ? (m[1].split(',')[3] === undefined ? 1 : parseFloat(m[1].split(',')[3])) : 0;
      if (!m || a < 0.9) { let c = getComputedStyle(document.body).backgroundColor; if (!/rgb/.test(c) || /rgba\(.*,\s*0\)/.test(c)) c = getComputedStyle(document.documentElement).backgroundColor; if (!/rgb/.test(c) || /rgba\(.*,\s*0\)/.test(c)) c = '#1e1f24'; win.style.setProperty('--gip-win-bg', c); win.classList.add('gip-fill'); }
    } catch (e) {}
    ov.addEventListener('pointerdown', (e) => { if (e.target === ov) closeMenu(); });
    ov.__key = (e) => { if (e.key === 'Escape' && !document.querySelector('.gip-overlay, .gip-popmenu')) { e.stopPropagation(); e.preventDefault(); closeMenu(); } };
    document.addEventListener('keydown', ov.__key, true);
  }
  Y.openMenu = openMenu; Y.closeMenu = closeMenu;

  // The button that opens the window.
  function placeBtn() {
    let mode = 'auto'; try { mode = localStorage.getItem('gip.menuBtn') || 'auto'; } catch (e) {}
    let btn = document.getElementById(btnid);
    if (mode === 'hidden') { if (btn) btn.remove(); return; }
    if (!btn) {
      btn = el('button', { id: btnid, type: 'button', title: 'GIP++ (Ctrl+Shift+G)', 'aria-label': 'Open GIP++' });
      btn.innerHTML = ICON; btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); isOpen() ? closeMenu() : openMenu(); });
    }
    const bar = Y.sel.q('userBar');
    if ((mode === 'userbar' || mode === 'auto') && bar) { if (btn.parentElement !== bar || btn.className !== 'gip-menu-btn in-bar') { btn.className = 'gip-menu-btn in-bar'; bar.appendChild(btn); } }
    else if (btn.parentElement !== document.body || btn.className !== 'gip-menu-btn floating') { btn.className = 'gip-menu-btn floating'; document.body.appendChild(btn); }
  }
  Y.events.watch(placeBtn, '1menu', 150); placeBtn();
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey && (e.key === 'G' || e.key === 'g')) { e.preventDefault(); e.stopPropagation(); isOpen() ? closeMenu() : openMenu(); }
  }, true);

  // The menu used to sit inside Yappin's Settings. Say where it went, once.
  try {
    if (!localStorage.getItem('gip.menuMovedHint')) {
      localStorage.setItem('gip.menuMovedHint', '1');
      setTimeout(() => Y.toast('GIP++ has its own window now. Click the GIP++ icon or press Ctrl+Shift+G.', 7000), 3500);
    }
  } catch (e) {}
})();
