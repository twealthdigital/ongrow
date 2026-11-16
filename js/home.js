(function(){
  var O = window.Ohgrow, $ = O.$;
  var SPRITE = 'assets/icons/sprite.svg?v=7#';

  O.ready.then(function(){
    /* hero entrance: headline slides up, logo draws and fills */
    document.body.classList.add('hero-in');
    var logo = $('#heroLogo');
    O.replay(logo);
    logo.addEventListener('click', function(){ O.replay(logo); });

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
  });
})();