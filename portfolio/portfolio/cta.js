/**
 * UlnovaTech template preview CTA — inject into live Webflow template HTML.
 * Served at /portfolio/portfolio/cta.js (relative ../cta.js from each template).
 */
(function () {
  if (window.__ulnPreviewCtaLoaded) return;
  window.__ulnPreviewCtaLoaded = true;

  var WHATSAPP = 'https://wa.me/256749594464';
  var PHONE = 'tel:+256791779448';
  var ORDER_BASE = '/portfolio-app/order';

  function templateKey() {
    var fromAttr = document.body && document.body.getAttribute('data-template');
    if (fromAttr && fromAttr.trim()) return fromAttr.trim();
    var parts = window.location.pathname.split('/').filter(Boolean);
    // .../portfolio/portfolio/<folder>/index.html → folder
    var idx = parts.indexOf('portfolio');
    if (idx >= 0 && parts[idx + 1] === 'portfolio' && parts[idx + 2]) {
      return parts[idx + 2];
    }
    return (document.title || 'template').trim();
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

  var style = document.createElement('style');
  style.textContent = [
    '.w-webflow-badge,a.w-webflow-badge{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}',
    '#uln-preview-dock{position:fixed;left:50%;bottom:20px;transform:translateX(-50%) translateY(12px);',
    'z-index:2147483000;display:flex;align-items:center;gap:10px;padding:10px 14px;',
    'border-radius:999px;background:rgba(12,12,14,.92);color:#fff;backdrop-filter:blur(10px);',
    '-webkit-backdrop-filter:blur(10px);box-shadow:0 12px 40px rgba(0,0,0,.35);',
    'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;opacity:0;',
    'transition:opacity .35s ease,transform .35s ease;max-width:calc(100vw - 24px);}',
    '#uln-preview-dock.uln-show{opacity:1;transform:translateX(-50%) translateY(0);}',
    '#uln-preview-dock .uln-chip{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;',
    'color:rgba(255,255,255,.65);white-space:nowrap;padding:0 4px;}',
    '#uln-preview-dock a.uln-icon{width:36px;height:36px;border-radius:50%;display:inline-flex;',
    'align-items:center;justify-content:center;background:rgba(255,255,255,.1);flex-shrink:0;}',
    '#uln-preview-dock a.uln-icon:hover,#uln-preview-dock a.uln-icon:focus{background:rgba(255,255,255,.18);outline:none;}',
    '#uln-preview-dock a.uln-icon img{width:18px;height:18px;display:block;}',
    '#uln-preview-dock a.uln-primary{display:inline-flex;align-items:center;justify-content:center;',
    'padding:10px 18px;border-radius:999px;background:#e85d04;color:#fff;font-weight:700;',
    'font-size:14px;text-decoration:none;white-space:nowrap;box-shadow:0 0 0 0 rgba(232,93,4,.5);',
    'animation:ulnPulse 8s ease-in-out infinite;}',
    '#uln-preview-dock a.uln-primary:hover,#uln-preview-dock a.uln-primary:focus{background:#d45303;outline:2px solid #fff;outline-offset:2px;}',
    '@keyframes ulnPulse{0%,90%,100%{box-shadow:0 0 0 0 rgba(232,93,4,0);}45%{box-shadow:0 0 0 8px rgba(232,93,4,.2);}}',
    '@media (max-width:575px){#uln-preview-dock{bottom:12px;padding:8px 10px;gap:8px;}',
    '#uln-preview-dock .uln-chip{display:none;}',
    '#uln-preview-dock a.uln-primary{padding:10px 14px;font-size:13px;}}',
    '@media (prefers-reduced-motion:reduce){#uln-preview-dock,#uln-preview-dock a.uln-primary{animation:none;transition:none;}}',
  ].join('');
  document.head.appendChild(style);

  function mount() {
    removeWebflowBadge();

    var key = templateKey();
    var orderHref = ORDER_BASE + '?template=' + encodeURIComponent(key);

    var dock = document.createElement('div');
    dock.id = 'uln-preview-dock';
    dock.setAttribute('role', 'region');
    dock.setAttribute('aria-label', 'UlnovaTech preview actions');
    dock.innerHTML =
      '<span class="uln-chip">Preview</span>' +
      '<a class="uln-icon" href="' +
      WHATSAPP +
      '" target="_blank" rel="noopener noreferrer" title="WhatsApp" aria-label="WhatsApp">' +
      '<img alt="" src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" width="18" height="18"/>' +
      '</a>' +
      '<a class="uln-primary" id="uln-order-btn" href="' +
      orderHref +
      '" title="Choose this template">Choose this template</a>' +
      '<a class="uln-icon" href="' +
      PHONE +
      '" title="Call" aria-label="Call">' +
      '<img alt="" src="https://img.icons8.com/ios-filled/50/ffffff/phone.png" width="18" height="18"/>' +
      '</a>';

    document.body.appendChild(dock);
    requestAnimationFrame(function () {
      dock.classList.add('uln-show');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  // Webflow often injects the badge after load
  var observer = new MutationObserver(removeWebflowBadge);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(function () {
    observer.disconnect();
  }, 15000);
})();
