(function(){
  var O = window.Ohgrow, $ = O.$;
  var SPRITE = 'assets/icons/sprite.svg?v=21#';

  O.ready.then(function(){
    /* hero entrance: headline slides up, hero image */
    document.body.classList.add('hero-in');

    /* featured harvest card */
    var feats = [
      { name: 'Fresh tomatoes',   sym: 'tomato',   tile: '#FBE3DC', text: 'A basket from Ekaette Udoh in Uyo' },
      { name: 'White yam tubers', sym: 'yam',      tile: '#F3E7D6', text: 'Ten tubers from Chidi Okafor in Otukpo' },
      { name: 'Ripe plantain',    sym: 'plantain', tile: '#FBF0C8', text: 'A bunch from Blessing Etim in Ikot Ekpene' }
    ];
    var fi = 0;
    function showFeat(n){
      fi = (n + feats.length) % feats.length;
      var p = feats[fi];
      $('#featUse').setAttribute('href', SPRITE + p.sym);
      $('#featTile').style.setProperty('--tile', p.tile);
      $('#featName').textContent = p.name;
      $('#featText').textContent = p.text;
      $('#featCount').textContent = (fi + 1) + ' / ' + feats.length;
    }
    $('#featPrev').addEventListener('click', function(){ showFeat(fi - 1); });
    $('#featNext').addEventListener('click', function(){ showFeat(fi + 1); });
    showFeat(0);

    /* mobile/tablet: make the hero image end just inside the bottom of the featured card */
    var mq = window.matchMedia('(max-width:1099.98px)');
    function fitHero(){
      var h = document.querySelector('.hero'), f = document.querySelector('.feat');
      if(!h || !f) return;
      if(mq.matches){
        var d = f.getBoundingClientRect().bottom - h.getBoundingClientRect().bottom - 14;
        h.style.setProperty('--ext', Math.max(0, Math.round(d)) + 'px');
      } else {
        h.style.removeProperty('--ext');
      }
    }
    fitHero();
    window.addEventListener('resize', fitHero);
    window.addEventListener('load', fitHero);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitHero);
    $('#featPrev').addEventListener('click', function(){ setTimeout(fitHero, 0); });
    $('#featNext').addEventListener('click', function(){ setTimeout(fitHero, 0); });
  });
})();