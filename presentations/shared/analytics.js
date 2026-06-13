/*
  Shared analytics + search-engine verification for every presentation deck.
  ───────────────────────────────────────────────────────────────────────────
  Presentations are standalone static HTML (no Jekyll front matter), so they do
  NOT inherit the site's _includes/analytics.html or seo.html. This single file
  is the one source of truth for tracking across all decks. Reference it once
  from each deck's <head>:

      <script src="/presentations/shared/analytics.js" defer></script>

  Keep the IDs below in sync with _config.yml:
    - GA_ID   ← analytics.google.tracking_id
    - GOOGLE_SITE_VERIFICATION ← google_site_verification
    - BING_SITE_VERIFICATION   ← bing_site_verification (leave '' if unset)
*/
(function () {
  var GA_ID = 'G-F5D6T2RBL4';
  var GOOGLE_SITE_VERIFICATION = '5Fb-UZxtHNEsTwTGjm2rp1kDo0_cKplvYlMXwBdIsiM';
  var BING_SITE_VERIFICATION = '';

  // Skip on local development so dev page views aren't counted.
  var host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '' || host === '0.0.0.0') {
    return;
  }

  function addVerificationMeta(name, content) {
    if (!content) return;
    if (document.querySelector('meta[name="' + name + '"]')) return;
    var meta = document.createElement('meta');
    meta.setAttribute('name', name);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }

  addVerificationMeta('google-site-verification', GOOGLE_SITE_VERIFICATION);
  addVerificationMeta('msvalidate.01', BING_SITE_VERIFICATION);

  // Google Analytics (gtag.js)
  if (GA_ID) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }
})();
