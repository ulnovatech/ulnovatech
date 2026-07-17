/**
 * UlnovaTech preview purchase dock — compact glass card (desktop) / bottom sheet (mobile).
 * Served at /portfolio/portfolio/cta.js (relative ../cta.js from each template).
 */
(function () {
  if (window.__ulnPreviewCtaLoaded) return;
  window.__ulnPreviewCtaLoaded = true;

  var WHATSAPP = 'https://wa.me/256749594464';
  var PHONE = 'tel:+256791779448';
  var ORDER_BASE = '/portfolio-app/order';
  var GALLERY_URL = '/portfolio-app/';
  var CATALOG_URL = '/portfolio/portfolio/catalog.json';
  var STORAGE_KEY = 'uln_preview_dock_collapsed';
  var ENTER_DELAY_MS = 1600;

  var ICON = {
    close:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    whatsapp:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.85 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
    phone:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    gallery:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="2"/></svg>',
    arrow:
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  function templateKey() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    var idx = parts.indexOf('portfolio');
    if (idx >= 0 && parts[idx + 1] === 'portfolio' && parts[idx + 2]) {
      return decodeURIComponent(parts[idx + 2]);
    }
    var fromId = document.body && document.body.getAttribute('data-template-id');
    if (fromId && fromId.trim()) return fromId.trim();
    return (document.title || 'template').trim();
  }

  function cleanTitleFromId(id) {
    return String(id || 'Template')
      .replace(/\.webflow\.io$/i, '')
      .replace(/-template$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });
  }

  function removeWebflowBadge() {
    document.querySelectorAll('.w-webflow-badge, a.w-webflow-badge').forEach(function (el) {
      el.remove();
    });
    document.querySelectorAll('a[href*="webflow.com"]').forEach(function (el) {
      var t = (el.getAttribute('title') || el.textContent || '').toLowerCase();
      if (t.indexOf('made in webflow') !== -1 || el.classList.contains('w-webflow-badge')) {
        el.remove();
      }
    });
  }

  function injectStyles() {
    if (document.getElementById('uln-preview-dock-styles')) return;
    var style = document.createElement('style');
    style.id = 'uln-preview-dock-styles';
    style.textContent = [
      '.w-webflow-badge,a.w-webflow-badge{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}',
      '#uln-preview-root{position:fixed;z-index:2147483000;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;',
      'right:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));left:auto;width:min(368px,calc(100vw - 24px));',
      'pointer-events:none;}',
      '#uln-preview-root *{box-sizing:border-box;}',
      '#uln-preview-dock,#uln-preview-fab{pointer-events:auto;}',
      '#uln-preview-dock{display:none;flex-direction:column;gap:12px;padding:14px 14px 12px;',
      'border-radius:20px;color:#f8fafc;',
      'background:linear-gradient(165deg,rgba(22,24,30,.88),rgba(10,12,16,.92));',
      'border:1px solid rgba(255,255,255,.12);',
      'box-shadow:0 18px 48px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.08);',
      'backdrop-filter:blur(18px) saturate(1.35);-webkit-backdrop-filter:blur(18px) saturate(1.35);',
      'opacity:0;transform:translateY(14px) scale(.98);',
      'transition:opacity .32s ease,transform .32s ease;}',
      '#uln-preview-dock.uln-open{display:flex;}',
      '#uln-preview-dock.uln-show{opacity:1;transform:translateY(0) scale(1);}',
      '#uln-preview-dock .uln-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}',
      '#uln-preview-dock .uln-kicker{margin:0;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:rgba(248,250,252,.55);}',
      '#uln-preview-dock .uln-title-row{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px;margin-top:4px;min-width:0;}',
      '#uln-preview-dock .uln-label{font-size:14px;font-weight:700;color:#fff;line-height:1.25;}',
      '#uln-preview-dock .uln-dot{color:rgba(248,250,252,.35);font-weight:700;}',
      '#uln-preview-dock .uln-template{font-size:14px;font-weight:600;color:#fdba74;line-height:1.25;',
      'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;}',
      '#uln-preview-dock .uln-close{flex-shrink:0;width:32px;height:32px;border:0;border-radius:10px;',
      'display:inline-flex;align-items:center;justify-content:center;cursor:pointer;',
      'background:rgba(255,255,255,.08);color:rgba(248,250,252,.85);}',
      '#uln-preview-dock .uln-close:hover{background:rgba(255,255,255,.14);color:#fff;}',
      '#uln-preview-dock .uln-close:focus-visible,#uln-preview-dock .uln-primary:focus-visible,',
      '#uln-preview-dock .uln-sec:focus-visible,#uln-preview-fab:focus-visible{outline:2px solid #fdba74;outline-offset:2px;}',
      '#uln-preview-dock .uln-primary{display:inline-flex;align-items:center;justify-content:center;gap:8px;',
      'width:100%;min-height:48px;padding:12px 16px;border-radius:14px;text-decoration:none;',
      'background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-size:15px;font-weight:700;',
      'box-shadow:0 8px 22px rgba(234,88,12,.35);transition:transform .15s ease,filter .15s ease,background .15s ease;}',
      '#uln-preview-dock .uln-primary:hover{filter:brightness(1.05);transform:translateY(-1px);}',
      '#uln-preview-dock .uln-primary:active{transform:translateY(0);}',
      '#uln-preview-dock .uln-hint{margin:0;font-size:12px;line-height:1.35;color:rgba(248,250,252,.55);}',
      '#uln-preview-dock .uln-secondary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}',
      '#uln-preview-dock .uln-sec{display:inline-flex;align-items:center;justify-content:center;gap:6px;',
      'min-height:40px;padding:8px 6px;border-radius:12px;text-decoration:none;',
      'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);',
      'color:rgba(248,250,252,.88);font-size:12px;font-weight:600;transition:background .15s ease,border-color .15s ease;}',
      '#uln-preview-dock .uln-sec:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.16);color:#fff;}',
      '#uln-preview-fab{display:none;align-items:center;justify-content:center;gap:8px;margin-left:auto;',
      'min-height:48px;padding:12px 18px;border:0;border-radius:999px;cursor:pointer;',
      'background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;font-size:14px;font-weight:700;',
      'box-shadow:0 12px 32px rgba(0,0,0,.35),0 8px 20px rgba(234,88,12,.3);',
      'opacity:0;transform:translateY(10px);transition:opacity .28s ease,transform .28s ease;}',
      '#uln-preview-fab.uln-open{display:inline-flex;}',
      '#uln-preview-fab.uln-show{opacity:1;transform:translateY(0);}',
      '#uln-preview-fab:hover{filter:brightness(1.05);}',
      '@media (max-width:640px){',
      '#uln-preview-root{left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));width:auto;}',
      '#uln-preview-dock{border-radius:18px;padding:12px 12px 10px;gap:10px;}',
      '#uln-preview-dock .uln-title-row{flex-direction:column;align-items:flex-start;gap:2px;}',
      '#uln-preview-dock .uln-dot{display:none;}',
      '#uln-preview-dock .uln-label{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:rgba(248,250,252,.55);}',
      '#uln-preview-dock .uln-template{font-size:15px;font-weight:700;color:#fff;max-width:calc(100vw - 96px);}',
      '#uln-preview-dock .uln-hint{display:none;}',
      '#uln-preview-fab{width:100%;border-radius:16px;}',
      '}',
      '@media (prefers-reduced-motion:reduce){',
      '#uln-preview-dock,#uln-preview-fab,#uln-preview-dock .uln-primary{transition:none!important;animation:none!important;transform:none!important;}',
      '}',
    ].join('');
    document.head.appendChild(style);
  }

  function fetchTitle(folderId, onDone) {
    var fallback = cleanTitleFromId(folderId);
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () {
      if (ctrl) ctrl.abort();
      onDone(fallback);
    }, 2500);

    fetch(CATALOG_URL, ctrl ? { signal: ctrl.signal, credentials: 'same-origin' } : { credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('catalog');
        return res.json();
      })
      .then(function (data) {
        clearTimeout(timer);
        var meta = data && data[folderId];
        var title = meta && meta.title ? String(meta.title).trim() : '';
        onDone(title || fallback);
      })
      .catch(function () {
        clearTimeout(timer);
        onDone(fallback);
      });
  }

  function isCollapsed() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setCollapsed(value) {
    try {
      if (value) sessionStorage.setItem(STORAGE_KEY, '1');
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function mount() {
    removeWebflowBadge();
    injectStyles();

    var key = templateKey();
    var orderHref = ORDER_BASE + '?template=' + encodeURIComponent(key);

    var root = document.createElement('div');
    root.id = 'uln-preview-root';

    var dock = document.createElement('div');
    dock.id = 'uln-preview-dock';
    dock.setAttribute('role', 'dialog');
    dock.setAttribute('aria-label', 'Choose this template');
    dock.innerHTML =
      '<div class="uln-head">' +
      '<div style="min-width:0;flex:1">' +
      '<p class="uln-kicker">UlnovaTech preview</p>' +
      '<div class="uln-title-row">' +
      '<span class="uln-label">Choose this template</span>' +
      '<span class="uln-dot" aria-hidden="true">·</span>' +
      '<span class="uln-template" id="uln-template-title">Loading…</span>' +
      '</div>' +
      '</div>' +
      '<button type="button" class="uln-close" id="uln-dock-close" aria-label="Close purchase panel">' +
      ICON.close +
      '</button>' +
      '</div>' +
      '<a class="uln-primary" id="uln-order-btn" href="' +
      orderHref +
      '">Proceed to purchase ' +
      ICON.arrow +
      '</a>' +
      '<p class="uln-hint">Short form first — payment comes after you choose a package.</p>' +
      '<div class="uln-secondary">' +
      '<a class="uln-sec" href="' +
      WHATSAPP +
      '" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">' +
      ICON.whatsapp +
      '<span>WhatsApp</span></a>' +
      '<a class="uln-sec" href="' +
      PHONE +
      '" aria-label="Call">' +
      ICON.phone +
      '<span>Call</span></a>' +
      '<a class="uln-sec" href="' +
      GALLERY_URL +
      '" aria-label="Browse gallery">' +
      ICON.gallery +
      '<span>Gallery</span></a>' +
      '</div>';

    var fab = document.createElement('button');
    fab.id = 'uln-preview-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Choose this template');
    fab.innerHTML = 'Choose this template ' + ICON.arrow;

    root.appendChild(dock);
    root.appendChild(fab);
    document.body.appendChild(root);

    var titleEl = document.getElementById('uln-template-title');
    fetchTitle(key, function (title) {
      if (titleEl) titleEl.textContent = title;
      fab.setAttribute('aria-label', 'Choose this template: ' + title);
    });

    function showDock(animate) {
      fab.classList.remove('uln-open', 'uln-show');
      dock.classList.add('uln-open');
      if (animate) {
        requestAnimationFrame(function () {
          dock.classList.add('uln-show');
        });
      } else {
        dock.classList.add('uln-show');
      }
      setCollapsed(false);
    }

    function showFab(animate) {
      dock.classList.remove('uln-open', 'uln-show');
      fab.classList.add('uln-open');
      if (animate) {
        requestAnimationFrame(function () {
          fab.classList.add('uln-show');
        });
      } else {
        fab.classList.add('uln-show');
      }
      setCollapsed(true);
    }

    document.getElementById('uln-dock-close').addEventListener('click', function () {
      showFab(true);
      fab.focus();
    });
    fab.addEventListener('click', function () {
      showDock(true);
      var primary = document.getElementById('uln-order-btn');
      if (primary) primary.focus();
    });

    var reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var startCollapsed = isCollapsed();
    var delay = reduceMotion ? 0 : ENTER_DELAY_MS;

    setTimeout(function () {
      if (startCollapsed) showFab(true);
      else showDock(true);
    }, delay);
  }

  function start() {
    mount();
    var observer = new MutationObserver(removeWebflowBadge);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () {
      observer.disconnect();
    }, 15000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
