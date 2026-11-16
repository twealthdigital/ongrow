(function(){
  var O = window.Ohgrow, $ = O.$;
  var msgs = ['Preparing the soil', 'Planting your listings', 'Watering the market', 'Ready to grow'];
  var bar = $('#barFill'), pct = $('#pct'), msg = $('#loadMsg');
  var dur = O.reduce ? 500 : 3000, t0 = performance.now();

  O.replay($('#loaderLogo'));

  (function tick(t){
    var p = Math.min(1, (t - t0) / dur);
    var e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    bar.style.transform = 'scaleX(' + e + ')';
    pct.textContent = Math.round(e * 100);
    msg.textContent = msgs[Math.min(msgs.length - 1, Math.floor(e * msgs.length))];
    if (p < 1) requestAnimationFrame(tick);
    else O.go('onboarding.html');
  })(t0);
})();