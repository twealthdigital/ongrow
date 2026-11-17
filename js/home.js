(function(){
  var O = window.Ohgrow, $ = O.$;
  var SPRITE = 'assets/icons/sprite.svg?v=22#';

  O.ready.then(function(){
    /* hero entrance: headline slides up, hero image */
    document.body.classList.add('hero-in');

    /* mobile/tablet: make the hero image end just inside the bottom of the featured card */
    var mq = window.matchMedia('(max-width:1099.98px)');
    function fitHero(){
      var root = document.getElementById('home'), h = document.querySelector('.hero'),
          st = document.querySelector('.stats'), f = document.querySelector('.hero-art .float');
      if(!root || !h || !st) return;
      if(mq.matches){
        var fh = f ? f.getBoundingClientRect().height : 0;
        var fy = f ? (parseFloat(getComputedStyle(f).getPropertyValue('--fy')) || 0) : 0;
        var ov = Math.max(0, Math.round(fh + fy));   /* how far the broccoli reaches up into the image */
        var d = st.getBoundingClientRect().bottom - h.getBoundingClientRect().bottom + ov + 14;
        root.style.setProperty('--ext', Math.max(0, Math.round(d)) + 'px');
        root.style.setProperty('--ov', ov + 'px');
      } else {
        root.style.removeProperty('--ext');
        root.style.removeProperty('--ov');
      }
    }
    fitHero();
    window.addEventListener('resize', fitHero);
    window.addEventListener('load', fitHero);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitHero);

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