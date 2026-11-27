/* The home page's living parts: glass that drifts with the pointer, and the console of systems you can own.
   Everything runs only while on screen. With reduced motion, each screen simply shows its finished state. */
(function () {
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches;
  function seen(el, cb) {
    if (!('IntersectionObserver' in window)) return cb(true);
    new IntersectionObserver(function (e) { cb(e[0].isIntersecting); }, { threshold: 0.25 }).observe(el);
  }

  /* Hero: the floating cards drift against the pointer, so the scene has depth */
  var hero = document.querySelector('.hero.night');
  if (hero && fine && !still) hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    hero.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    hero.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  }, { passive: true });

  /* Cards lean toward the pointer */
  if (fine && !still) document.querySelectorAll('.door, #work .card').forEach(function (c) {
    c.classList.add('tilt');
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 7).toFixed(2) + 'deg');
      c.style.setProperty('--rx', (((e.clientY - r.top) / r.height - 0.5) * -6).toFixed(2) + 'deg');
    });
    c.addEventListener('pointerleave', function () { c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); });
  });

  var runs = [], visible = false;
  function later(f, ms) { runs.push(setTimeout(f, ms)); }
  function clear() { runs.forEach(clearTimeout); runs = []; }

  /* Each screen plays its own short story, then rests on the finished state */
  var PLAY = {
    'os-money': function (p, stage) {
      var feed = p.querySelector('.feed'), rows = [].slice.call(feed.children);
      if (still) return;
      p.querySelectorAll('.kpis b[data-to]').forEach(function (b) {
        var to = +b.dataset.to, s = performance.now();
        (function step(n) {
          var k = Math.min(1, (n - s) / 1400), v = to * (1 - Math.pow(1 - k, 3));
          b.textContent = '₦' + v.toFixed(1) + 'M';
          if (k < 1 && visible) requestAnimationFrame(step); else b.textContent = '₦' + to.toFixed(1) + 'M';
        })(s);
      });
      feed.innerHTML = '';
      rows.slice().reverse().forEach(function (r, i) { later(function () { feed.insertBefore(r, feed.firstChild); }, 500 + i * 900); });
      later(function () { stage.classList.remove('wait'); }, 500 + rows.length * 900 + 300);
      return true;
    },
    'os-web': function (p, stage) {
      var imgs = [].slice.call(p.querySelectorAll('.shots img')), url = p.querySelector('.url'), k = 0;
      function show() { imgs.forEach(function (m, i) { m.classList.toggle('on', i === k); }); url.textContent = imgs[k].dataset.url; }
      show();
      if (still) return;
      later(function () { stage.classList.remove('wait'); }, 700);
      later(function () { k = 1; show(); }, 3200);
      later(function () { k = 2; show(); }, 6000);
      return true;
    },
    'os-plat': function (p, stage) {
      if (still) return;
      later(function () { stage.classList.remove('wait'); }, 500);
      return true;
    }
  };

  /* A page that shows one system on its own plays it once, when it comes into view */
  document.querySelectorAll('.os-stage[data-solo]').forEach(function (st) {
    var p = st.querySelector('.os-panel'), done = false;
    if (fine && !still) lean(st);
    seen(st, function (v) {
      visible = v;
      if (v && !done) { done = true; st.classList.add('wait'); if (!PLAY[p.id](p, st)) st.classList.remove('wait'); }
    });
  });

  function lean(st) {
    st.addEventListener('pointermove', function (e) {
      var r = st.getBoundingClientRect();
      st.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 10).toFixed(2) + 'deg');
      st.style.setProperty('--rx', (((e.clientY - r.top) / r.height - 0.5) * -6).toFixed(2) + 'deg');
    });
    st.addEventListener('pointerleave', function () { st.style.removeProperty('--rx'); st.style.removeProperty('--ry'); });
  }

  /* The console on the home page: three systems, one after another */
  var os = document.querySelector('[data-os]');
  if (!os) return;
  var tabs = [].slice.call(os.querySelectorAll('[role=tab]'));
  var stage = os.querySelector('.os-stage');
  var notes = [].slice.call(document.querySelectorAll('.os-note [data-for]'));
  var cur = 0, auto = !still, t0 = 0, raf = 0;
  var DWELL = 9000;

  function select(i, user) {
    if (user) auto = false;
    cur = (i + tabs.length) % tabs.length;
    clear();
    tabs.forEach(function (t, j) {
      var on = j === cur, panel = document.getElementById(t.getAttribute('aria-controls'));
      t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
      t.style.setProperty('--p', auto ? '0%' : '100%');
      panel.hidden = !on;
    });
    notes.forEach(function (a) { a.hidden = a.dataset.for !== tabs[cur].id; });
    var id = tabs[cur].getAttribute('aria-controls');
    stage.classList.add('wait');
    if (!PLAY[id](document.getElementById(id), stage)) stage.classList.remove('wait');
    t0 = performance.now();
  }

  /* the gold line under the open tab fills while it plays, then the next one opens */
  function tick(n) {
    raf = 0;
    if (!auto || !visible) return;
    var k = (n - t0) / DWELL;
    tabs[cur].style.setProperty('--p', Math.min(100, k * 100) + '%');
    if (k >= 1) select(cur + 1);
    raf = requestAnimationFrame(tick);
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(i, true); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (d) { e.preventDefault(); select(cur + d, true); tabs[cur].focus(); }
    });
  });

  if (fine && !still) lean(stage);

  var started = false;
  seen(stage, function (v) {
    visible = v;
    if (v && !started) { started = true; select(0); }
    if (v && auto && !raf) { t0 = performance.now() - (parseFloat(tabs[cur].style.getPropertyValue('--p')) || 0) / 100 * DWELL; raf = requestAnimationFrame(tick); }
  });
})();
