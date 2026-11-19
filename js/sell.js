/* Sell page: product upload. Front end only for now.
   Listings live in localStorage and every storage call sits in the "store" block, so swapping it for real
   API calls later does not touch the interface code. The market reads the same list (js/market.js). */
(function(){
  var O = window.Ohgrow, $ = O.$, $$ = O.$$;
  var SKEY = 'ohgrow.session', LKEY = 'ohgrow.listings';
  var MAX_PHOTOS = 4, MAX_SIDE = 760, MAX_FILE = 15 * 1024 * 1024;

  function session(){ try{ var u = JSON.parse(localStorage.getItem(SKEY)); return u && u.email ? u : null; }catch(_){ return null; } }

  /* only signed-in sellers belong here. Anyone else goes back to the home page. */
  if (!session()){ window.location.replace('home.html'); return; }

  /* signing out in another tab sends this page home too */
  window.addEventListener('storage', function(e){
    if ((e.key === SKEY || e.key === null) && !session()) O.go('home.html');
  });

  /* ---------- store ---------- */
  var store = {
    all: function(){ try{ var l = JSON.parse(localStorage.getItem(LKEY)); return Array.isArray(l) ? l : []; }catch(_){ return []; } },
    mine: function(){ var u = session(); return store.all().filter(function(l){ return u && l.owner === u.email; }); },
    add: function(item){
      var l = store.all(); l.push(item);
      try{ localStorage.setItem(LKEY, JSON.stringify(l)); return true; }catch(_){ return false; }
    },
    update: function(item){
      var l = store.all().map(function(x){ return x.id === item.id ? item : x; });
      try{ localStorage.setItem(LKEY, JSON.stringify(l)); return true; }catch(_){ return false; }
    },
    remove: function(id){
      var l = store.all().filter(function(x){ return x.id !== id; });
      try{ localStorage.setItem(LKEY, JSON.stringify(l)); }catch(_){}
    }
  };

  var fmt = function(n){ return '\u20A6' + Number(n).toLocaleString('en-NG'); };
  function el(tag, cls, text){ var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function icon(id){ var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); s.setAttribute('class', 'i'); u.setAttribute('href', 'assets/icons/sprite.svg?v=69#' + id); s.appendChild(u); return s; }

  O.ready.then(function(){
    /* the shared header, side bar and menu use in-page links (#market, #guide) that only exist on the home page */
    $$('a[href^="#"]').forEach(function(a){ a.setAttribute('href', 'home.html' + a.getAttribute('href')); });

    var form = $('#slForm'), photos = [], busy = false;
    var drop = $('#slDrop'), file = $('#slFile'), thumbs = $('#slThumbs'), phErr = $('#slPhotoErr'), formErr = $('#slFormErr');
    var desc = $('[name="desc"]', form), count = $('#slCount');

    /* toast: reuses the one the account dialog ships with */
    var tt;
    function toast(msg){
      var t = $('#auToast'); if (!t) return;
      t.textContent = msg; t.classList.add('show');
      clearTimeout(tt); tt = setTimeout(function(){ t.classList.remove('show'); }, 3200);
    }

    /* ---------- photos ---------- */
    function shrink(f){
      return new Promise(function(ok, no){
        var url = URL.createObjectURL(f), img = new Image();
        img.onload = function(){
          var k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
          c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
          var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', .72));
        };
        img.onerror = function(){ URL.revokeObjectURL(url); no(); };
        img.src = url;
      });
    }
    function photoError(msg){ phErr.textContent = msg || ''; phErr.hidden = !msg; }
    function drawThumbs(){
      thumbs.textContent = '';
      photos.forEach(function(src, i){
        var li = el('li', 'sl-th'), im = el('img'); im.src = src; im.alt = 'Photo ' + (i + 1);
        var x = el('button'); x.type = 'button'; x.setAttribute('aria-label', 'Remove photo ' + (i + 1)); x.appendChild(icon('close'));
        x.addEventListener('click', function(){ photos.splice(i, 1); drawThumbs(); photoError(''); });
        li.appendChild(im); li.appendChild(x);
        if (i === 0) li.appendChild(el('span', 'sl-cover', 'Cover'));
        thumbs.appendChild(li);
      });
      drop.classList.toggle('is-full', photos.length >= MAX_PHOTOS);
    }
    function addFiles(list){
      var files = Array.prototype.slice.call(list || []), room = MAX_PHOTOS - photos.length, msg = '';
      if (!files.length || busy) return;
      var ok = files.filter(function(f){
        if (!/^image\//.test(f.type)){ msg = 'Only photos can be added (JPG or PNG).'; return false; }
        if (f.size > MAX_FILE){ msg = 'One photo is too large. Pick one under 15 MB.'; return false; }
        return true;
      });
      if (ok.length > room){ ok = ok.slice(0, room); msg = 'You can add up to ' + MAX_PHOTOS + ' photos.'; }
      busy = true; photoError('');
      Promise.all(ok.map(function(f){ return shrink(f).catch(function(){ msg = 'One photo could not be read. Try a JPG or PNG.'; return null; }); }))
        .then(function(r){ r.forEach(function(s){ if (s) photos.push(s); }); drawThumbs(); photoError(msg); busy = false; });
    }
    $('#slPick').addEventListener('click', function(){ file.click(); });
    file.addEventListener('change', function(){ addFiles(file.files); file.value = ''; });
    ['dragenter', 'dragover'].forEach(function(t){ drop.addEventListener(t, function(e){ e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function(t){ drop.addEventListener(t, function(e){ e.preventDefault(); drop.classList.remove('is-over'); }); });
    drop.addEventListener('drop', function(e){ addFiles(e.dataTransfer && e.dataTransfer.files); });

    desc.addEventListener('input', function(){ count.textContent = desc.value.length + ' / 400'; });

    /* ---------- validation ---------- */
    function box(name){ var n = $('[name="' + name + '"]', form); return n && (n.closest('.sl-f')); }
    function setErr(name, msg){
      var b = box(name); if (!b) return; var m = $('.sl-err', b);
      b.classList.add('has-err'); m.textContent = msg; m.hidden = false;
      var inp = $('[name="' + name + '"]', form); if (inp) inp.setAttribute('aria-invalid', 'true');
    }
    function clearErr(b){
      b.classList.remove('has-err'); var m = $('.sl-err', b); if (m){ m.textContent = ''; m.hidden = true; }
      $$('[aria-invalid]', b).forEach(function(i){ i.removeAttribute('aria-invalid'); });
    }
    $$('.sl-f', form).forEach(function(b){
      $$('input,textarea,select', b).forEach(function(i){
        i.addEventListener('input', function(){ clearErr(b); formErr.hidden = true; });
        i.addEventListener('change', function(){ clearErr(b); formErr.hidden = true; });
      });
    });

    /* extras: a ticked choice with an empty price means "offered, no extra" */
    function num(name){ var v = form.elements[name].value; return v === '' ? 0 : +v; }
    function syncOpts(){
      var f = form.elements;
      ['select', 'export', 'today', 'tomorrow', 'week'].forEach(function(k){
        var on = f['o_' + k].checked, p = f['o_' + k + '_p']; p.disabled = !on; if (!on) p.value = '';
      });
      var d = f.delivery.checked; f.fee.disabled = !d; if (!d) f.fee.value = '';
      $('#slFeeNote').textContent = d ? 'Doorstep delivery is on' : 'Delivery is off';
    }
    form.addEventListener('change', syncOpts); syncOpts();

    function read(){
      var f = form.elements, u = session();
      var opts = { select: f.o_select.checked ? Math.round(num('o_select_p')) : null, export: f.o_export.checked ? Math.round(num('o_export_p')) : null,
        fee: f.delivery.checked ? Math.round(num('fee')) : 0,
        need: { today: f.o_today.checked ? Math.round(num('o_today_p')) : null, tomorrow: f.o_tomorrow.checked ? Math.round(num('o_tomorrow_p')) : null, week: f.o_week.checked ? Math.round(num('o_week_p')) : null } };
      return { opts: opts,
        name: f.name.value.trim(), cat: f.cat.value, desc: f.desc.value.trim(), price: Math.round(+f.price.value), unit: f.unit.value,
        qty: Math.round(+f.qty.value), harvest: f.harvest.value, organic: f.organic.checked, state: f.state.value, town: f.town.value.trim(),
        farm: f.farm.value.trim() || u.name, phone: f.phone.value.trim(), pickup: f.pickup.checked, delivery: f.delivery.checked
      };
    }
    function validate(v){
      var bad = [];
      function no(n, m){ setErr(n, m); bad.push(n); }
      photoError('');
      if (!photos.length){ photoError('Add at least one photo of your produce.'); bad.push('photos'); }
      if (v.name.length < 2) no('name', 'Give your product a name.');
      if (!v.cat) no('cat', 'Choose a category.');
      if (v.desc.length < 10) no('desc', 'Write at least a short description (10 characters).');
      if (!(v.price >= 1)) no('price', 'Enter a price.'); else if (v.price > 5000000) no('price', 'That price looks too high.');
      if (!v.unit) no('unit', 'Choose how it is sold.');
      if (!(v.qty >= 1)) no('qty', 'Enter how many are available.');
      if (!v.state) no('state', 'Choose a state.');
      if (v.town.length < 2) no('town', 'Enter the town or area.');
      var digits = v.phone.replace(/\D/g, '');
      if (!/^\+?[0-9\s()-]+$/.test(v.phone) || digits.length < 10 || digits.length > 14) no('phone', 'Enter a valid phone number.');
      [['select', 'o_select_p'], ['export', 'o_export_p'], ['today', 'o_today_p'], ['tomorrow', 'o_tomorrow_p'], ['week', 'o_week_p']].forEach(function(t){
        var raw = form.elements[t[1]].value, on = form.elements['o_' + t[0]].checked;
        if (!on) return;
        if (raw === '') no(t[1], 'Add a price (0 for no extra) or untick it.');
        else if (!(+raw >= 0 && +raw <= 5000000)) no(t[1], 'Enter 0 or more.');
      });
      if (form.elements.delivery.checked && form.elements.fee.value !== '' && !(+form.elements.fee.value >= 0 && +form.elements.fee.value <= 5000000)) no('fee', 'Enter 0 or more.');
      if (!v.pickup && !v.delivery){ var fb = $('#slFul'); fb.classList.add('has-err'); var m = $('.sl-err', fb); m.textContent = 'Choose pickup, delivery or both.'; m.hidden = false; bad.push('pickup'); }
      return bad;
    }

    /* ---------- edit a listing: the same form, filled with what was published ---------- */
    var editing = null, lbl = $('.sl-lbl', form), cancel = $('#slCancel'), chip = $('#slChip');
    function fillForm(l){
      var f = form.elements, o = l.opts || {}, n = o.need || {};
      f.name.value = l.name; f.cat.value = l.cat; f.desc.value = l.desc; count.textContent = l.desc.length + ' / 400';
      f.price.value = l.price; f.unit.value = l.unit; f.qty.value = l.qty; f.harvest.value = l.harvest; f.organic.checked = !!l.organic;
      f.state.value = l.state; f.town.value = l.town; f.farm.value = l.farm === session().name ? '' : l.farm; f.phone.value = l.phone;
      f.pickup.checked = !!l.pickup; f.delivery.checked = !!l.delivery;
      f.o_select.checked = o.select != null; f.o_export.checked = o.export != null;
      f.o_today.checked = n.today != null; f.o_tomorrow.checked = n.tomorrow != null; f.o_week.checked = n.week != null;
      syncOpts();
      f.o_select_p.value = o.select || ''; f.o_export_p.value = o.export || '';
      f.o_today_p.value = n.today || ''; f.o_tomorrow_p.value = n.tomorrow || ''; f.o_week_p.value = n.week || '';
      f.fee.value = f.delivery.checked ? (o.fee || '') : '';
      photos = l.photos.slice(); drawThumbs(); photoError('');
      $$('select', form).forEach(function(x){ x.dispatchEvent(new Event('dd-sync')); });
      $$('.sl-f', form).forEach(clearErr); formErr.hidden = true;
    }
    function enterEdit(l){
      editing = l.id; fillForm(l);
      lbl.textContent = 'Save changes'; cancel.hidden = false; chip.textContent = 'Editing listing';
      renderMine();
      form.scrollIntoView({ block:'start', behavior:O.reduce ? 'auto' : 'smooth' });
    }
    function exitEdit(){
      var was = editing; editing = null;
      form.reset(); syncOpts(); photos = []; drawThumbs(); photoError(''); count.textContent = '0 / 400';
      lbl.textContent = 'Publish product'; cancel.hidden = true; chip.textContent = 'New listing';
      if (was) renderMine();
    }
    cancel.addEventListener('click', exitEdit);

    /* ---------- submit ---------- */
    form.addEventListener('submit', function(e){
      e.preventDefault(); if (busy) return;
      $$('.sl-f', form).forEach(clearErr); formErr.hidden = true;
      var v = read(), bad = validate(v);
      if (bad.length){
        form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
        var first = bad[0] === 'photos' ? $('#slPick') : $('[name="' + bad[0] + '"]', form);
        if (first){ first.focus({ preventScroll:true }); first.scrollIntoView({ block:'center', behavior:O.reduce ? 'auto' : 'smooth' }); }
        return;
      }
      var item, wasEdit = !!editing;
      if (wasEdit){
        var old = store.all().filter(function(x){ return x.id === editing; })[0];
        if (!old){ exitEdit(); return; }
        item = Object.assign({}, old, v, { photos: photos.slice(), updated: Date.now() });
      } else {
        item = Object.assign({ id: 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), owner: session().email, photos: photos.slice(), created: Date.now() }, v);
      }
      var btn = $('.sl-submit', form); btn.classList.add('is-busy');
      var saved = wasEdit ? store.update(item) : store.add(item); btn.classList.remove('is-busy');
      if (!saved){ formErr.textContent = 'Your browser has no room left to save this. Remove an older listing or use fewer photos.'; formErr.hidden = false; return; }
      exitEdit();
      renderMine(); toast(wasEdit ? 'Changes saved. The market shows them now.' : 'Product published. Buyers can see it in the market.');
      $('#slMine').scrollIntoView({ block:'start', behavior:O.reduce ? 'auto' : 'smooth' });
    });

    /* ---------- your listings ---------- */
    function renderMine(){
      var list = store.mine().slice().reverse(), ul = $('#slList');
      $('#slMineN').textContent = list.length; $('#slEmpty').hidden = list.length > 0; ul.textContent = '';
      list.forEach(function(l){
        var li = el('li', 'sl-item'), im = el('img'); im.src = l.photos[0]; im.alt = '';
        var info = el('div', 'sl-info'), pr = el('p', 'sl-price', fmt(l.price) + ' '); pr.appendChild(el('span', null, l.unit));
        var day = new Date(l.created).toLocaleDateString('en-NG', { day:'numeric', month:'short' });
        info.appendChild(el('h3', null, l.name)); info.appendChild(pr);
        info.appendChild(el('p', 'sl-meta', l.qty + ' available \u00B7 ' + l.cat + ' \u00B7 ' + l.state));
        info.appendChild(el('p', 'sl-meta', 'Published ' + day));
        var view = el('a', 'sl-view'); view.href = 'home.html?view=' + encodeURIComponent(l.id) + '#market';
        view.appendChild(el('span', null, 'View product')); view.appendChild(icon('arrow'));
        view.addEventListener('click', function(e){ if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); O.go(view.getAttribute('href')); });
        info.appendChild(view);
        var del = el('button', 'sl-del'); del.type = 'button'; del.appendChild(icon('trash')); var lb = el('span', null, 'Remove'); del.appendChild(lb);
        var pen = el('button', 'sl-edit'); pen.type = 'button'; pen.appendChild(icon('pen')); pen.appendChild(el('span', null, 'Edit'));
        pen.addEventListener('click', function(){ enterEdit(l); });
        if (editing === l.id) li.classList.add('is-editing');
        var t;
        del.addEventListener('click', function(){
          if (del.classList.contains('is-sure')){ if (editing === l.id) exitEdit(); store.remove(l.id); renderMine(); toast('Listing removed'); return; }
          del.classList.add('is-sure'); lb.textContent = 'Tap again to remove';
          clearTimeout(t); t = setTimeout(function(){ del.classList.remove('is-sure'); lb.textContent = 'Remove'; }, 3000);
        });
        var acts = el('div', 'sl-acts'); acts.appendChild(del); acts.appendChild(pen);
        li.appendChild(im); li.appendChild(info); li.appendChild(acts); ul.appendChild(li);
      });
    }
    renderMine();

    /* "Edit" in the account menu: ?edit=<id> on arrival, or an event when this page is already open */
    function editById(id){ var l = store.mine().filter(function(x){ return x.id === id; })[0]; if (l) enterEdit(l); }
    document.addEventListener('ohgrow:edit-listing', function(e){ editById(e.detail && e.detail.id); });
    document.addEventListener('ohgrow:listings-changed', function(){ if (editing && !store.all().some(function(x){ return x.id === editing; })) exitEdit(); renderMine(); });
    try{
      var eid = new URLSearchParams(window.location.search).get('edit');
      if (eid){ history.replaceState(null, '', window.location.pathname); setTimeout(function(){ editById(eid); }, 150); }
    }catch(_){}
  });
})();
