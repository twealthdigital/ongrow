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


/* custom dropdown for every <select> on the site: a styled button + listbox. The native select stays hidden as the source of truth,
   so forms, validation and .value keep working. Placeholder options (empty value, disabled) are not listed. */
(function(){
  var O = window.Ohgrow;
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); };
  var CHEV = '<svg class="i"><use href="assets/icons/sprite.svg?v=69#chev"/></svg>';
  function ddUpgrade(sel){
    if (!sel || sel.tagName !== 'SELECT' || sel.closest('.dd') || sel.hasAttribute('data-native') || sel.multiple) return;
    var w = document.createElement('div'), btn = document.createElement('button'), menu = document.createElement('ul'), hl = -1;
    w.className = 'dd'; btn.type = 'button'; btn.className = 'dd-btn'; btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    var lab = sel.getAttribute('aria-label'), grp = sel.closest('.sl-f'), gl = grp && grp.querySelector('.sl-l');
    if (lab || gl) btn.setAttribute('aria-label', lab || gl.firstChild.textContent.trim());
    menu.className = 'dd-menu'; menu.setAttribute('role', 'listbox');
    sel.parentNode.insertBefore(w, sel); w.appendChild(sel); sel.tabIndex = -1; w.appendChild(btn); w.appendChild(menu);
    var ph = function(o){ return !!o && o.disabled && o.value === ''; };
    var ok = function(i){ var o = sel.options[i]; return !!o && !o.disabled; };
    function paint(){
      var o = sel.options[sel.selectedIndex];
      btn.innerHTML = '<span>' + esc(o ? o.textContent : '') + '</span>' + CHEV;
      btn.classList.toggle('is-ph', ph(o)); btn.disabled = sel.disabled;
      menu.innerHTML = Array.prototype.map.call(sel.options, function(x, i){
        if (ph(x)) return '';
        return '<li class="dd-opt' + (x.disabled ? ' dis' : '') + '" role="option" data-i="' + i + '" aria-selected="' + (i === sel.selectedIndex) + '"' + (x.disabled ? ' aria-disabled="true"' : '') + '>' + esc(x.textContent) + '</li>';
      }).join('');
    }
    function mark(i){
      hl = i;
      Array.prototype.forEach.call(menu.children, function(li){ li.classList.toggle('hl', +li.dataset.i === hl); });
      var cur = menu.querySelector('.hl'); if (cur) cur.scrollIntoView({ block:'nearest' });
    }
    function move(from, dir){ var i = from + dir; while (i >= 0 && i < sel.options.length){ if (ok(i) && !ph(sel.options[i])) return i; i += dir; } return from; }
    function open(){
      var r = w.getBoundingClientRect(), need = Math.min(236, menu.scrollHeight) + 16;
      w.classList.toggle('up', window.innerHeight - r.bottom < need && r.top > need);
      w.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
      mark(ok(sel.selectedIndex) ? sel.selectedIndex : move(-1, 1));
    }
    function close(){ w.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    function pick(i){
      if (!ok(i)) return;
      if (i !== sel.selectedIndex){ sel.selectedIndex = i; sel.dispatchEvent(new Event('input', { bubbles:true })); sel.dispatchEvent(new Event('change', { bubbles:true })); }
      paint(); close();
    }
    btn.addEventListener('click', function(){ if (w.classList.contains('open')) close(); else open(); });
    menu.addEventListener('click', function(e){ var li = e.target.closest('.dd-opt'); if (li && !li.classList.contains('dis')){ pick(+li.dataset.i); btn.focus({ preventScroll:true }); } });
    btn.addEventListener('keydown', function(e){
      var isOpen = w.classList.contains('open');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); if (!isOpen) open(); else mark(move(hl, e.key === 'ArrowDown' ? 1 : -1)); }
      else if (e.key === 'Home' && isOpen){ e.preventDefault(); mark(move(-1, 1)); }
      else if (e.key === 'End' && isOpen){ e.preventDefault(); mark(move(sel.options.length, -1)); }
      else if ((e.key === 'Enter' || e.key === ' ') && isOpen){ e.preventDefault(); pick(hl); }
      else if (e.key === 'Escape' && isOpen){ e.stopPropagation(); close(); }
      else if (e.key === 'Tab') close();
    });
    document.addEventListener('click', function(e){ if (!w.contains(e.target)) close(); });
    sel.addEventListener('dd-sync', paint);
    if (sel.form) sel.form.addEventListener('reset', function(){ setTimeout(paint, 0); });
    paint();
  }
  O.dropdown = ddUpgrade;
  O.ready.then(function(){
    Array.prototype.forEach.call(document.querySelectorAll('select'), ddUpgrade);
    if ('MutationObserver' in window){
      new MutationObserver(function(ms){
        ms.forEach(function(m){ Array.prototype.forEach.call(m.addedNodes, function(n){
          if (n.nodeType !== 1) return;
          if (n.tagName === 'SELECT') ddUpgrade(n); else if (n.querySelectorAll) Array.prototype.forEach.call(n.querySelectorAll('select'), ddUpgrade);
        }); });
      }).observe(document.body, { childList:true, subtree:true });
    }
  });
})();
