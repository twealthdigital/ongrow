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


    /* desktop rail: the top button is the menu toggle. X while the rail is open; press it and the rail folds away
       and the button shows three staggered dashes. The choice is remembered. */
    var rail = $('.rail'), rt = $('#railToggle');
    if (rail && rt){
      var RKEY = 'ohgrow.rail', rlinks = $('#railLinks');
      var setRail = function(open, save){
        rail.classList.toggle('is-collapsed', !open);
        rt.setAttribute('aria-expanded', open ? 'true' : 'false');
        rt.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        rt.title = open ? 'Close menu' : 'Open menu';
        if (rlinks) rlinks.inert = !open;
        if (save){ try{ localStorage.setItem(RKEY, open ? 'open' : 'closed'); }catch(_){} }
      };
      var savedRail = null; try{ savedRail = localStorage.getItem(RKEY); }catch(_){}
      rail.classList.add('rail-init');
      setRail(savedRail !== 'closed', false);
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ rail.classList.remove('rail-init'); }); });
      rt.addEventListener('click', function(){ setRail(rail.classList.contains('is-collapsed'), true); });
    }

    /* header turns transparent over the green hero on the home page (mobile) */
    var head = $('.head'), hero = $('.hero');
    function syncHead(){
      if (!head) return;
      var over = !!hero && hero.getBoundingClientRect().bottom > head.offsetHeight;
      head.classList.toggle('on-hero', over);
      head.classList.toggle('is-solid', !over);
      head.classList.toggle('is-scrolled', window.scrollY > 4);
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

    /* desktop header: a dark pill slides to the clicked link, then the page loads */
    var pill = $('.nav-pill');
    if (pill){
      var ind = document.createElement('span');
      ind.className = 'nav-ind';
      ind.setAttribute('aria-hidden', 'true');
      pill.insertBefore(ind, pill.firstChild);
      var place = function(){
        var cur = pill.querySelector('a.is-active');
        if (!cur || !cur.offsetWidth){ ind.classList.remove('on'); pill.classList.remove('has-ind'); return; }
        ind.style.width = cur.offsetWidth + 'px';
        ind.style.transform = 'translateX(' + cur.offsetLeft + 'px)';
        ind.classList.add('on');
        pill.classList.add('has-ind');
      };
      O.placePill = place;
      place();
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ ind.classList.add('anim'); }); });
      window.addEventListener('resize', place);
      window.addEventListener('load', place);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
      pill.addEventListener('click', function(e){
        var a = e.target.closest('a');
        if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        if (a.classList.contains('is-active')) return;
        e.preventDefault();
        $$('a', pill).forEach(function(x){ x.classList.remove('is-active'); });
        a.classList.add('is-active');
        place();
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
/* bottom dock: dark pill over light screens, greenish white pill over dark or green ones.
   It looks at the colour of whatever sits behind it (left, middle and right of the pill) and flips with the scroll. */
(function(){
  var O = window.Ohgrow;
  O.ready.then(function(){
    var dock = document.querySelector('.dock'); if (!dock) return;
    var tick = false, cur = '';
    function rgba(c){ var m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return { r:p[0], g:p[1], b:p[2], a:p.length > 3 ? p[3] : 1 }; }
    function darkAt(x, y){
      var els = document.elementsFromPoint(x, y);
      for (var i = 0; i < els.length; i++){
        var el = els[i];
        if (dock.contains(el) || el.classList.contains('m-scrim') || el.classList.contains('au-scrim')) continue;
        var c = rgba(getComputedStyle(el).backgroundColor);
        if (c && c.a >= .6) return (.2126 * c.r + .7152 * c.g + .0722 * c.b) / 255 < .5;
      }
      return false;
    }
    function sync(){
      tick = false;
      var r = dock.getBoundingClientRect(); if (!r.width) return;
      var y = r.top + r.height / 2, dark = 0;
      [r.left + 22, r.left + r.width / 2, r.right - 22].forEach(function(x){ if (darkAt(x, y)) dark++; });
      var t = dark >= 2 ? 'dark' : 'light';
      if (t !== cur){ cur = t; dock.dataset.behind = t; }
    }
    function queue(){ if (!tick){ tick = true; requestAnimationFrame(sync); } }
    window.addEventListener('scroll', queue, { passive:true });
    window.addEventListener('resize', queue);
    window.addEventListener('load', queue);
    setTimeout(queue, 400); setTimeout(queue, 1200); sync();
  });
})();
