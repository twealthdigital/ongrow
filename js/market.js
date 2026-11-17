/* Market section: products, filters, cart, and the rail that drops into the section on scroll. */
(function(){
  var O = window.Ohgrow, $ = O.$, $$ = O.$$;
  var SP = 'assets/icons/sprite.svg?v=41#', IMG = 'assets/images/';

  var P = [
    { n:'Fresh broccoli', c:'Vegetables',   p:38000, u:'per basket',    s:'Plateau', f:'Jos Highland Farms', h:'today', o:1, v:1, i:'product-image.png', t:'#DCEEC9' },
    { n:'Ripe tomatoes',  c:'Vegetables',   p:38000, u:'per basket',    s:'Ekiti',   f:'Adeola Farms',       h:'today', o:0, v:1, i:'tomato.png',        t:'#FCE1DA' },
    { n:'Sweet peppers',  c:'Vegetables',   p:29500, u:'per crate',     s:'Kaduna',  f:'Zaria Greens',       h:'today', o:1, v:1, i:'pepper.png',        t:'#FAD9D4' },
    { n:'Juicy oranges',  c:'Fruits',       p:24000, u:'per crate',     s:'Ondo',    f:'Akure Orchards',     h:'week',  o:0, v:1, i:'orange.png',        t:'#FCE3C2' },
    { n:'Leafy greens',   c:'Leafy greens', p:12500, u:'per bundle',    s:'Oyo',     f:'Bola & Sons',        h:'today', o:1, v:0, i:'greens.png',        t:'#D6EBC4' },
    { n:'Yam tubers',     c:'Tubers',       p:24500, u:'per 10 tubers', s:'Benue',   f:'Terkimbi Growers',   h:'week',  o:1, v:1, y:'yam',               t:'#F3E6CF' },
    { n:'Plantain bunch', c:'Fruits',       p:6500,  u:'per bunch',     s:'Ogun',    f:'Okeowo Farm',        h:'today', o:0, v:1, y:'plantain',          t:'#F8EFC2' },
    { n:'Sweet corn',     c:'Grains',       p:12000, u:'per bag of 50', s:'Oyo',     f:'Ibadan Fields',      h:'week',  o:0, v:0, y:'maize',             t:'#FBF0B5' }
  ];
  var byName = {}; P.forEach(function(p){ byName[p.n] = p; });
  var fmt = function(n){ return '\u20A6' + n.toLocaleString('en-NG'); };
  var ic = function(n){ return '<svg class="i"><use href="' + SP + n + '"/></svg>'; };
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); };

  O.ready.then(function(){
    var mk = $('#market'); if (!mk) return;
    var body = document.body, grid = $('#mGrid'), rail = $('.rail'), rt = $('#railToggle');
    var smooth = O.reduce ? 'auto' : 'smooth';
    var DEF = { cat:'all', fresh:'any', max:50000, st:'all', org:false, ver:false, q:'', sort:'rec' };
    var F = Object.assign({}, DEF);

    /* ---------- cart ---------- */
    var cart = {};
    try { cart = JSON.parse(localStorage.getItem('ohgrow.cart') || '{}') || {}; } catch(_){ cart = {}; }
    Object.keys(cart).forEach(function(k){ var c = cart[k]; if (!c || !(c.q > 0) || !(c.p > 0)) delete cart[k]; });
    var save = function(){ try { localStorage.setItem('ohgrow.cart', JSON.stringify(cart)); } catch(_){} };
    var count = function(){ return Object.keys(cart).reduce(function(a, k){ return a + cart[k].q; }, 0); };
    var total = function(){ return Object.keys(cart).reduce(function(a, k){ return a + cart[k].q * cart[k].p; }, 0); };

    var cb = $('.circle.cart'), badge = document.createElement('span');
    badge.className = 'cart-n'; badge.hidden = true; if (cb) cb.appendChild(badge);

    document.body.insertAdjacentHTML('beforeend',
      '<div class="m-scrim" id="mScrim"></div>' +
      '<aside class="c-drawer" id="cDrawer" aria-label="Your cart" inert>' +
        '<div class="c-top"><h2>Your cart</h2><button class="circle" id="cClose" type="button" aria-label="Close cart">' + ic('close') + '</button></div>' +
        '<div class="c-list" id="cList"></div>' +
        '<div class="c-foot"><div class="c-total"><span>Total</span><b id="cTotal"></b></div>' +
        '<button class="btn btn-dark c-go" id="cGo" type="button"><span>Checkout</span><span class="ico">' + ic('arrow') + '</span></button>' +
        '<p class="c-note" id="cNote" aria-live="polite"></p></div>' +
      '</aside>');
    var scrim = $('#mScrim'), drawer = $('#cDrawer'), cList = $('#cList');

    function art(p, cls){
      if (p && p.i) return '<img class="' + cls + '" src="' + IMG + p.i + '" alt="" loading="lazy" draggable="false">';
      if (p && p.y) return '<svg class="' + cls + '"><use href="' + SP + p.y + '"/></svg>';
      return '';
    }
    function actHTML(name){
      var q = cart[name] ? cart[name].q : 0, e = esc(name);
      return q
        ? '<div class="p-step"><button type="button" data-act="dec" aria-label="Remove one ' + e + '">' + ic('minus') + '</button><b aria-live="polite">' + q + '</b><button type="button" data-act="inc" aria-label="Add one more ' + e + '">' + ic('plus') + '</button></div>'
        : '<button class="p-add" type="button" data-act="inc" aria-label="Add ' + e + ' to cart">' + ic('plus') + '</button>';
    }
    function syncCard(name){
      var el = grid.querySelector('[data-name="' + (window.CSS && CSS.escape ? CSS.escape(name) : name) + '"] .p-act');
      if (!el) return;
      var had = el.contains(document.activeElement);
      el.innerHTML = actHTML(name);
      if (had){ var b = el.querySelector('[data-act="inc"]'); if (b) b.focus({ preventScroll: true }); }
    }
    function renderCart(){
      var keys = Object.keys(cart), n = count();
      badge.hidden = !n; badge.textContent = n > 99 ? '99+' : n;
      $('#cTotal').textContent = fmt(total());
      $('#cGo').disabled = !n;
      cList.innerHTML = keys.length ? keys.map(function(k){
        var c = cart[k], p = byName[k], e = esc(k);
        return '<div class="c-item" data-name="' + e + '"' + (p ? ' style="--t:' + p.t + '"' : '') + '>' +
          '<div class="c-art">' + art(p, '') + '</div>' +
          '<div><h3>' + e + '</h3><p>' + fmt(c.p) + ' \u00B7 ' + esc(c.u || '') + '</p><p><b>' + fmt(c.p * c.q) + '</b></p></div>' +
          '<div class="p-step"><button type="button" data-act="dec" aria-label="Remove one ' + e + '">' + ic('minus') + '</button><b>' + c.q + '</b><button type="button" data-act="inc" aria-label="Add one more ' + e + '">' + ic('plus') + '</button></div></div>';
      }).join('') : '<p class="c-empty">Your cart is empty. Add something fresh from the market.</p>';
    }
    function change(name, d, meta){
      var c = cart[name];
      if (!c){ if (d < 1) return; c = cart[name] = { q:0, p:(meta && meta.p) || (byName[name] && byName[name].p) || 0, u:(meta && meta.u) || (byName[name] && byName[name].u) || '' }; }
      c.q += d;
      if (c.q <= 0) delete cart[name];
      save(); syncCard(name); renderCart();
      if (d > 0){ badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop'); }
    }
    cList.addEventListener('click', function(e){
      var b = e.target.closest('[data-act]'); if (!b) return;
      change(b.closest('.c-item').dataset.name, b.dataset.act === 'inc' ? 1 : -1);
    });
    /* the product view in the carousel above reports its own "Add to cart" */
    document.addEventListener('ohgrow:add-to-cart', function(e){
      var d = e.detail || {}; if (!d.name || !(d.price > 0)) return;
      change(d.name, Math.max(1, d.qty | 0), { p:d.price, u:d.unit });
    });
    $('#cGo').addEventListener('click', function(){ $('#cNote').textContent = 'Checkout is coming soon. Your cart is saved.'; });

    function openCart(){ closeSheet(); renderCart(); drawer.inert = false; drawer.classList.add('open'); scrim.classList.add('open'); body.classList.add('lock'); setTimeout(function(){ $('#cClose').focus({ preventScroll: true }); }, 50); }
    function closeCart(){ if (!drawer.classList.contains('open')) return; drawer.classList.remove('open'); drawer.inert = true; $('#cNote').textContent = ''; if (!body.classList.contains('sheet-open')){ scrim.classList.remove('open'); body.classList.remove('lock'); } }
    $('#cClose').addEventListener('click', closeCart);

    /* ---------- filter sheet (phones and tablets) ---------- */
    function openSheet(){ closeCart(); body.classList.add('sheet-open'); scrim.classList.add('open'); body.classList.add('lock'); }
    function closeSheet(){ if (!body.classList.contains('sheet-open')) return; body.classList.remove('sheet-open'); if (!drawer.classList.contains('open')){ scrim.classList.remove('open'); body.classList.remove('lock'); } }
    $('#openFilters').addEventListener('click', openSheet);
    $('#rfClose').addEventListener('click', closeSheet);
    $('#rfDone').addEventListener('click', closeSheet);
    scrim.addEventListener('click', function(){ closeSheet(); closeCart(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ closeSheet(); closeCart(); } });

    /* ---------- products + filters ---------- */
    var sel = $('#fState');
    P.map(function(p){ return p.s; }).filter(function(s, i, a){ return a.indexOf(s) === i; }).sort().forEach(function(s){
      var o = document.createElement('option'); o.value = s; o.textContent = s; sel.appendChild(o);
    });

    function list(){
      var q = F.q.trim().toLowerCase();
      var r = P.filter(function(p){
        return (F.cat === 'all' || p.c === F.cat) && p.p <= F.max && (F.st === 'all' || p.s === F.st) &&
          (F.fresh === 'any' || F.fresh === 'week' || p.h === 'today') && (!F.org || p.o) && (!F.ver || p.v) &&
          (!q || (p.n + ' ' + p.f + ' ' + p.s + ' ' + p.c).toLowerCase().indexOf(q) > -1);
      });
      if (F.sort === 'low') r.sort(function(a, b){ return a.p - b.p; });
      else if (F.sort === 'high') r.sort(function(a, b){ return b.p - a.p; });
      else if (F.sort === 'fresh') r.sort(function(a, b){ return (a.h === 'today' ? 0 : 1) - (b.h === 'today' ? 0 : 1); });
      return r;
    }
    function render(){
      var r = list(), n = r.length;
      $('#mCount').textContent = n + (n === 1 ? ' product' : ' products');
      $('#rfDone').textContent = 'Show ' + n + (n === 1 ? ' product' : ' products');
      grid.innerHTML = n ? r.map(function(p, i){
        var e = esc(p.n);
        return '<article class="p-card" data-name="' + e + '" style="--i:' + i + ';--t:' + p.t + '">' +
          '<div class="p-tile"><span class="p-chip">' + (p.h === 'today' ? 'Harvested today' : 'This week') + '</span>' + (p.o ? '<span class="p-org">Organic</span>' : '') + art(p, 'p-art') + '</div>' +
          '<div class="p-body"><h3>' + e + '</h3><p class="p-meta">' + ic('pin') + esc(p.s) + ' \u00B7 ' + esc(p.f) + (p.v ? ' \u00B7 Verified' : '') + '</p>' +
          '<div class="p-foot"><div class="p-price"><b>' + fmt(p.p) + '</b><span>' + esc(p.u) + '</span></div><div class="p-act">' + actHTML(p.n) + '</div></div></div></article>';
      }).join('') : '<div class="m-empty"><p>Nothing matches those filters.</p><button type="button" data-reset>Reset filters</button></div>';
    }
    grid.addEventListener('click', function(e){
      if (e.target.closest('[data-reset]')){ resetAll(); return; }
      var b = e.target.closest('[data-act]'); if (!b) return;
      change(b.closest('.p-card').dataset.name, b.dataset.act === 'inc' ? 1 : -1);
    });

    $$('.rf-chips').forEach(function(box){
      box.addEventListener('click', function(e){
        var b = e.target.closest('button'); if (!b) return;
        F[box.dataset.f] = b.dataset.v;
        $$('button', box).forEach(function(x){ x.classList.toggle('on', x === b); });
        render();
      });
    });
    var range = $('#fPrice'), out = $('#fPriceOut');
    range.addEventListener('input', function(){ F.max = +range.value; out.textContent = fmt(F.max); render(); });
    sel.addEventListener('change', function(){ F.st = sel.value; render(); });
    $('#fOrganic').addEventListener('change', function(e){ F.org = e.target.checked; render(); });
    $('#fVerified').addEventListener('change', function(e){ F.ver = e.target.checked; render(); });
    $('#mSearch').addEventListener('input', function(e){ F.q = e.target.value; render(); });
    $('#mSort').addEventListener('change', function(e){ F.sort = e.target.value; render(); });
    function resetAll(){
      F = Object.assign({}, DEF);
      $$('.rf-chips').forEach(function(box){ $$('button', box).forEach(function(x, i){ x.classList.toggle('on', i === 0); }); });
      range.value = DEF.max; out.textContent = fmt(DEF.max); sel.value = 'all';
      $('#fOrganic').checked = false; $('#fVerified').checked = false; $('#mSearch').value = ''; $('#mSort').value = 'rec';
      render();
    }
    $('#rfReset').addEventListener('click', resetAll);

    /* ---------- the rail drops into the market as you scroll to it ---------- */
    var inM = false, off = false, fl = $('.rail-link[data-nav="filters"]'), desk = window.matchMedia('(min-width:1100px)');
    function syncOpen(){
      var open = inM && !off && desk.matches && !(rail && rail.classList.contains('is-collapsed'));
      body.classList.toggle('filters-open', open);
    }
    function setNav(sec){
      $$('.nav-pill a,.dock a').forEach(function(a){
        var on = a.dataset.nav === sec;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      if (O.placePill) O.placePill();
      if (fl){ fl.classList.toggle('is-active', sec === 'market'); if (sec === 'market') fl.setAttribute('aria-current', 'true'); else fl.removeAttribute('aria-current'); }
    }
    var head = $('.head');
    function paintHead(){
      if (!head) return;
      var r = head.getBoundingClientRect(), t = mk.getBoundingClientRect().top;
      var y = Math.max(0, Math.min(r.height, t - r.top));
      head.style.setProperty('--hy', y + 'px');
      head.classList.toggle('hg', y < r.height * .5);
    }
    var tick = false;
    function spy(){
      tick = false;
      paintHead();
      var t = mk.getBoundingClientRect().top, vh = window.innerHeight;
      var now = inM ? t < vh * .62 : t < vh * .45;
      if (now === inM) return;
      inM = now; off = false;
      body.classList.toggle('in-market', inM);
      setNav(inM ? 'market' : 'home');
      syncOpen();
    }
    window.addEventListener('scroll', function(){ if (!tick){ tick = true; requestAnimationFrame(spy); } }, { passive:true });
    window.addEventListener('resize', function(){ spy(); syncOpen(); });
    if (rt) rt.addEventListener('click', function(){ off = false; syncOpen(); });

    /* header, dock and rail links stay on this page: Market and Filters scroll down, Home scrolls up, the cart opens the drawer */
    document.addEventListener('click', function(e){
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      var a = e.target.closest('a'); if (!a) return;
      var nav = a.dataset.nav, isCart = a.classList.contains('cart');
      var toM = nav === 'market' || nav === 'filters', toH = nav === 'home' || a.classList.contains('brand');
      if (!toM && !toH && !isCart) return;
      e.preventDefault(); e.stopPropagation();
      var pc = $('#closePanel'); if ($('#panel.open') && pc) pc.click();
      if (isCart){ openCart(); return; }
      closeSheet();
      if (toM){
        if (nav === 'filters' && inM){ off = !off; syncOpen(); return; }
        mk.scrollIntoView({ behavior:smooth, block:'start' });
      } else window.scrollTo({ top:0, behavior:smooth });
    }, true);

    render(); renderCart(); spy(); paintHead(); syncOpen();
  });
})();
