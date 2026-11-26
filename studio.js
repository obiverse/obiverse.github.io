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
