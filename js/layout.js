/* Header, side rail, mobile taskbar and slide panel behaviour. Used by every page that has the site shell. */
(function(){
  var O = window.Ohgrow, $ = O.$, $$ = O.$$;

  O.ready.then(function(){
    var panel = $('#panel'), scrim = $('#scrim'), burger = $('#burger'), closeBtn = $('#closePanel');

    /* highlight the link for the current page: <body data-page="home"> */
    var page = document.body.dataset.page;
    $$('[data-nav]').forEach(function(a){
      var on = a.dataset.nav === page;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'page');
    });

    /* slide panel */
    function openPanel(){
      panel.inert = false;
      panel.classList.add('open');
      scrim.classList.add('open');
      burger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('lock');
      setTimeout(function(){ closeBtn.focus({ preventScroll: true }); }, 50);
    }
    function closePanel(){
      if (!panel.classList.contains('open')) return;
      panel.classList.remove('open');
      scrim.classList.remove('open');
      panel.inert = true;
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('lock');
    }
    if (panel && burger){
      burger.addEventListener('click', openPanel);
      closeBtn.addEventListener('click', function(){ closePanel(); burger.focus({ preventScroll: true }); });
      scrim.addEventListener('click', closePanel);
      panel.addEventListener('click', function(e){ if (e.target.closest('a')) closePanel(); });
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closePanel(); });
      window.matchMedia('(min-width:1100px)').addEventListener('change', function(m){ if (m.matches) closePanel(); });
    }

    /* replay intro */
    $$('.replay').forEach(function(b){
      b.addEventListener('click', function(){ closePanel(); O.go('onboarding.html'); });
    });
  });
})();