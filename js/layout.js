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


    /* header turns transparent over the green hero on the home page (mobile) */
    var head = $('.head'), hero = $('.hero');
    function syncHead(){
      if (!head) return;
      var over = !!hero && hero.getBoundingClientRect().bottom > head.offsetHeight;
      head.classList.toggle('on-hero', over);
      head.classList.toggle('is-solid', !over);
    }
    syncHead();
    window.addEventListener('scroll', syncHead, { passive: true });
    window.addEventListener('resize', syncHead);

    /* bottom dock: tapping an icon opens it to show the name, then goes to the page */
    var dock = $('.dock');
    if (dock){
      dock.addEventListener('click', function(e){
        var a = e.target.closest('a');
        if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (a.classList.contains('is-active')) return;
        e.preventDefault();
        $$('a', dock).forEach(function(x){ x.classList.remove('open'); });
        dock.classList.add('has-open');
        a.classList.add('open');
        setTimeout(function(){ O.go(a.getAttribute('href')); }, O.reduce ? 0 : 380);
      });
    }

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
    }

    /* replay intro */
    $$('.replay').forEach(function(b){
      b.addEventListener('click', function(){ closePanel(); O.go('onboarding.html'); });
    });
  });
})();