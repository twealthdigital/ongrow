/* Farmer guide: the open step decides what the sample listing shows. */
(function(){
  var O = window.Ohgrow, $ = O.$, $$ = O.$$;
  O.ready.then(function(){
    var list = $('#gList'), stage = $('#gStage'); if (!list || !stage) return;
    var rows = $$('.g-row', list), mobile = window.matchMedia('(max-width:1099.98px)');

    function open(row, focusStage){
      rows.forEach(function(r){
        var on = r === row;
        r.classList.toggle('is-on', on);
        r.querySelector('.g-h').setAttribute('aria-expanded', on);
      });
      stage.dataset.step = row.dataset.step;
      if (focusStage && mobile.matches) setTimeout(function(){ stage.scrollIntoView({ behavior: O.reduce ? 'auto' : 'smooth', block: 'center' }); }, 80);
    }
    list.addEventListener('click', function(e){
      var h = e.target.closest('.g-h'); if (!h) return;
      var row = h.closest('.g-row'); if (!row.classList.contains('is-on')) open(row, true);
    });
    list.addEventListener('keydown', function(e){
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var hs = $$('.g-h', list), i = hs.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault(); hs[(i + (e.key === 'ArrowDown' ? 1 : hs.length - 1)) % hs.length].focus();
    });

    /* 01 dim photo against daylight photo */
    var photo = $('#gPhoto');
    $('#gRange').addEventListener('input', function(e){ photo.style.setProperty('--p', e.target.value + '%'); });

    /* 02 unit and price */
    var UNITS = { basket: ['\u20A638,000', 'per basket'], bag: ['\u20A642,000', 'per bag of 50'], bunch: ['\u20A66,500', 'per bunch'] };
    var price = $('.g-price', stage);
    $('.t2', stage).addEventListener('click', function(e){
      var b = e.target.closest('button'); if (!b) return;
      $$('.t2 button', stage).forEach(function(x){ x.classList.toggle('on', x === b); });
      var u = UNITS[b.dataset.unit]; $('#gPrice').textContent = u[0]; $('#gUnit').textContent = u[1];
      price.classList.remove('tick'); void price.offsetWidth; price.classList.add('tick');
    });

    /* 03 harvest day, built from the real last seven days */
    var days = $('#gDays'), badge = $('#gBadge'), D = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], now = new Date();
    for (var i = 6; i >= 0; i--){
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      var b = document.createElement('button');
      b.type = 'button'; b.dataset.ago = i; if (i === 0) b.className = 'on';
      b.innerHTML = '<span>' + (i === 0 ? 'Today' : D[d.getDay()]) + '</span><b>' + d.getDate() + '</b>';
      days.appendChild(b);
    }
    days.addEventListener('click', function(e){
      var b = e.target.closest('button'); if (!b) return;
      $$('button', days).forEach(function(x){ x.classList.toggle('on', x === b); });
      var n = +b.dataset.ago;
      badge.textContent = n === 0 ? 'Harvested today' : n === 1 ? 'Harvested yesterday' : 'Harvested ' + n + ' days ago';
    });

    /* 04 pickup and delivery, at least one stays on */
    var hand = $('.t4', stage), see = $('#gSee');
    hand.addEventListener('click', function(e){
      var b = e.target.closest('button[data-h]'); if (!b) return;
      var on = $$('button[data-h].on', hand);
      if (b.classList.contains('on') && on.length === 1) return;
      b.classList.toggle('on'); b.setAttribute('aria-pressed', b.classList.contains('on'));
      var t = $$('button[data-h].on', hand).map(function(x){ return x.dataset.h; });
      see.textContent = 'Buyers see: ' + t.join(' and ');
    });
  });
})();
