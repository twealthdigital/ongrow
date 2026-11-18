/* Market section: products, filters, cart, and the rail that drops into the section on scroll. */
(function(){
  var O = window.Ohgrow, $ = O.$, $$ = O.$$;
  var SP = 'assets/icons/sprite.svg?v=55#', IMG = 'assets/images/';

  var P = [
    { d:'Crisp, deep-green heads harvested this morning. Lovely steamed, roasted or stir-fried.', n:'Fresh broccoli', c:'Vegetables',   p:38000, u:'per basket',    s:'Plateau', f:'Jos Highland Farms', h:'today', o:1, v:1, i:'product-image.png', t:'#DCEEC9' },
    { d:'Firm, sun-ripened tomatoes picked at their best. Perfect for stews, sauces and salads.', n:'Ripe tomatoes',  c:'Vegetables',   p:38000, u:'per basket',    s:'Ekiti',   f:'Adeola Farms',       h:'today', o:0, v:1, i:'tomato.png',        t:'#FCE1DA' },
    { d:'Bright, crunchy bell peppers with a sweet, mild flavour. Great in stir-fries and salads.', n:'Sweet peppers',  c:'Vegetables',   p:29500, u:'per crate',     s:'Kaduna',  f:'Zaria Greens',       h:'today', o:1, v:1, i:'pepper.png',        t:'#FAD9D4' },
    { d:'Sweet, juicy oranges packed with vitamin C. Peel and eat fresh, or squeeze for juice.', n:'Juicy oranges',  c:'Fruits',       p:24000, u:'per crate',     s:'Ondo',    f:'Akure Orchards',     h:'week',  o:0, v:1, i:'orange.png',        t:'#FCE3C2' },
    { d:'Fresh-cut leafy greens bundled the same day. Tender and ready for soups, salads and smoothies.', n:'Leafy greens',   c:'Leafy greens', p:12500, u:'per bundle',    s:'Oyo',     f:'Bola & Sons',        h:'today', o:1, v:0, i:'greens.png',        t:'#D6EBC4' },
    { d:'Hearty, starchy tubers with a firm bite. Boil, roast or pound for a classic Nigerian meal.', n:'Yam tubers',     c:'Tubers',       p:24500, u:'per 10 tubers', s:'Benue',   f:'Terkimbi Growers',   h:'week',  o:1, v:1, i:'yam.png', y:'yam',               t:'#F3E6CF' },
    { d:'Golden plantains with a deep natural sweetness. Fry, roast or boil them.', n:'Plantain bunch', c:'Fruits',       p:6500,  u:'per bunch',     s:'Ogun',    f:'Okeowo Farm',        h:'today', o:0, v:1, i:'plantain.png', y:'plantain',          t:'#F8EFC2' },
    { d:'Sweet, tender cobs harvested young. Boil or roast fresh, or cut off the kernels for soups.', n:'Sweet corn',     c:'Grains',       p:12000, u:'per bag of 50', s:'Oyo',     f:'Ibadan Fields',      h:'week',  o:0, v:0, i:'corn.png', y:'maize',             t:'#FBF0B5' }
  ];
  var byName = {}; P.forEach(function(p){ byName[p.n] = p; });
  var fmt = function(n){ return '\u20A6' + n.toLocaleString('en-NG'); };
  var ic = function(n){ return '<svg class="i"><use href="' + SP + n + '"/></svg>'; };
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); };


  /* custom dropdown: swaps a native <select> for a styled button + listbox; the select stays as the source of truth */
  function dropdown(sel){
    var w = document.createElement('div'), btn = document.createElement('button'), menu = document.createElement('ul'), hl = -1;
    w.className = 'dd'; btn.type = 'button'; btn.className = 'dd-btn'; btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    if (sel.getAttribute('aria-label')) btn.setAttribute('aria-label', sel.getAttribute('aria-label'));
    menu.className = 'dd-menu'; menu.setAttribute('role', 'listbox');
    sel.parentNode.insertBefore(w, sel); w.appendChild(sel); sel.tabIndex = -1; w.appendChild(btn); w.appendChild(menu);
    function paint(){
      var o = sel.options[sel.selectedIndex];
      btn.innerHTML = '<span>' + esc(o ? o.textContent : '') + '</span>' + ic('chev');
      menu.innerHTML = Array.prototype.map.call(sel.options, function(x, i){
        return '<li class="dd-opt" role="option" data-i="' + i + '" aria-selected="' + (i === sel.selectedIndex) + '">' + esc(x.textContent) + '</li>';
      }).join('');
    }
    function mark(i){
      hl = Math.max(0, Math.min(sel.options.length - 1, i));
      Array.prototype.forEach.call(menu.children, function(li, k){ li.classList.toggle('hl', k === hl); });
      if (menu.children[hl]) menu.children[hl].scrollIntoView({ block:'nearest' });
    }
    function open(){ w.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); mark(sel.selectedIndex); setTimeout(function(){ menu.scrollIntoView({ block:'nearest' }); }, 30); }
    function close(){ w.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    function pick(i){
      if (i !== sel.selectedIndex){ sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles:true })); }
      paint(); close();
    }
    btn.addEventListener('click', function(){ if (w.classList.contains('open')) close(); else open(); });
    menu.addEventListener('click', function(e){ var li = e.target.closest('.dd-opt'); if (li) { pick(+li.dataset.i); btn.focus({ preventScroll:true }); } });
    btn.addEventListener('keydown', function(e){
      var isOpen = w.classList.contains('open');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); if (!isOpen) open(); else mark(hl + (e.key === 'ArrowDown' ? 1 : -1)); }
      else if (e.key === 'Home' && isOpen){ e.preventDefault(); mark(0); }
      else if (e.key === 'End' && isOpen){ e.preventDefault(); mark(sel.options.length - 1); }
      else if ((e.key === 'Enter' || e.key === ' ') && isOpen){ e.preventDefault(); pick(hl); }
      else if (e.key === 'Escape' && isOpen){ e.stopPropagation(); close(); }
      else if (e.key === 'Tab') close();
    });
    document.addEventListener('click', function(e){ if (!w.contains(e.target)) close(); });
    sel.addEventListener('dd-sync', paint);
    paint();
  }


  /* a product photo that isn't in assets/images yet falls back to its flat drawing */
  document.addEventListener('error', function(e){
    var im = e.target; if (!im || im.tagName !== 'IMG' || !im.dataset.y) return;
    im.outerHTML = '<svg class="' + im.className + '"><use href="' + SP + im.dataset.y + '"/></svg>';
  }, true);

  O.ready.then(function(){
    var mk = $('#market'); if (!mk) return;
    var body = document.body, grid = $('#mGrid'), rail = $('.rail'), rt = $('#railToggle');
    var smooth = O.reduce ? 'auto' : 'smooth';
    var DEF = { cat:'all', fresh:'any', max:50000, st:'all', org:false, ver:false, q:'', sort:'rec', page:1 };
    var small = window.matchMedia('(max-width:1099.98px)'), pager = $('#mPager');
    var pageSize = function(){ return small.matches ? 4 : 9; };   /* phones and tablets: 2 x 2, desktop: 3 x 3 */
    var F = Object.assign({}, DEF);

    /* ---------- cart: one line per product + chosen options ---------- */
    var DEFO = { g:'Standard', d:'Pickup', w:'This week' }, GR = { Standard:1, Select:1.1, Export:1.25 };
    var priceFor = function(p, g){ return Math.round(p.p * (GR[g] || 1) / 100) * 100; };
    var lk = function(n, o){ return [n, o.g, o.d, o.w].join('|'); };
    var cart = {};
    try { cart = JSON.parse(localStorage.getItem('ohgrow.cart') || '{}') || {}; } catch(_){ cart = {}; }
    Object.keys(cart).forEach(function(k){ var c = cart[k]; if (!c || !c.n || !(c.q > 0) || !(c.p > 0)) delete cart[k]; });
    var save = function(){ try { localStorage.setItem('ohgrow.cart', JSON.stringify(cart)); } catch(_){} };
    var keys = function(){ return Object.keys(cart); };
    var count = function(){ return keys().reduce(function(a, k){ return a + cart[k].q; }, 0); };
    var total = function(){ return keys().reduce(function(a, k){ return a + cart[k].q * cart[k].p; }, 0); };
    var inCart = function(n){ return keys().reduce(function(a, k){ return a + (cart[k].n === n ? cart[k].q : 0); }, 0); };

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
      '</aside>' +
      '<div class="pd" id="pd" inert><div class="pd-scroll" id="pdScroll"><div class="pd-box" role="dialog" aria-modal="true" aria-labelledby="pdName">' +
        '<button class="circle pd-x" id="pdX" type="button" aria-label="Close">' + ic('close') + '</button>' +
        '<div class="pd-stage"><span class="pd-disc"></span><div class="pd-img" id="pdImg"></div></div>' +
        '<div class="pd-info">' +
          '<span class="ad-cat" id="pdCat"></span>' +
          '<h3 class="pd-name" id="pdName"></h3>' +
          '<p class="ad-price"><b id="pdPrice"></b><span id="pdUnit"></span></p>' +
          '<p class="ad-desc" id="pdDesc"></p>' +
          '<div class="pd-tags" id="pdTags"></div>' +
          '<div id="pdSel"></div>' +
          '<div class="ad-qty"><div class="ad-qgroup"><span class="ad-lbl" id="pdQL">Quantity</span>' +
            '<div class="ad-step" role="group" aria-labelledby="pdQL"><button type="button" id="pdMinus" aria-label="Decrease quantity">&minus;</button><output id="pdQty" aria-live="polite">1</output><button type="button" id="pdPlus" aria-label="Increase quantity">+</button></div></div>' +
            '<p class="ad-total"><span class="ad-lbl">Total</span><b id="pdTotal"></b></p></div>' +
          '<button class="ad-add pd-add" id="pdAdd" type="button">' + ic('cart') + '<span>Add to cart</span></button>' +
        '</div></div></div></div>');
    var scrim = $('#mScrim'), drawer = $('#cDrawer'), cList = $('#cList'), pd = $('#pd');

    function art(p, cls){
      if (p && p.i) return '<img class="' + cls + '" src="' + IMG + p.i + '" alt="" loading="lazy" draggable="false"' + (p.y ? ' data-y="' + p.y + '"' : '') + '>';
      if (p && p.y) return '<svg class="' + cls + '"><use href="' + SP + p.y + '"/></svg>';
      return '';
    }
    function syncCard(n){
      var el = grid.querySelector('[data-name="' + (window.CSS && CSS.escape ? CSS.escape(n) : n) + '"] .p-inc'); if (!el) return;
      var q = inCart(n); el.hidden = !q; el.textContent = q + ' in cart';
    }
    function renderCart(){
      var ks = keys(), n = count();
      badge.hidden = !n; badge.textContent = n > 99 ? '99+' : n;
      $('#cTotal').textContent = fmt(total());
      $('#cGo').disabled = !n;
      cList.innerHTML = ks.length ? ks.map(function(k){
        var c = cart[k], p = byName[c.n], e = esc(c.n);
        var side = '<div class="c-side"><div class="p-step"><button type="button" data-act="dec" aria-label="Remove one ' + e + '">' + ic('minus') + '</button><b>' + c.q + '</b><button type="button" data-act="inc" aria-label="Add one more ' + e + '">' + ic('plus') + '</button></div>' +
          '<button class="c-del" type="button" data-act="del" aria-label="Remove ' + e + ' from cart">' + ic('trash') + '<span>Remove</span></button></div>';
        if (c.bk){   /* a collection basket is one line: three small pictures, the basket name and its price */
          var ps = c.bk.map(function(n){ return byName[n]; }).filter(Boolean);
          return '<div class="c-item c-basket" data-k="' + esc(k) + '" data-tone="' + esc(c.t || 'light') + '">' +
            '<div class="c-art c-trio">' + ps.map(function(q){ return art(q, ''); }).join('') + '</div>' +
            '<div><h3>' + e + '</h3><p>' + fmt(c.p) + ' \u00B7 ' + esc(c.u || 'per basket') + '</p><p class="c-opt">' + c.bk.map(esc).join(' \u00B7 ') + '</p><p><b>' + fmt(c.p * c.q) + '</b></p></div>' + side + '</div>';
        }
        return '<div class="c-item" data-k="' + esc(k) + '"' + (p ? ' style="--t:' + p.t + '"' : '') + '>' +
          '<div class="c-art">' + art(p, '') + '</div>' +
          '<div><h3>' + e + '</h3><p>' + fmt(c.p) + ' \u00B7 ' + esc(c.u || '') + '</p><p class="c-opt">' + esc(c.g) + ' \u00B7 ' + esc(c.d) + ' \u00B7 ' + esc(c.w) + '</p><p><b>' + fmt(c.p * c.q) + '</b></p></div>' + side + '</div>';
      }).join('') : '<p class="c-empty">Your cart is empty. Add something fresh from the market.</p>';
    }
    function add(n, q, o, meta){
      o = Object.assign({}, DEFO, o || {});
      var p = byName[n], k = lk(n, o);
      if (!cart[k]) cart[k] = { n:n, p:p ? priceFor(p, o.g) : (meta && meta.p) || 0, u:p ? p.u : (meta && meta.u) || '', q:0, g:o.g, d:o.d, w:o.w };
      if (!(cart[k].p > 0)){ delete cart[k]; return; }
      cart[k].q = Math.min(99, cart[k].q + q);
      save(); syncCard(n); renderCart();
      badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop');
    }
    /* a collection goes in as ONE line (the whole basket), not as separate products */
    function addBasket(b){
      var k = 'basket|' + b.n, ps = b.items.map(function(n){ return byName[n]; }).filter(Boolean);
      var sum = ps.reduce(function(a, p){ return a + priceFor(p, 'Standard'); }, 0);
      if (!cart[k]) cart[k] = { n:b.n, bk:b.items.slice(), t:b.t, p:sum, u:'per basket', q:0, g:'Standard', d:'Pickup', w:'This week' };
      cart[k].q = Math.min(99, cart[k].q + 1);
      save(); renderCart();
      badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop');
    }
    cList.addEventListener('click', function(e){
      var b = e.target.closest('[data-act]'); if (!b) return;
      var k = b.closest('.c-item').dataset.k, c = cart[k]; if (!c) return;
      if (b.dataset.act === 'del') c.q = 0; else c.q += b.dataset.act === 'inc' ? 1 : -1;
      if (c.q <= 0) delete cart[k]; else if (c.q > 99) c.q = 99;
      save(); syncCard(c.n); renderCart();
    });
    /* the product view in the carousel above reports its own "Add to cart" */
    document.addEventListener('ohgrow:add-to-cart', function(e){
      var d = e.detail || {}; if (!d.name || !(d.price > 0)) return;
      add(d.name, Math.max(1, d.qty | 0), null, { p:d.price, u:d.unit });
    });
    $('#cGo').addEventListener('click', function(){ $('#cNote').textContent = 'Checkout is coming soon. Your cart is saved.'; });

    function lockOff(){ if (!drawer.classList.contains('open') && !body.classList.contains('sheet-open') && !pd.classList.contains('open')){ scrim.classList.remove('open'); body.classList.remove('lock'); } }
    function openCart(){ closeSheet(); closeProduct(); renderCart(); drawer.inert = false; drawer.classList.add('open'); scrim.classList.add('open'); body.classList.add('lock'); setTimeout(function(){ $('#cClose').focus({ preventScroll: true }); }, 50); }
    function closeCart(){ if (!drawer.classList.contains('open')) return; drawer.classList.remove('open'); drawer.inert = true; $('#cNote').textContent = ''; lockOff(); }
    $('#cClose').addEventListener('click', closeCart);

    /* ---------- product dialog: big image pops out of the box, options + quantity + add to cart ---------- */
    var D = null, lastFocus = null, ht = 0;
    var SEL = [
      { k:'g', l:'Quality',   o:[['Standard','Standard'], ['Select','Select +10%'], ['Export','Export +25%']] },
      { k:'d', l:'Delivery',  o:[['Pickup','Farm pickup'], ['Doorstep','Doorstep delivery']] },
      { k:'w', l:'Needed by', o:[['Today','Today'], ['Tomorrow','Tomorrow'], ['This week','This week']] }
    ];
    function paintD(){
      var price = priceFor(D.p, D.g);
      $('#pdPrice').textContent = fmt(price);
      $('#pdQty').textContent = D.q;
      $('#pdTotal').textContent = fmt(price * D.q);
      $('#pdMinus').disabled = D.q <= 1; $('#pdPlus').disabled = D.q >= 99;
      $$('#pdSel .pd-chips').forEach(function(box){
        $$('button', box).forEach(function(b){ var on = b.dataset.v === D[box.dataset.k]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      });
    }
    function openProduct(n, trigger){
      var p = byName[n]; if (!p) return;
      closeSheet(); closeCart();
      D = { p:p, g:DEFO.g, d:DEFO.d, w:DEFO.w, q:1 }; lastFocus = trigger || document.activeElement;
      $('.pd-box', pd).style.setProperty('--t', p.t);
      $('#pdImg').innerHTML = art(p, '');
      $('#pdCat').textContent = p.c;
      $('#pdName').textContent = p.n;
      $('#pdUnit').textContent = p.u;
      $('#pdDesc').textContent = p.d;
      $('#pdTags').innerHTML = '<span class="pd-tag">' + ic('pin') + esc(p.s) + ' \u00B7 ' + esc(p.f) + '</span>' +
        '<span class="pd-tag">' + (p.h === 'today' ? 'Harvested today' : 'Harvested this week') + '</span>' + (p.o ? '<span class="pd-tag">Organic</span>' : '') + (p.v ? '<span class="pd-tag">Verified farmer</span>' : '');
      $('#pdSel').innerHTML = SEL.map(function(g, i){
        return '<div class="pd-sel"><span class="ad-lbl" id="pdL' + i + '">' + g.l + '</span><div class="pd-chips" role="group" aria-labelledby="pdL' + i + '" data-k="' + g.k + '">' +
          g.o.map(function(o){ return '<button type="button" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
      }).join('');
      paintD();
      pd.inert = false; pd.classList.add('open'); body.classList.add('lock'); scrim.classList.remove('open');
      $('#pdScroll').scrollTop = 0;
      setTimeout(function(){ $('#pdX').focus({ preventScroll: true }); }, 60);
    }
    function closeProduct(){
      if (!pd.classList.contains('open')) return;
      pd.classList.remove('open'); pd.inert = true; D = null; lockOff();
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    $('#pdX').addEventListener('click', closeProduct);
    $('#pdScroll').addEventListener('click', function(e){ if (e.target === e.currentTarget) closeProduct(); });
    $('#pdSel').addEventListener('click', function(e){
      var b = e.target.closest('button'); if (!b || !D) return;
      D[b.parentNode.dataset.k] = b.dataset.v; paintD();
    });
    $('#pdMinus').addEventListener('click', function(){ if (D){ D.q = Math.max(1, D.q - 1); paintD(); } });
    $('#pdPlus').addEventListener('click', function(){ if (D){ D.q = Math.min(99, D.q + 1); paintD(); } });

    /* the picture flies into the cart, which then smiles */
    function happy(){
      if (!cb) return;
      var u = cb.querySelector('use');
      cb.classList.remove('happy'); void cb.offsetWidth; cb.classList.add('happy');
      if (u) u.setAttribute('href', SP + 'smile');
      clearTimeout(ht);
      ht = setTimeout(function(){ cb.classList.remove('happy'); if (u) u.setAttribute('href', SP + 'cart'); }, 1400);
    }
    function fly(src){
      var c = cb && cb.getBoundingClientRect();
      if (!src || !c || O.reduce || !src.animate){ happy(); return; }
      var r = src.getBoundingClientRect(), el = src.cloneNode(true);
      el.className = 'fly'; el.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px';
      document.body.appendChild(el);
      var dx = c.left + c.width / 2 - (r.left + r.width / 2), dy = c.top + c.height / 2 - (r.top + r.height / 2);
      var a = el.animate([
        { transform:'translate(0,0) scale(1) rotate(-8deg)', opacity:1 },
        { transform:'translate(' + dx * .5 + 'px,' + (dy * .5 - 140) + 'px) scale(.42) rotate(12deg)', opacity:1, offset:.55 },
        { transform:'translate(' + dx + 'px,' + dy + 'px) scale(.07) rotate(28deg)', opacity:.85 }
      ], { duration:900, easing:'cubic-bezier(.45,0,.25,1)' });
      a.onfinish = function(){ el.remove(); happy(); };
    }
    $('#pdAdd').addEventListener('click', function(){
      if (!D) return;
      add(D.p.n, D.q, { g:D.g, d:D.d, w:D.w });
      fly($('#pdImg').firstElementChild); closeProduct();
    });

    /* ---------- filter sheet (phones and tablets) ---------- */
    function openSheet(){ closeCart(); closeProduct(); body.classList.add('sheet-open'); scrim.classList.add('open'); body.classList.add('lock'); }
    function closeSheet(){ if (!body.classList.contains('sheet-open')) return; body.classList.remove('sheet-open'); lockOff(); }
    $('#openFilters').addEventListener('click', openSheet);
    $('#rfClose').addEventListener('click', closeSheet);
    $('#rfDone').addEventListener('click', closeSheet);
    scrim.addEventListener('click', function(){ closeSheet(); closeCart(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ closeSheet(); closeCart(); closeProduct(); } });

    /* ---------- products + filters ---------- */
    var sel = $('#fState');
    P.map(function(p){ return p.s; }).filter(function(s, i, a){ return a.indexOf(s) === i; }).sort().forEach(function(s){
      var o = document.createElement('option'); o.value = s; o.textContent = s; sel.appendChild(o);
    });

    $$('select').forEach(dropdown);

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
    function pagerHTML(pages, cur){
      if (pages < 2) return '';
      var h = '<button class="pg pg-nav pg-prev" type="button" data-p="' + (cur - 1) + '" aria-label="Previous page"' + (cur === 1 ? ' disabled' : '') + '>' + ic('arrow') + '</button>', last = 0;
      for (var i = 1; i <= pages; i++){
        if (pages > 5 && i !== 1 && i !== pages && Math.abs(i - cur) > 1) continue;
        if (last && i - last > 1) h += '<span class="pg-gap" aria-hidden="true">\u2026</span>';
        h += '<button class="pg' + (i === cur ? ' on' : '') + '" type="button" data-p="' + i + '" aria-label="Page ' + i + '"' + (i === cur ? ' aria-current="page"' : '') + '>' + i + '</button>';
        last = i;
      }
      return h + '<button class="pg pg-nav" type="button" data-p="' + (cur + 1) + '" aria-label="Next page"' + (cur === pages ? ' disabled' : '') + '>' + ic('arrow') + '</button>';
    }
    function render(keepPage){
      if (keepPage !== true) F.page = 1;
      var r = list(), n = r.length, size = pageSize(), pages = Math.max(1, Math.ceil(n / size));
      F.page = Math.min(Math.max(1, F.page), pages);
      var from = (F.page - 1) * size, view = r.slice(from, from + size);
      $('#mCount').textContent = pages > 1 ? (from + 1) + '\u2013' + (from + view.length) + ' of ' + n + ' products' : n + (n === 1 ? ' product' : ' products');
      $('#rfDone').textContent = 'Show ' + n + (n === 1 ? ' product' : ' products');
      grid.innerHTML = n ? view.map(function(p, i){
        var e = esc(p.n);
        return '<article class="p-card" data-name="' + e + '" style="--i:' + i + ';--t:' + p.t + '">' +
          '<div class="p-tile"><span class="p-chip">' + (p.h === 'today' ? '<span class="p-lg">Harvested </span>today' : 'This week') + '</span>' + (p.o ? '<span class="p-org">Organic</span>' : '') + art(p, 'p-art') + '<span class="p-inc"' + (inCart(p.n) ? '>' + inCart(p.n) + ' in cart' : ' hidden>') + '</span></div>' +
          '<div class="p-body"><h3>' + e + '</h3><p class="p-meta">' + ic('pin') + '<span>' + esc(p.s) + '<span class="p-lg"> \u00B7 ' + esc(p.f) + (p.v ? ' \u00B7 Verified' : '') + '</span></span></p>' +
          '<div class="p-foot"><div class="p-price"><b>' + fmt(p.p) + '</b><span>' + esc(p.u) + '</span></div><button class="btn btn-dark p-view" type="button" aria-label="View ' + e + '"><span>View</span><span class="ico">' + ic('arrow') + '</span></button></div></div></article>';
      }).join('') : '<div class="m-empty"><p>Nothing matches those filters.</p><button type="button" data-reset>Reset filters</button></div>';
      pager.innerHTML = pagerHTML(pages, F.page); pager.hidden = pages < 2;
    }
    pager.addEventListener('click', function(e){
      var b = e.target.closest('.pg'); if (!b || b.disabled) return;
      F.page = +b.dataset.p; render(true);
      var cur = pager.querySelector('.pg.on'); if (cur) cur.focus({ preventScroll: true });
      $('.m-bar').scrollIntoView({ behavior:smooth, block:'start' });
    });
    (small.addEventListener ? small.addEventListener.bind(small, 'change') : small.addListener.bind(small))(function(){ render(true); });
    grid.addEventListener('click', function(e){
      if (e.target.closest('[data-reset]')){ resetAll(); return; }
      var c = e.target.closest('.p-card'); if (c) openProduct(c.dataset.name, c.querySelector('.p-view'));
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
      range.value = DEF.max; out.textContent = fmt(DEF.max); sel.value = 'all'; sel.dispatchEvent(new Event('dd-sync'));
      $('#fOrganic').checked = false; $('#fVerified').checked = false; $('#mSearch').value = ''; $('#mSort').value = 'rec'; $('#mSort').dispatchEvent(new Event('dd-sync'));
      render();
    }
    $('#rfReset').addEventListener('click', resetAll);

    /* ---------- collections: ready-made baskets (3 card carousel on desktop, stacked cards on phones) ---------- */
    var BUNDLES = [
      { n:'Stew starter',  t:'dark',  d:'Everything for a rich pot of stew, picked the same morning.',            items:['Ripe tomatoes', 'Sweet peppers', 'Leafy greens'] },
      { n:'Yam night',     t:'light', d:'Yam with fresh tomatoes and greens for a proper pot of vegetable sauce.', items:['Yam tubers', 'Ripe tomatoes', 'Leafy greens'] },
      { n:'Street roast',  t:'green', d:'Corn, plantain and yam ready for the fire, the way the roadside does it.', items:['Sweet corn', 'Plantain bunch', 'Yam tubers'] },
      { n:'Green kitchen', t:'dark',  d:'Crunchy, leafy and bright for salads, steaming and stir fries.',         items:['Fresh broccoli', 'Leafy greens', 'Sweet peppers'] },
      { n:'Fry up',        t:'light', d:'Plantain, tomatoes and peppers for golden fried plantain with a hot sauce.', items:['Plantain bunch', 'Ripe tomatoes', 'Sweet peppers'] },
      { n:'Vitamin boost', t:'green', d:'Juicy oranges, broccoli and tomatoes to keep the week fresh.',           items:['Juicy oranges', 'Fresh broccoli', 'Ripe tomatoes'] },
      { n:'Weekend feast', t:'dark',  d:'Yam, sweet corn and broccoli for a big family table on Sunday.',         items:['Yam tubers', 'Sweet corn', 'Fresh broccoli'] },
      { n:'Snack basket',  t:'light', d:'Sweet corn, plantain and oranges for easy snacking all week.',           items:['Sweet corn', 'Juicy oranges', 'Plantain bunch'] }
    ];
    var coGrid = $('#coGrid');
    if (coGrid){
      var pad2 = function(x){ return (x < 10 ? '0' : '') + x; };
      coGrid.innerHTML = BUNDLES.map(function(b, i){
        var ps = b.items.map(function(n){ return byName[n]; }), sum = ps.reduce(function(a, p){ return a + p.p; }, 0);
        return '<article class="co-card" data-tone="' + b.t + '" data-i="' + i + '" style="--i:' + i + '">' +
          '<span class="co-no" aria-hidden="true">' + pad2(i + 1) + '</span>' +
          '<div class="co-art" aria-hidden="true">' + ps.map(function(p){ return art(p, ''); }).join('') + '</div>' +
          '<p class="co-n">' + ps.length + ' items</p><h3>' + esc(b.n) + '</h3><p class="co-d">' + esc(b.d) + '</p>' +
          '<p class="co-list">' + ps.map(function(p){ return esc(p.n); }).join(' \u00B7 ') + '</p>' +
          '<div class="co-foot"><div class="co-price"><span>Basket total</span><b>' + fmt(sum) + '</b></div>' +
          '<button class="btn co-add" type="button" aria-label="Add the ' + esc(b.n) + ' basket to cart"><span>Add basket</span><span class="ico">' + ic('plus') + '</span></button></div></article>';
      }).join('');

      var coCards = $$('.co-card', coGrid), coDots = $('#coDots'), coNum = $('#coNum'), coCur = 0, coN = BUNDLES.length;
      $('#coTot').textContent = '/ ' + pad2(coN);
      coDots.innerHTML = BUNDLES.map(function(b){ return '<button type="button" aria-label="Show ' + esc(b.n) + '"></button>'; }).join('');
      function coGo(i){
        coCur = ((i % coN) + coN) % coN;
        coCards.forEach(function(c, k){
          var d = ((k - coCur) % coN + coN) % coN; if (d > coN / 2) d -= coN;
          var on = d === 0;
          c.dataset.pos = on ? '0' : d === 1 ? '1' : d === -1 ? '-1' : 'x';
          c.setAttribute('aria-hidden', on ? 'false' : 'true');
          c.querySelector('.co-add').tabIndex = on ? 0 : -1;
        });
        $$('button', coDots).forEach(function(x, k){ x.classList.toggle('on', k === coCur); });
        coNum.textContent = pad2(coCur + 1); coNum.classList.remove('tick'); void coNum.offsetWidth; coNum.classList.add('tick');
      }
      coGo(0);
      $('#coPrev').addEventListener('click', function(){ coGo(coCur - 1); });
      $('#coNext').addEventListener('click', function(){ coGo(coCur + 1); });
      coDots.addEventListener('click', function(e){
        var x = e.target.closest('button'); if (x) coGo($$('button', coDots).indexOf(x));
      });
      $('#collections').addEventListener('keydown', function(e){
        if (e.key === 'ArrowLeft') coGo(coCur - 1); else if (e.key === 'ArrowRight') coGo(coCur + 1);
      });

      /* swipe or drag sideways to change basket */
      var coX = null, coMoved = false;
      coGrid.addEventListener('pointerdown', function(e){ coX = e.clientX; coMoved = false; });
      coGrid.addEventListener('pointerup', function(e){
        if (coX === null) return;
        var dx = e.clientX - coX; coX = null;
        if (Math.abs(dx) > 40){ coMoved = true; coGo(coCur + (dx < 0 ? 1 : -1)); }
      });
      coGrid.addEventListener('pointercancel', function(){ coX = null; });

      var coT = 0;
      coGrid.addEventListener('click', function(e){
        if (coMoved){ coMoved = false; return; }
        var card = e.target.closest('.co-card'); if (!card) return;
        if (card.dataset.pos !== '0'){ coGo(+card.dataset.i); return; }   /* tap a side card to bring it forward */   /* tap a side card to bring it forward */
        var btn = e.target.closest('.co-add'); if (!btn) return;
        var b = BUNDLES[+card.dataset.i];
        addBasket(b);   /* the whole basket goes into the cart as one line */
        $$('.co-art img, .co-art svg', card).forEach(function(im, k){ setTimeout(function(){ fly(im); }, k * 150); });   /* and all three pictures fly there */
        var t = btn.querySelector('span'); t.textContent = 'Added to cart'; btn.classList.add('done');
        clearTimeout(coT); coT = setTimeout(function(){ t.textContent = 'Add basket'; btn.classList.remove('done'); }, 2000);
      });
    }

    /* ---------- the rail drops into the market as you scroll to it ---------- */
    var inM = false, off = false, fl = $('.rail-link[data-nav="filters"]'), desk = window.matchMedia('(min-width:1100px)');
    function syncOpen(){
      var open = inM && !off && desk.matches && !(rail && rail.classList.contains('is-collapsed'));
      body.classList.toggle('filters-open', open);
    }
    var co = $('#collections'), cl = $('.rail-link[data-nav="collections"]'), gd = $('#guide'), gl = $('.rail-link[data-nav="guide"]'), cur = 'home';
    function mark(el, on){ if (!el) return; el.classList.toggle('is-active', on); if (on) el.setAttribute('aria-current', 'true'); else el.removeAttribute('aria-current'); }
    function setNav(sec){
      var top = sec === 'home' ? 'home' : sec === 'guide' ? 'how' : 'market';   /* header + dock: Collections still counts as shopping, the guide is How it works */
      $$('.nav-pill a,.dock a').forEach(function(a){
        var on = a.dataset.nav === top;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      if (O.placePill) O.placePill();
      mark(fl, sec === 'market'); mark(cl, sec === 'collections'); mark(gl, sec === 'guide');
    }
    var head = $('.head'), clamp = function(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); };
    function paintHead(){   /* the header is green only where the market sits under it */
      if (!head) return;
      var r = head.getBoundingClientRect(), m = mk.getBoundingClientRect(), H = r.height;
      var y = clamp(m.top - r.top, 0, H), z = clamp(H - (m.bottom - r.top), 0, H);
      head.style.setProperty('--hy', y + 'px'); head.style.setProperty('--hz', z + 'px');
      head.classList.toggle('hg', H - y - z > H * .5);
    }
    var tick = false;
    function spy(){
      tick = false;
      paintHead();
      var vh = window.innerHeight, sec = 'home';
      if (mk.getBoundingClientRect().top < vh * (cur === 'market' ? .62 : .45)) sec = 'market';
      if (co && co.getBoundingClientRect().top < vh * (cur === 'collections' ? .62 : .45)) sec = 'collections';
      if (gd && gd.getBoundingClientRect().top < vh * (cur === 'guide' ? .62 : .45)) sec = 'guide';
      if (sec === cur) return;
      cur = sec; inM = sec === 'market'; off = false;
      body.classList.toggle('in-market', inM);
      body.classList.toggle('in-shop', sec !== 'home');
      setNav(sec);
      syncOpen();   /* the filter panel only opens in the market, so the rail folds back to icons in Collections */
    }
    window.addEventListener('scroll', function(){ if (!tick){ tick = true; requestAnimationFrame(spy); } }, { passive:true });
    window.addEventListener('resize', function(){ spy(); syncOpen(); });
    if (rt) rt.addEventListener('click', function(){ off = false; syncOpen(); });

    /* header, dock and rail links stay on this page: Market and Filters scroll down, Home scrolls up, the cart opens the drawer */
    document.addEventListener('click', function(e){
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      var a = e.target.closest('a'); if (!a) return;
      var nav = a.dataset.nav, isCart = a.classList.contains('cart');
      var toM = nav === 'market' || nav === 'filters', toH = nav === 'home' || a.classList.contains('brand'), toC = nav === 'collections' && !!co, toG = (nav === 'guide' || nav === 'how') && !!gd;
      if (!toM && !toH && !toC && !toG && !isCart) return;
      e.preventDefault(); e.stopPropagation();
      var pc = $('#closePanel'); if ($('#panel.open') && pc) pc.click();
      if (isCart){ openCart(); return; }
      closeSheet();
      if (toG) gd.scrollIntoView({ behavior:smooth, block:'start' });
      else if (toC) co.scrollIntoView({ behavior:smooth, block:'start' });
      else if (toM){
        if (nav === 'filters' && inM){ off = !off; syncOpen(); return; }
        mk.scrollIntoView({ behavior:smooth, block:'start' });
      } else window.scrollTo({ top:0, behavior:smooth });
    }, true);

    render(); renderCart(); spy(); paintHead(); syncOpen();
  });
})();
