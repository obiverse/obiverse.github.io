/* Prices in the visitor's money: naira in Nigeria, dollars everywhere else. Each element with
   data-usd swaps its text; a [data-cur] button switches and is remembered. Without JS: naira.
   FlowLedger has no data-usd: it is a Nigerian service, priced in naira wherever the owner is. */
(function () {
  var tz = '', saved = null;
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  try { saved = localStorage.getItem('cur'); } catch (e) {}
  function set(cur) {
    document.querySelectorAll('[data-usd]').forEach(function (el) {
      if (!el.hasAttribute('data-ngn')) el.setAttribute('data-ngn', el.textContent);
      el.textContent = el.getAttribute(cur === 'USD' ? 'data-usd' : 'data-ngn');
    });
    document.querySelectorAll('[data-cur]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-cur') === cur));
    });
  }
  set(saved === 'USD' || saved === 'NGN' ? saved : tz === 'Africa/Lagos' ? 'NGN' : 'USD');
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-cur]');
    if (!b) return;
    var cur = b.getAttribute('data-cur');
    try { localStorage.setItem('cur', cur); } catch (x) {}
    set(cur);
  });
})();
