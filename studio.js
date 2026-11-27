/* Studio motion: blocks rise once as they arrive; card light follows the pointer. Nothing else. */
(function () {
  document.addEventListener('pointermove', function (e) {
    var c = e.target.closest && e.target.closest('.card');
    if (!c) return;
    var r = c.getBoundingClientRect();
    c.style.setProperty('--mx', e.clientX - r.left + 'px');
    c.style.setProperty('--my', e.clientY - r.top + 'px');
  }, { passive: true });

  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -6% 0px' });
  var els = document.querySelectorAll('main section:not(.hero) .wrap > :not(.grid):not(.grid2x2), main .grid > *, main .grid2x2 > *');
  document.documentElement.classList.add('rv');
  els.forEach(function (el) {
    var i = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.setAttribute('data-rv', '');
    if (el.parentNode.matches('.grid,.grid2x2')) el.style.transitionDelay = Math.min(i, 6) * 70 + 'ms';
    io.observe(el);
  });
})();

/* Navigation: where you are, and a way to everywhere on any screen.
   The menu is built from the page's own <nav>, so every page has the same one and none repeats it. */
(function () {
  var nav = document.querySelector('header nav');
  if (!nav) return;
  var links = Array.prototype.slice.call(nav.querySelectorAll('a.nl'));
  var here = location.pathname.replace(/index\.html$/, '');
  var APPS = /^\/(apps\/|app\.html|beewallet|ngumba|osalah|support\.html|privacy\.html|terms\.html)/;
  var SAYS = {
    '/flowledger.html': 'Know where every naira went',
    '/website-design.html': 'A website that brings customers',
    '/apps/': 'Our apps, checked and one tap away',
    '/work/': 'Six systems we built, live today'
  };
  function path(a) { return a.getAttribute('href').replace(/^https?:\/\/[^/]+/, ''); }
  function isHere(p) {
    return p === here || (p === '/website-design.html' && here === '/website-cost.html') || (p === '/apps/' && APPS.test(here)) || (p === '/work/' && here.indexOf('/work/') === 0);
  }
  var current = null;
  links.forEach(function (a) { if (isHere(path(a))) { a.setAttribute('aria-current', 'page'); current = a; } });

  /* Desktop: the gold line */
  var ind = document.createElement('span');
  ind.className = 'ind'; ind.setAttribute('aria-hidden', 'true');
  nav.appendChild(ind);
  function to(a) {
    if (!a) { ind.style.opacity = 0; return; }
    ind.style.left = a.offsetLeft + 12 + 'px';
    ind.style.width = a.offsetWidth - 24 + 'px';
    ind.style.opacity = 1;
  }
  links.forEach(function (a) {
    a.addEventListener('mouseenter', function () { to(a); });
    a.addEventListener('focus', function () { to(a); });
  });
  var hover = null;
  links.forEach(function (a) { a.addEventListener('mouseenter', function () { hover = a; }); });
  nav.addEventListener('mouseleave', function () { hover = null; to(current); });
  /* the web font arrives after first paint and moves every link: re-place the line whenever the nav settles */
  if ('ResizeObserver' in window) new ResizeObserver(function () { to(hover || current); }).observe(nav);
  addEventListener('load', function () { to(current); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { to(current); });

  /* Phone and tablet: the sheet */
  var cta = nav.querySelector('.btn'), theme = nav.querySelector('.theme');
  var btn = document.createElement('button');
  btn.className = 'menu'; btn.type = 'button';
  btn.setAttribute('aria-label', 'Menu'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'sheet');
  btn.innerHTML = '<i></i><i></i>';
  nav.appendChild(btn);

  var sheet = document.createElement('div');
  sheet.className = 'sheet'; sheet.id = 'sheet';
  sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', 'Menu');
  var list = document.createElement('nav');
  list.setAttribute('aria-label', 'Pages');
  links.forEach(function (a, i) {
    var p = path(a), g = document.createElement('a');
    g.className = 'go-to'; g.href = a.getAttribute('href');
    if (a.hasAttribute('aria-current')) g.setAttribute('aria-current', 'page');
    g.style.transitionDelay = 60 + i * 55 + 'ms';
    g.innerHTML = '<span class="n">0' + (i + 1) + '</span><span class="t"></span><span class="arr" aria-hidden="true">&rarr;</span><span class="d"></span>';
    g.querySelector('.t').textContent = a.textContent;
    g.querySelector('.d').textContent = SAYS[p] || '';
    list.appendChild(g);
  });
  var foot = document.createElement('div');
  foot.className = 'foot';
  if (cta) foot.appendChild(cta.cloneNode(true));
  var wa = document.createElement('a');
  wa.className = 'bo'; wa.href = 'https://wa.me/12409750431'; wa.target = '_blank'; wa.rel = 'noopener'; wa.textContent = 'WhatsApp';
  foot.appendChild(wa);
  if (theme) foot.appendChild(theme.cloneNode(true));
  sheet.appendChild(list); sheet.appendChild(foot);
  document.body.appendChild(sheet);

  var root = document.documentElement, opened = false;
  function set(open, fromHistory, byKey) {
    if (open === opened) return;
    opened = open;
    root.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    if (open) {
      if (!fromHistory) history.pushState({ menu: 1 }, '');   // Back closes the menu, as on every phone
      if (byKey) setTimeout(function () { var f = list.querySelector('a'); if (f) f.focus({ preventScroll: true }); }, 60);
    } else {
      if (!fromHistory && history.state && history.state.menu) history.back();
      btn.focus({ preventScroll: true });
    }
  }
  btn.addEventListener('click', function (e) { set(!opened, false, e.detail === 0); });   // detail 0: Enter or Space, not a tap
  sheet.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    var same = a.pathname === location.pathname && a.hash;
    opened = false; root.classList.remove('menu-open'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Menu');
    if (history.state && history.state.menu) {
      if (same) { e.preventDefault(); history.back(); setTimeout(function () { location.hash = a.hash; }, 30); }
      else history.replaceState(null, '');
    }
  });
  addEventListener('popstate', function () { if (opened) set(false, true); });
  addEventListener('keydown', function (e) {
    if (!opened) return;
    if (e.key === 'Escape') set(false);
    if (e.key === 'Tab') {   // keep focus inside the open menu: the close button, then the sheet
      var f = [btn].concat(Array.prototype.slice.call(sheet.querySelectorAll('a,button')));
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  matchMedia('(min-width:901px)').addEventListener('change', function (m) { if (m.matches) set(false); to(current); });
})();

/* The live hero: three.js, only once the page has finished, and only where it costs the visitor nothing they'd miss. */
(function () {
  var st = document.querySelector('.stage[data-model]');
  if (!st) return;
  var c = navigator.connection || {};
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || c.saveData || /2g/.test(c.effectiveType || '') ||
      (navigator.deviceMemory && navigator.deviceMemory < 4)) return;   // the still picture says the same thing
  function go() { import('/js/hero.js').then(function (m) { return m.default(st); }).catch(function () {}); }
  function idle() { (window.requestIdleCallback || function (f) { setTimeout(f, 600); })(go, { timeout: 2500 }); }
  if (document.readyState === 'complete') idle(); else addEventListener('load', idle);
})();

/* WhatsApp, one tap from anywhere; the message says which page they were reading. */
(function () {
  if (document.querySelector('.wa-float')) return;
  var page = document.title.split(' — ')[0];
  var a = document.createElement('a');
  a.className = 'wa-float';
  a.href = 'https://wa.me/12409750431?text=' + encodeURIComponent('Hi Obiverse, I was reading "' + page + '" on your site. ');
  a.target = '_blank'; a.rel = 'noopener';
  a.setAttribute('aria-label', 'Chat with us on WhatsApp');
  a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35m-5.42 7.4a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41z"/></svg><span>Chat on WhatsApp</span>';
  document.body.appendChild(a);
  var form = document.getElementById('start');
  if (form && 'IntersectionObserver' in window)
    new IntersectionObserver(function (e) { a.classList.toggle('hide', e[0].isIntersecting); }).observe(form);
})();
