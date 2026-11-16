(function(){
  var O = window.Ohgrow, $ = O.$, $$ = O.$$;
  var slides = $$('.slide'), dots = $$('.dot'), idx = 0;
  var prev = $('#prev'), next = $('#next'), nextLabel = $('#nextLabel');

  function show(n){
    idx = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach(function(s, k){
      var on = k === idx;
      s.classList.toggle('is-active', on);
      s.inert = !on;
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    dots.forEach(function(d, k){ d.classList.toggle('on', k === idx); });
    prev.disabled = idx === 0;
    nextLabel.textContent = idx === slides.length - 1 ? 'Enter Ohgrow' : 'Next';
  }
  function finish(){ O.go('home.html'); }

  next.addEventListener('click', function(){ idx === slides.length - 1 ? finish() : show(idx + 1); });
  prev.addEventListener('click', function(){ show(idx - 1); });
  $('#skip').addEventListener('click', finish);

  document.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight') next.click();
    if (e.key === 'ArrowLeft') prev.click();
  });

  /* swipe on phones */
  var sx = null;
  document.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', function(e){
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 60){ dx < 0 ? next.click() : prev.click(); }
  });

  show(0);
  next.focus({ preventScroll: true });
})();