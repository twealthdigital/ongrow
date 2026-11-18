/* Auth: the sell gate dialog, the account dropdown and the account button states.
   Front end only for now. Accounts and the session live in localStorage, and every storage call sits in
   the "store" block, so swapping it for real API calls later does not touch the interface code. */
(function(){
  var O = window.Ohgrow, $ = O.$, $$ = O.$$;
  var SELL_URL = 'sell.html';
  var desk = window.matchMedia('(min-width:1100px)');

  /* ---------- store ---------- */
  var AKEY = 'ohgrow.accounts', SKEY = 'ohgrow.session';
  function read(k, d){ try{ var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; }catch(_){ return d; } }
  function write(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(_){ return false; } }
  function hex(buf){ return Array.prototype.map.call(new Uint8Array(buf), function(x){ return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function salt(){
    if (window.crypto && crypto.getRandomValues) return hex(crypto.getRandomValues(new Uint8Array(12)));
    return String(Math.random()).slice(2) + Date.now().toString(16);
  }
  function digest(s){
    if (window.crypto && crypto.subtle && window.TextEncoder) return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(hex);
    var h = 5381, i = 0;   /* plain http fallback, only used when the browser has no crypto.subtle */
    for (; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return Promise.resolve('f' + (h >>> 0).toString(16));
  }
  var store = {
    user: function(){ var u = read(SKEY, null); return u && u.email ? u : null; },
    signUp: function(name, email, pw){
      var list = read(AKEY, []);
      if (list.some(function(a){ return a.email === email; })) return Promise.resolve({ error:'That email already has an account. Try signing in.', field:'email' });
      var s = salt();
      return digest(s + pw).then(function(h){
        list.push({ name:name, email:email, salt:s, hash:h });
        if (!write(AKEY, list)) return { error:'Your browser would not save the account. Check that storage is allowed.' };
        var u = { name:name, email:email }; write(SKEY, u); return { user:u };
      });
    },
    signIn: function(email, pw){
      var a = read(AKEY, []).filter(function(x){ return x.email === email; })[0];
      if (!a) return Promise.resolve({ error:'We could not find an account with that email.', field:'email' });
      return digest(a.salt + pw).then(function(h){
        if (h !== a.hash) return { error:'That password does not match.', field:'password' };
        var u = { name:a.name, email:a.email }; write(SKEY, u); return { user:u };
      });
    },
    signOut: function(){ try{ localStorage.removeItem(SKEY); }catch(_){} }
  };

  var clamp = function(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); };
  var first = function(u){ return u.name.trim().split(/\s+/)[0]; };
  var initial = function(u){ return u.name.trim().charAt(0); };
  function el(tag, cls, text){ var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function arrow(){
    var s = el('span', 'am-go'); s.innerHTML = '<svg class="i"><use href="assets/icons/sprite.svg?v=64#arrow"/></svg>'; return s;
  }

  O.ready.then(function(){
    var dlg = $('#auth'), scrim = $('#auScrim'), menu = $('#acctMenu'), toastEl = $('#auToast');
    if (!dlg || !menu) return;
    var body = document.body, tabs = $$('.au-tabs [data-mode]', dlg), forms = $$('.au-form', dlg);
    var st = { open:false, pop:false, anchor:null, intent:null, opener:null, busy:false };
    var mst = { open:false, btn:null };

    /* ---------- toast ---------- */
    var tt;
    function toast(msg){
      toastEl.textContent = msg; toastEl.classList.add('show');
      clearTimeout(tt); tt = setTimeout(function(){ toastEl.classList.remove('show'); }, 2800);
    }

    /* ---------- account buttons ---------- */
    function renderAccount(){
      var u = store.user();
      $$('.sell-cta').forEach(function(b){
        var l = $('.lbl', b); if (l) l.textContent = u ? 'Add products' : 'Start selling';
        if (u) b.setAttribute('data-in', ''); else b.removeAttribute('data-in');
      });
      $$('.acct-btn').forEach(function(b){
        b.dataset.state = u ? 'in' : 'out';
        b.setAttribute('aria-label', u ? 'Account, ' + u.name : 'Account');
        if (b.closest('.rail-account')) b.title = u ? u.name : 'Account';
        var i = $('.acct-init', b); if (i) i.textContent = u ? initial(u) : '';
      });
    }

    /* the pill is black on bright screens and greenish white on dark ones (sections marked data-tone="dark") */
    var darks = $$('[data-tone="dark"]'), ra = $('.rail-account'), tick = false;
    function syncTone(){
      tick = false;
      if (!ra) return;
      var r = ra.getBoundingClientRect(); if (!r.height) return;
      var y = r.top + r.height / 2, dark = false;
      darks.forEach(function(s){ var b = s.getBoundingClientRect(); if (b.top <= y && b.bottom >= y) dark = true; });
      ra.dataset.tone = dark ? 'dark' : 'light';
      if (mst.open && mst.btn && mst.btn.closest('.rail-account')) menu.dataset.tone = dark ? 'dark' : 'light';
    }
    function queueTone(){ if (!tick){ tick = true; requestAnimationFrame(syncTone); } }
    window.addEventListener('scroll', queueTone, { passive:true });
    window.addEventListener('resize', queueTone);

    /* ---------- dropdown ---------- */
    function buildMenu(){
      var b = $('.am-body', menu), u = store.user(); b.textContent = '';
      if (u){
        var who = el('div', 'am-who');
        who.appendChild(el('span', 'am-av', initial(u)));
        who.appendChild(el('span', 'am-name', u.name));
        who.appendChild(el('span', 'am-mail', u.email));
        b.appendChild(who);
        var pr = el('button', 'am-item is-main'); pr.type = 'button'; pr.setAttribute('role', 'menuitem'); pr.dataset.act = 'products';
        pr.appendChild(el('span', null, 'My products')); pr.appendChild(arrow()); b.appendChild(pr);
        var out = el('button', 'am-item'); out.type = 'button'; out.setAttribute('role', 'menuitem'); out.dataset.act = 'signout';
        out.appendChild(el('span', null, 'Sign out')); out.appendChild(arrow()); b.appendChild(out);
      } else {
        b.appendChild(el('p', 'am-title', 'Your account'));
        b.appendChild(el('p', 'am-sub', 'Sign in to sell your harvest and keep track of it.'));
        var a = el('button', 'am-item is-main'); a.type = 'button'; a.setAttribute('role', 'menuitem'); a.dataset.act = 'signin';
        a.appendChild(el('span', null, 'Sign in')); a.appendChild(arrow()); b.appendChild(a);
        var c = el('button', 'am-item'); c.type = 'button'; c.setAttribute('role', 'menuitem'); c.dataset.act = 'signup';
        c.appendChild(el('span', null, 'Sign up')); c.appendChild(arrow()); b.appendChild(c);
      }
    }
    function placeMenu(){
      if (!mst.btn) return;
      var r = mst.btn.getBoundingClientRect(), w = menu.offsetWidth, h = menu.offsetHeight, side = !!mst.btn.closest('.rail-account');
      var left, top;
      menu.classList.toggle('is-side', side); menu.classList.toggle('is-drop', !side);
      if (side){
        left = r.right + 18; top = clamp(r.top + r.height / 2 - 40, 12, Math.max(12, window.innerHeight - h - 12));
        menu.style.setProperty('--tail', (r.top + r.height / 2 - top) + 'px');
        menu.style.setProperty('--ox', '0px'); menu.style.setProperty('--oy', (r.top + r.height / 2 - top) + 'px');
      } else {
        left = clamp(r.right - w, 12, window.innerWidth - w - 12); top = r.bottom + 14;
        menu.style.setProperty('--tail', (left + w - (r.left + r.width / 2)) + 'px');
        menu.style.setProperty('--ox', (r.left + r.width / 2 - left) + 'px'); menu.style.setProperty('--oy', '0px');
      }
      menu.style.left = left + 'px'; menu.style.top = top + 'px';
    }
    function openMenu(btn){
      if (st.open) closeAuth(true);
      mst.btn = btn; mst.open = true;
      buildMenu();
      menu.dataset.tone = btn.closest('.rail-account') ? (ra && ra.dataset.tone === 'dark' ? 'dark' : 'light') : 'paper';
      menu.inert = false; placeMenu();
      requestAnimationFrame(function(){ menu.classList.add('open'); });
      btn.setAttribute('aria-expanded', 'true');
      setTimeout(function(){ var f = $('.am-item', menu); if (f && mst.open) f.focus({ preventScroll:true }); }, 120);
    }
    function closeMenu(restore){
      if (!mst.open) return;
      mst.open = false; menu.classList.remove('open'); menu.inert = true;
      if (mst.btn){ mst.btn.setAttribute('aria-expanded', 'false'); if (restore) mst.btn.focus({ preventScroll:true }); }
    }
    menu.addEventListener('click', function(e){
      var it = e.target.closest('[data-act]'); if (!it) return;
      var btn = mst.btn, act = it.dataset.act;
      closeMenu(false);
      if (act === 'signout'){
        store.signOut(); renderAccount();
        if (document.body.dataset.page === 'sell'){ O.go('home.html'); return; }
        toast('You are signed out');
      }
      else if (act === 'products') openProducts(btn);
      else openAuth({ anchor:btn, mode:act, intent:null });
    });
    $$('.acct-btn').forEach(function(b){
      b.addEventListener('click', function(){
        if (mst.open && mst.btn === b){ closeMenu(true); return; }
        closeMenu(false); openMenu(b);
      });
    });

    /* ---------- my products: a big dialog with everything the signed-in seller listed ---------- */
    var LKEY = 'ohgrow.listings', SPR = 'assets/icons/sprite.svg?v=64#';
    var mp = { built:false, open:false, opener:null, root:null, scrim:null, list:null, count:null };
    var money = function(n){ return '\u20A6' + Number(n).toLocaleString('en-NG'); };
    function sym(id){ var s = el('span', 'mp-ic'); s.innerHTML = '<svg class="i"><use href="' + SPR + id + '"/></svg>'; return s; }
    function listings(){ try{ var l = JSON.parse(localStorage.getItem(LKEY)); return Array.isArray(l) ? l : []; }catch(_){ return []; } }
    function mine(){ var u = store.user(); return listings().filter(function(l){ return u && l.owner === u.email; }).reverse(); }
    function buildProducts(){
      mp.scrim = el('div', 'mp-scrim');
      mp.root = el('section', 'mp'); mp.root.setAttribute('role', 'dialog'); mp.root.setAttribute('aria-modal', 'true'); mp.root.setAttribute('aria-labelledby', 'mpTitle'); mp.root.inert = true;
      var x = el('button', 'mp-x'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.appendChild(sym('close'));
      var head = el('header', 'mp-head'), h = el('h2', null, 'Your products '); h.id = 'mpTitle';
      mp.count = el('em', null, '0'); h.appendChild(mp.count); head.appendChild(h);
      head.appendChild(el('p', null, 'Everything you listed. View it the way buyers see it, edit it, or take it down.'));
      var add = el('a', 'mp-add'); add.href = 'sell.html'; add.appendChild(el('span', null, 'Add product')); add.appendChild(sym('plus')); head.appendChild(add);
      mp.list = el('div', 'mp-grid');
      mp.root.appendChild(x); mp.root.appendChild(head); mp.root.appendChild(mp.list);
      document.body.appendChild(mp.scrim); document.body.appendChild(mp.root);
      x.addEventListener('click', closeProducts); mp.scrim.addEventListener('click', closeProducts);
      add.addEventListener('click', function(e){ if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); closeProducts(false); O.go('sell.html'); });
      document.addEventListener('keydown', function(e){
        if (!mp.open) return;
        if (e.key === 'Escape'){ e.stopPropagation(); closeProducts(); return; }
        if (e.key !== 'Tab') return;
        var f = $$('button,a[href]', mp.root).filter(function(n){ return !n.disabled && n.offsetParent !== null; });
        if (!f.length) return;
        var a0 = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a0){ e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z){ e.preventDefault(); a0.focus(); }
      }, true);
      mp.built = true;
    }
    function paintProducts(){
      var l = mine(); mp.count.textContent = l.length; mp.list.textContent = '';
      if (!l.length){
        var em = el('div', 'mp-empty'); em.appendChild(el('p', null, 'Nothing listed yet. Add your first product and buyers can find it in the market.'));
        var go = el('a', 'mp-add'); go.href = 'sell.html'; go.appendChild(el('span', null, 'Add product')); go.appendChild(sym('plus'));
        go.addEventListener('click', function(e){ e.preventDefault(); closeProducts(false); O.go('sell.html'); });
        em.appendChild(go); mp.list.appendChild(em); return;
      }
      l.forEach(function(it){
        var card = el('article', 'mp-card'), tile = el('div', 'mp-tile'), im = el('img'); im.src = it.photos && it.photos[0] || ''; im.alt = ''; tile.appendChild(im);
        var body = el('div', 'mp-body');
        body.appendChild(el('h3', null, it.name));
        var pr = el('p', 'mp-price', money(it.price) + ' '); pr.appendChild(el('span', null, it.unit)); body.appendChild(pr);
        body.appendChild(el('p', 'mp-meta', it.qty + ' available \u00B7 ' + it.cat + ' \u00B7 ' + it.state));
        var row = el('div', 'mp-acts');
        var v = el('button', 'mp-view'); v.type = 'button'; v.appendChild(el('span', null, 'View')); v.appendChild(sym('arrow'));
        var ed = el('button', 'mp-edit'); ed.type = 'button'; ed.appendChild(sym('pen')); ed.appendChild(el('span', null, 'Edit'));
        var rm = el('button', 'mp-del'); rm.type = 'button'; rm.setAttribute('aria-label', 'Remove ' + it.name); rm.appendChild(sym('trash')); var rl = el('span', null, 'Remove'); rm.appendChild(rl);
        v.addEventListener('click', function(){
          closeProducts(false);
          if ($('#market')) document.dispatchEvent(new CustomEvent('ohgrow:view-product', { detail:{ id:it.id } }));
          else O.go('home.html?view=' + encodeURIComponent(it.id) + '#market');
        });
        ed.addEventListener('click', function(){
          closeProducts(false);
          if (document.body.dataset.page === 'sell') document.dispatchEvent(new CustomEvent('ohgrow:edit-listing', { detail:{ id:it.id } }));
          else O.go('sell.html?edit=' + encodeURIComponent(it.id));
        });
        var t;
        rm.addEventListener('click', function(){
          if (rm.classList.contains('is-sure')){
            try{ localStorage.setItem(LKEY, JSON.stringify(listings().filter(function(x){ return x.id !== it.id; }))); }catch(_){}
            document.dispatchEvent(new CustomEvent('ohgrow:listings-changed')); paintProducts(); toast('Listing removed'); return;
          }
          rm.classList.add('is-sure'); rl.textContent = 'Tap again';
          clearTimeout(t); t = setTimeout(function(){ rm.classList.remove('is-sure'); rl.textContent = 'Remove'; }, 3000);
        });
        row.appendChild(v); row.appendChild(ed); row.appendChild(rm);
        body.appendChild(row); card.appendChild(tile); card.appendChild(body); mp.list.appendChild(card);
      });
    }
    function openProducts(opener){
      if (!mp.built) buildProducts();
      if (st.open) closeAuth(true);
      mp.opener = opener || document.activeElement; paintProducts();
      mp.root.inert = false; mp.open = true; mp.root.scrollTop = 0;
      requestAnimationFrame(function(){ mp.root.classList.add('open'); mp.scrim.classList.add('open'); });
      body.classList.add('lock');
      setTimeout(function(){ var x = $('.mp-x', mp.root); if (x && mp.open) x.focus({ preventScroll:true }); }, 80);
    }
    function closeProducts(restore){
      if (!mp.open) return;
      mp.open = false; mp.root.classList.remove('open'); mp.scrim.classList.remove('open'); mp.root.inert = true; body.classList.remove('lock');
      if (restore !== false && mp.opener && mp.opener.focus) mp.opener.focus({ preventScroll:true });
    }

    /* ---------- dialog ---------- */
    var COPY = {
      signup: {
        sell: { chip:'Before you sell', t1:'Start selling', t2:'in a minute', sub:'Make a free account, then list your produce and reach buyers near you.' },
        open: { chip:'Join Ohgrow', t1:'Grow with', t2:'Ohgrow', sub:'Make a free account to list your produce and sell straight to buyers nearby.' }
      },
      signin: {
        sell: { chip:'Before you sell', t1:'Welcome', t2:'back', sub:'Sign in to list your produce and manage what you sell.' },
        open: { chip:'Your account', t1:'Good to', t2:'see you', sub:'Sign in to pick up where you left off.' }
      }
    };
    function setMode(mode, keepEmail){
      var prev = $$('.au-form', dlg).filter(function(f){ return !f.hidden; })[0], mail = prev ? $('[name="email"]', prev).value : '';
      dlg.dataset.mode = mode;
      tabs.forEach(function(t){ t.setAttribute('aria-selected', t.dataset.mode === mode ? 'true' : 'false'); });
      forms.forEach(function(f){ f.hidden = f.dataset.mode !== mode; clearErrors(f); });
      var c = COPY[mode][st.intent ? 'sell' : 'open'];
      $('#auChip').textContent = c.chip; $('#auT1').textContent = c.t1; $('#auT2').textContent = c.t2; $('#auSub').textContent = c.sub;
      if (keepEmail && mail){ var f = $('.au-form[data-mode="' + mode + '"] [name="email"]', dlg); if (f && !f.value) f.value = mail; }
    }
    tabs.forEach(function(t){ t.addEventListener('click', function(){ if (dlg.dataset.mode !== t.dataset.mode){ setMode(t.dataset.mode, true); focusFirst(); } }); });
    $$('.au-swap [data-mode]', dlg).forEach(function(b){ b.addEventListener('click', function(){ setMode(b.dataset.mode, true); focusFirst(); }); });

    function focusFirst(){
      var f = $$('.au-form', dlg).filter(function(x){ return !x.hidden; })[0];
      var i = f && $$('input', f).filter(function(x){ return !x.value; })[0] || (f && $('input', f));
      if (i) i.focus({ preventScroll:true });
    }
    function placeDialog(){
      if (!st.open) return;
      var a = st.anchor, w = dlg.offsetWidth;
      if (st.pop && a){
        var r = a.getBoundingClientRect(), cx = r.left + r.width / 2, left = clamp(cx - w / 2, 16, window.innerWidth - w - 16), top = r.bottom + 18;
        dlg.style.left = left + 'px'; dlg.style.top = top + 'px';
        dlg.style.setProperty('--top', top + 'px'); dlg.style.setProperty('--tail', (cx - left) + 'px');
        dlg.style.setProperty('--ox', (cx - left) + 'px'); dlg.style.setProperty('--oy', '0px');
      } else {
        dlg.style.left = dlg.style.top = '';
        if (a){
          var q = a.getBoundingClientRect();
          dlg.style.setProperty('--ox', (q.left + q.width / 2 - dlg.offsetLeft) + 'px');
          dlg.style.setProperty('--oy', (q.top + q.height / 2 - dlg.offsetTop) + 'px');
        } else { dlg.style.setProperty('--ox', '50%'); dlg.style.setProperty('--oy', '50%'); }
      }
    }
    function openAuth(o){
      if (mst.open) closeMenu(false);
      var a = o.anchor && !o.anchor.closest('#panel') ? o.anchor : null;
      if (st.open) closeAuth(false);
      st.anchor = a; st.intent = o.intent || null; st.opener = a || document.activeElement;
      st.pop = !!a && desk.matches && !!a.closest('.head');
      dlg.classList.toggle('is-pop', st.pop);
      st.open = true;
      setMode(o.mode || 'signup', false);
      forms.forEach(function(f){ f.reset(); clearErrors(f); resetEye(f); });
      dlg.inert = false;
      scrim.classList.add('open'); body.classList.add('au-open'); if (!st.pop) body.classList.add('lock');
      if (a) a.classList.add('is-raised');
      placeDialog();
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ dlg.classList.add('open'); }); });
      setTimeout(function(){ if (st.open) focusFirst(); }, 260);
    }
    function closeAuth(restore){
      if (!st.open) return;
      st.open = false;
      dlg.classList.remove('open'); dlg.inert = true; scrim.classList.remove('open'); body.classList.remove('au-open'); body.classList.remove('lock');
      if (st.anchor) st.anchor.classList.remove('is-raised');
      if (restore && st.opener && st.opener.focus && document.contains(st.opener)) st.opener.focus({ preventScroll:true });
      st.anchor = null;
    }
    $('#auClose').addEventListener('click', function(){ closeAuth(true); });
    window.addEventListener('resize', function(){
      if (!st.open) return;
      if (st.pop !== (!!st.anchor && desk.matches && !!st.anchor.closest('.head'))) closeAuth(false); else placeDialog();
    });
    window.addEventListener('scroll', function(){ if (st.open && st.pop) placeDialog(); if (mst.open) placeMenu(); }, { passive:true });

    /* close on outside press and Escape, keep Tab inside the dialog */
    document.addEventListener('pointerdown', function(e){
      var t = e.target;
      if (st.open && !dlg.contains(t) && !(st.anchor && st.anchor.contains(t))) closeAuth(false);
      if (mst.open && !menu.contains(t) && !(mst.btn && mst.btn.contains(t))) closeMenu(false);
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape'){
        if (st.open){ closeAuth(true); e.stopPropagation(); }
        else if (mst.open) closeMenu(true);
      }
      if (e.key === 'Tab' && st.open && !st.pop){
        var f = $$('button,input,a[href]', dlg).filter(function(x){ return !x.disabled && x.offsetParent !== null; });
        if (!f.length) return;
        var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a){ e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z){ e.preventDefault(); a.focus(); }
      }
    }, true);

    /* ---------- loading screen: shown after sign up, before the sell page ---------- */
    var ld = $('#auLoad');
    function showLoader(u, fresh){
      st.busy = true;
      if (!ld){ O.go(SELL_URL); return; }
      var msgs = fresh ? ['Creating your account', 'Setting up your seller space', 'Almost ready']
                       : ['Signing you in', 'Opening your seller space', 'Almost ready'];
      var dur = O.reduce ? 700 : 3000, msg = $('#alMsg'), fill = $('#alFill');
      $('#alHi').textContent = (fresh ? 'Welcome to Ohgrow, ' : 'Welcome back, ') + first(u);
      msg.textContent = msgs[0];
      fill.style.transitionDuration = dur + 'ms';
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      ld.inert = false; ld.setAttribute('aria-hidden', 'false');
      body.classList.add('lock');
      ld.classList.add('on');
      O.replay($('#alLogo'));
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ ld.classList.add('run'); }); });
      setTimeout(function(){ msg.textContent = msgs[1]; }, dur * .38);
      setTimeout(function(){ msg.textContent = msgs[2]; }, dur * .76);
      setTimeout(function(){ O.go(SELL_URL); }, dur);
    }
    /* coming back with the browser's back button must not leave the loader on screen */
    window.addEventListener('pageshow', function(e){
      if (!e.persisted || !ld) return;
      ld.classList.remove('on', 'run'); ld.inert = true; ld.setAttribute('aria-hidden', 'true');
      body.classList.remove('lock'); st.busy = false;
    });

    /* ---------- forms ---------- */
    function fieldOf(form, name){ return $('[name="' + name + '"]', form).closest('.au-f'); }
    function setErr(form, name, msg){
      var f = fieldOf(form, name), m = $('.au-err', f);
      f.classList.add('has-err'); m.textContent = msg; m.hidden = false;
      $('input', f).setAttribute('aria-invalid', 'true');
    }
    function clearErrors(form){
      $$('.au-f', form).forEach(function(f){
        f.classList.remove('has-err'); var m = $('.au-err', f); m.textContent = ''; m.hidden = true;
        $('input', f).removeAttribute('aria-invalid');
      });
    }
    function resetEye(form){
      $$('.au-eye', form).forEach(function(b){ var i = b.previousElementSibling; i.type = 'password'; b.textContent = 'Show'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'Show password'); });
    }
    forms.forEach(function(form){
      $$('input', form).forEach(function(i){ i.addEventListener('input', function(){
        var f = i.closest('.au-f'); if (f.classList.contains('has-err')){ f.classList.remove('has-err'); var m = $('.au-err', f); m.hidden = true; i.removeAttribute('aria-invalid'); }
      }); });
      $$('.au-eye', form).forEach(function(b){ b.addEventListener('click', function(){
        var i = b.previousElementSibling, show = i.type === 'password';
        i.type = show ? 'text' : 'password'; b.textContent = show ? 'Hide' : 'Show';
        b.setAttribute('aria-pressed', show ? 'true' : 'false'); b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      }); });
      form.addEventListener('submit', function(e){
        e.preventDefault(); if (st.busy) return;
        clearErrors(form);
        var up = form.dataset.mode === 'signup', v = {}, bad = null;
        $$('input', form).forEach(function(i){ v[i.name] = i.value; });
        var name = (v.name || '').trim(), email = (v.email || '').trim().toLowerCase(), pw = v.password || '';
        function flag(n, m){ setErr(form, n, m); if (!bad) bad = n; }
        if (up && name.length < 2) flag('name', 'Tell us your name.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) flag('email', 'Enter a valid email.');
        if (!pw) flag('password', up ? 'Choose a password.' : 'Enter your password.');
        else if (up && pw.length < 8) flag('password', 'Use at least 8 characters.');
        if (bad){ shake(form); $('[name="' + bad + '"]', form).focus(); return; }
        var btn = $('.au-submit', form), lbl = $('.au-lbl', btn), txt = lbl.textContent;
        st.busy = true; btn.classList.add('is-busy'); lbl.textContent = 'One moment';
        (up ? store.signUp(name, email, pw) : store.signIn(email, pw)).then(function(res){
          st.busy = false; btn.classList.remove('is-busy'); lbl.textContent = txt;
          if (res.error){ setErr(form, res.field || 'password', res.error); shake(form); $('[name="' + (res.field || 'password') + '"]', form).focus(); return; }
          var intent = st.intent;
          closeAuth(false); renderAccount();
          /* a new account, or a sign in that came from the sell gate, goes through the loading screen to the sell page */
          if (up || intent === 'sell'){ showLoader(res.user, up); return; }
          toast('Welcome back, ' + first(res.user));
        });
      });
    });
    function shake(form){ form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); }

    /* ---------- the sell gate: anything that goes to the sell page asks for an account first ---------- */
    document.addEventListener('click', function(e){
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      var a = e.target.closest('a'); if (!a) return;
      var isSell = a.dataset.nav === 'sell' || /(^|\/)sell\.html([?#]|$)/.test(a.getAttribute('href') || '');
      if (!isSell || store.user()) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (st.open && st.anchor === a){ closeAuth(true); return; }
      var pc = $('#closePanel'); if ($('#panel.open') && pc) pc.click();
      openAuth({ anchor:a, mode:'signup', intent:'sell' });
    }, true);

    window.addEventListener('storage', function(e){ if (e.key === SKEY || e.key === null){ renderAccount(); if (mst.open) buildMenu(); } });
    O.auth = { user:store.user, open:openAuth, signOut:function(){ store.signOut(); renderAccount(); } };
    renderAccount(); syncTone();
    window.addEventListener('load', syncTone);
  });
})();
