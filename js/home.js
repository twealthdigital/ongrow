(function(){
  var O = window.Ohgrow, $ = O.$;
  var SPRITE = 'assets/icons/sprite.svg?v=47#';

  O.ready.then(function(){
    /* hero entrance: headline slides up, hero image */
    document.body.classList.add('hero-in');

    /* counter: numbers count up once when they scroll into view */
    var nums = document.querySelectorAll('.stat b[data-count]');
    function run(el){
      var to = +el.getAttribute('data-count'), suf = el.getAttribute('data-suffix') || '';
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){ el.textContent = to + suf; return; }
      var t0 = null, dur = 1400;
      function step(t){
        if(!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(to * e) + suf;
        if(k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting){ run(e.target); io.unobserve(e.target); } });
      }, { threshold: .6 });
      nums.forEach(function(n){ io.observe(n); });
    }
  });
})();
/* vertical curved carousel: cards stay upright on a ")" arc. Position is continuous so a finger / mouse drag
   moves the cards 1:1, and letting go flicks with momentum then snaps to the nearest card */
(function(){
  var O = window.Ohgrow;
  O.ready.then(function(){
    var stage = document.getElementById('arcStage');
    if(!stage) return;
    var cards = Array.prototype.slice.call(stage.querySelectorAll('.arc-card'));
    var n = cards.length, half = n / 2, vis = 2;
    var pos = 0, raf = 0, timer = null, gap = 0, R = 0;
    var RATIO = 1.5;                       /* finger travel -> card travel (higher = faster) */

    function cs(name){ return parseFloat(getComputedStyle(stage).getPropertyValue(name)) || 0; }
    function measure(){ gap = cs('--gap'); R = cs('--R'); }
    function off(i){ var k = ((i - pos) % n + n) % n; return k >= half ? k - n : k; }   /* -n/2 .. n/2 */

    function render(){
      cards.forEach(function(c, i){
        var k = off(i), a = Math.abs(k), y = k * gap;
        var x = R * (Math.sqrt(1 - Math.pow(Math.min(Math.abs(y) / R, .98), 2)) - 1);   /* 0 at centre, pulls left going up/down */
        var s = 1 - Math.min(a, 2) * .06;
        var op = Math.max(0, Math.min(1, (vis + .5 - a) / .5));                          /* fades out before it wraps round */
        var hid = a > vis + .25;
        c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + s.toFixed(3) + ')';
        c.style.opacity = op.toFixed(3);
        c.style.zIndex = Math.round(100 - a * 10);
        c.classList.toggle('is-active', a < .5);
        c.classList.toggle('is-hidden', hid);
        c.setAttribute('aria-hidden', hid ? 'true' : 'false');
        var l = c.querySelector('a'); if(l) l.tabIndex = hid ? -1 : 0;
      });
      syncDetail();
    }

    function animateTo(target, dur){
      cancelAnimationFrame(raf);
      if(O.reduce){ pos = ((target % n) + n) % n; render(); return; }
      var from = pos, t0 = null;
      dur = dur || Math.min(900, 380 + Math.abs(target - from) * 140);
      function step(t){
        if(!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        pos = from + (target - from) * e;
        if(k >= 1) pos = ((target % n) + n) % n;
        render();
        if(k < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }
    function go(d){ animateTo(Math.round(pos) + d); }

    var moved = false;
    document.getElementById('arcNext').addEventListener('click', function(){ go(1); restart(); });
    document.getElementById('arcPrev').addEventListener('click', function(){ go(-1); restart(); });
    cards.forEach(function(c, i){
      c.addEventListener('click', function(e){
        if(moved || e.target.closest('a')) return;
        var k = Math.round(off(i));
        if(k !== 0){ e.preventDefault(); go(k); restart(); }
      });
    });

    /* touch + mouse drag up / down: follows the finger, flicks with momentum */
    var sy = 0, startPos = 0, down = false, pid = null, samples = [];
    stage.addEventListener('pointerdown', function(e){
      if(e.pointerType === 'mouse' && e.button !== 0) return;
      cancelAnimationFrame(raf); stop();
      down = true; moved = false; pid = e.pointerId; sy = e.clientY; startPos = pos;
      samples = [{ t: e.timeStamp, y: e.clientY }];
    });
    stage.addEventListener('pointermove', function(e){
      if(!down || e.pointerId !== pid) return;
      var dy = e.clientY - sy;
      if(!moved){
        if(Math.abs(dy) < 6) return;
        moved = true; stage.classList.add('drag');
        try{ stage.setPointerCapture(pid); }catch(_){}
      }
      pos = startPos - dy * RATIO / gap;
      samples.push({ t: e.timeStamp, y: e.clientY });
      while(samples.length > 2 && e.timeStamp - samples[0].t > 100) samples.shift();
      render();
    });
    function end(e){
      if(!down || e.pointerId !== pid) return;
      down = false; stage.classList.remove('drag');
      if(moved){
        var a = samples[0], b = samples[samples.length - 1];
        var v = b.t > a.t ? (b.y - a.y) / (b.t - a.t) : 0;            /* px per ms, negative = finger moving up */
        var base = Math.round(startPos);
        var target = Math.round(pos - v * RATIO * 240 / gap);
        target = Math.max(base - 4, Math.min(base + 4, target));
        animateTo(target);
      }
      restart();
      setTimeout(function(){ moved = false; }, 0);
    }
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('dragstart', function(e){ e.preventDefault(); });

    /* ---- product view: a panel beside the cards (tablet / desktop) that follows the active card;
            on phones View slides the carousel out, the container turns black and the same view slides in ---- */
    var arc = document.getElementById('arc'), panel = document.getElementById('arcDetail');
    var side = window.matchMedia('(min-width:700px)');
    var $ = function(id){ return document.getElementById(id); };
    var dBody = $('adBody');
    var cur = { i: -1, qty: 1, price: 0, name: '', unit: '' }, detailOpen = false, idleT = null, lastIdx = -1, addT = null;
    function money(v){ return '₦' + v.toLocaleString('en-NG'); }
    function qtyUI(){ $('adQty').textContent = cur.qty; $('adTotal').textContent = money(cur.price * cur.qty); $('adMinus').disabled = cur.qty <= 1; $('adPlus').disabled = cur.qty >= 99; }
    function fill(i){
      var c = cards[i], d = c.dataset, img = c.querySelector('img.arc-cut');
      cur.i = i; lastIdx = i; cur.qty = 1;
      cur.name = c.querySelector('h3').textContent;
      cur.price = parseInt(c.querySelector('.arc-price b').textContent.replace(/\D/g, ''), 10) || 0;
      cur.unit = c.querySelector('.arc-price span').textContent;
      $('adCat').textContent = d.cat || '';
      $('adName').textContent = cur.name;
      $('adPrice').textContent = money(cur.price);
      $('adUnit').textContent = cur.unit;
      $('adDesc').textContent = d.desc || '';
      $('adImg').src = img ? img.getAttribute('src') : 'assets/images/product-image.png';
      var add = $('adAdd'); clearTimeout(addT); add.classList.remove('is-added'); add.querySelector('span').textContent = 'Add to cart';
      qtyUI();
      dBody.classList.remove('in'); void dBody.offsetWidth; dBody.classList.add('in');
    }
    function syncDetail(){                                    /* tablet / desktop: follow whichever card is in the middle */
      if(detailOpen || !side.matches) return;
      var idx = ((Math.round(pos) % n) + n) % n;
      if(idx !== lastIdx) fill(idx);
    }
    function openDetail(i){                                   /* phone */
      detailOpen = true; stop(); clearTimeout(idleT);
      fill(i);
      arc.style.height = arc.offsetHeight + 'px'; void arc.offsetWidth;
      arc.classList.add('is-detail');
      arc.style.height = Math.max(stage.offsetHeight, panel.offsetHeight) + 'px';
      stage.inert = true; panel.inert = false;
      $('arcBack').focus({ preventScroll: true });
    }
    function closeDetail(restoreFocus){
      if(!detailOpen) return;
      detailOpen = false;
      arc.classList.remove('is-detail');
      arc.style.height = stage.offsetHeight + 'px';
      setTimeout(function(){ if(!detailOpen) arc.style.height = ''; }, 650);
      stage.inert = false; panel.inert = true;
      if(restoreFocus){ var l = cards[cur.i] && cards[cur.i].querySelector('a'); if(l) l.focus({ preventScroll: true }); }
      start();
    }
    function syncMode(){
      if(side.matches){
        if(detailOpen){ detailOpen = false; arc.classList.remove('is-detail'); arc.style.height = ''; stage.inert = false; }
        panel.inert = false; lastIdx = -1; syncDetail(); start();
      } else if(!detailOpen){ panel.inert = true; }
    }
    function hold(){ stop(); clearTimeout(idleT); if(!detailOpen) idleT = setTimeout(start, 9000); }   /* using the panel pauses auto-scroll */

    cards.forEach(function(c, i){                              /* phone: View opens the product view */
      var l = c.querySelector('a');
      if(l) l.addEventListener('click', function(e){
        if(moved){ e.preventDefault(); return; }
        if(!side.matches){ e.preventDefault(); openDetail(i); }
      });
    });
    $('arcBack').addEventListener('click', function(){ closeDetail(true); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeDetail(true); });
    $('adMinus').addEventListener('click', function(){ cur.qty = Math.max(1, cur.qty - 1); qtyUI(); hold(); });
    $('adPlus').addEventListener('click', function(){ cur.qty = Math.min(99, cur.qty + 1); qtyUI(); hold(); });
    $('adAdd').addEventListener('click', function(){
      var b = this, t = b.querySelector('span');
      document.dispatchEvent(new CustomEvent('ohgrow:add-to-cart', { detail: { name: cur.name, qty: cur.qty, unit: cur.unit, price: cur.price } }));
      b.classList.add('is-added'); t.textContent = 'Added · ' + cur.qty + ' in cart';
      clearTimeout(addT); addT = setTimeout(function(){ b.classList.remove('is-added'); t.textContent = 'Add to cart'; }, 2000);
      hold();
    });
    panel.addEventListener('mouseenter', stop);
    panel.addEventListener('mouseleave', function(){ if(!detailOpen) start(); });
    panel.addEventListener('pointerdown', hold);
    panel.addEventListener('focusin', hold);
    if(side.addEventListener) side.addEventListener('change', syncMode); else side.addListener(syncMode);

    /* auto-advance (off for reduced motion, paused on hover / drag / hidden tab) */
    function start(){ if(O.reduce || timer || detailOpen) return; timer = setInterval(function(){ go(1); }, 3600); }
    function stop(){ clearInterval(timer); timer = null; }
    function restart(){ stop(); start(); }
    stage.addEventListener('mouseenter', stop);
    stage.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });
    window.addEventListener('resize', function(){ measure(); render(); });

    measure(); render(); syncMode(); start();
  });
})();
