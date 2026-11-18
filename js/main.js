/* Shared helpers. Every page loads this first. */
window.Ohgrow = (function(){
  /* signed-in visitors never see the Sell tab. Marked here, before the header is loaded, so it never flashes. */
  try{ var sess = JSON.parse(localStorage.getItem('ohgrow.session')); if (sess && sess.email) document.documentElement.classList.add('is-authed'); }catch(_){}
  var $ = function(s, r){ return (r || document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* restart a CSS animation */
  function replay(el){
    el.classList.remove('play');
    void el.offsetWidth;
    el.classList.add('play');
  }

  /* load reusable pieces: <div data-include="components/header.html"></div> */
  function include(){
    var nodes = $$('[data-include]');
    return Promise.all(nodes.map(function(n){
      var url = n.getAttribute('data-include');
      return fetch(url, { cache: 'no-cache' })
        .then(function(r){
          if (!r.ok) throw new Error('Could not load ' + url);
          return r.text();
        })
        .then(function(html){ n.outerHTML = html; })
        .catch(function(err){ console.error(err); });
    }));
  }

  /* fade out, then open another page */
  function go(url){
    document.body.classList.add('leaving');
    setTimeout(function(){ window.location.href = url; }, reduce ? 0 : 450);
  }

  window.addEventListener('pageshow', function(e){
    if (e.persisted) document.body.classList.remove('leaving');
  });

  return { $: $, $$: $$, reduce: reduce, replay: replay, go: go, ready: include() };
})();