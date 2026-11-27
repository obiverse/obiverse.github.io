/* The quote form: WhatsApp first, email as the fallback. No server, no tracker.
   Any link with data-svc="…" chooses that service in the form and scrolls to it. */
(function () {
  var WA = '12409750431', MAIL = 'obiversellc@gmail.com';
  var $ = function (id) { return document.getElementById(id); };

  /* /?svc=business#quote from the service pages */
  var KEYS = { diagnostic: 'Leak diagnostic', website: 'Website', payments: 'Website with payments' };
  var pre = KEYS[new URLSearchParams(location.search).get('svc')];
  if (pre && $('qs')) $('qs').value = pre;

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-svc]');
    if (a && $('qs')) $('qs').value = a.getAttribute('data-svc');
  });

  function form() {
    var v = function (id) { return $(id) ? $(id).value.trim() : ''; };
    var qs = $('qs'), svc = qs && qs.value ? qs.options[qs.selectedIndex].text : '';   /* with the price, in the money shown */
    return { name: v('qn'), phone: v('qp'), business: v('qb'), service: svc, details: v('qm') };
  }
  function check(d) {
    return !d.name ? 'Please enter your name.' : !d.phone ? 'Please enter your WhatsApp or phone number.' : !d.service ? 'Please choose what you need.' : '';
  }
  function say(msg, ok) {
    var el = $('form-status');
    el.textContent = msg; el.style.color = ok ? 'var(--gold)' : '#e5534b'; el.style.display = 'block';
  }
  function text(d, star) {
    var b = function (s) { return star ? '*' + s + '*' : s.toUpperCase(); };
    return [
      b('New enquiry') + ' (obiverse.github.io)', '',
      'Name: ' + d.name, d.business && 'Business: ' + d.business, 'Phone: ' + d.phone,
      'Needs: ' + d.service, d.details && ('\nWhat happened:\n' + d.details.slice(0, 1200))
    ].filter(Boolean).join('\n');
  }
  function open(url) {
    var a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  }

  window.go = function (e) {
    e.preventDefault();
    var d = form(), err = check(d);
    if (err) return say(err);
    open('https://wa.me/' + WA + '?text=' + encodeURIComponent(text(d, true)));
    say('Opening WhatsApp. Press send there, and we reply within 24 hours.', true);
  };
  window.sendEmail = function () {
    var d = form(), err = check(d);
    if (err) return say(err);
    location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Enquiry: ' + (d.business || d.name) + ' / ' + d.service) + '&body=' + encodeURIComponent(text(d, false));
    say('Opening your email app. We reply within 24 hours.', true);
  };
})();
