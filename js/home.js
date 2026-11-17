(function(){
  var O = window.Ohgrow, $ = O.$;
  var SPRITE = 'assets/icons/sprite.svg?v=31#';

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
/* vertical curved carousel: cards stay upright and sit on a ")" arc, the centre card sticks out furthest */
(function(){
  var O = window.Ohgrow;
  O.ready.then(function(){
    var stage = document.getElementById('arcStage');
    if(!stage) return;
    var cards = Array.prototype.slice.call(stage.querySelectorAll('.arc-card'));
    var n = cards.length, half = Math.floor(n / 2), active = 0, timer = null;
    var prevOff = cards.map(function(_, i){ return off(i); });

    function off(i){ var k = ((i - active) % n + n) % n; return k > half ? k - n : k; }
    function cs(name){ return parseFloat(getComputedStyle(stage).getPropertyValue(name)) || 0; }

    function render(){
      var gap = cs('--gap'), R = cs('--R'), vis = 2;
      cards.forEach(function(c, i){
        var k = off(i), y = k * gap;
        var x = R * (Math.sqrt(1 - Math.pow(Math.min(Math.abs(y) / R, .98), 2)) - 1);   /* 0 at centre, pulls left going up/down */
        var s = 1 - Math.abs(k) * .06;
        var jump = Math.abs(k - prevOff[i]) > 1;
        if(jump) c.style.transition = 'none';
        c.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
        c.style.zIndex = 10 - Math.abs(k);
        c.classList.toggle('is-active', k === 0);
        c.classList.toggle('is-hidden', Math.abs(k) > vis);
        c.setAttribute('aria-hidden', Math.abs(k) > vis ? 'true' : 'false');
        c.querySelector('a').tabIndex = Math.abs(k) > vis ? -1 : 0;
        if(jump){ void c.offsetWidth; c.style.transition = ''; }
        prevOff[i] = k;
      });
    }
    function go(d){ active = ((active + d) % n + n) % n; render(); }

    var moved = false;
    document.getElementById('arcNext').addEventListener('click', function(){ go(1); restart(); });
    document.getElementById('arcPrev').addEventListener('click', function(){ go(-1); restart(); });
    cards.forEach(function(c, i){
      c.addEventListener('click', function(e){
        if(moved) return;
        var k = off(i);
        if(k !== 0 && !e.target.closest('a')){ e.preventDefault(); go(k); restart(); }
      });
    });

    /* mouse drag up / down (touch keeps normal page scrolling; use the arrows or tap a card) */
    var sy = 0, dy = 0, down = false;
    stage.addEventListener('pointerdown', function(e){ if(e.pointerType !== 'mouse') return; down = true; moved = false; sy = e.clientY; dy = 0; });
    window.addEventListener('pointermove', function(e){
      if(!down) return; dy = e.clientY - sy;
      if(Math.abs(dy) > 8){ moved = true; stage.classList.add('drag'); }
    });
    window.addEventListener('pointerup', function(){
      if(!down) return; down = false; stage.classList.remove('drag');
      if(Math.abs(dy) > 40){ go(dy < 0 ? 1 : -1); restart(); }
      setTimeout(function(){ moved = false; }, 0);
    });
    stage.addEventListener('dragstart', function(e){ e.preventDefault(); });

    /* auto-advance (off for reduced motion, paused on hover / hidden tab) */
    function start(){ if(O.reduce || timer) return; timer = setInterval(function(){ go(1); }, 3600); }
    function stop(){ clearInterval(timer); timer = null; }
    function restart(){ stop(); start(); }
    stage.addEventListener('mouseenter', stop);
    stage.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });
    window.addEventListener('resize', render);

    render(); start();
  });
})();
