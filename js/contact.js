/* Contact form: validates, then hands the message to deliver(). deliver() keeps it in this browser for now;
   swap its body for a fetch() to your email/CRM endpoint when there is a server. */
(function(){
  var O = window.Ohgrow;
  O.ready.then(function(){
    var form = document.getElementById('ctForm'); if (!form) return;
    var done = document.getElementById('ctDone'), again = document.getElementById('ctAgain'), note = document.getElementById('ctNote'), count = document.getElementById('ctCount');
    var KEY = 'ohgrow.messages';

    function deliver(msg){
      return new Promise(function(res, rej){
        try{
          var all = JSON.parse(localStorage.getItem(KEY) || '[]'); if (!Array.isArray(all)) all = [];
          all.push(msg); localStorage.setItem(KEY, JSON.stringify(all)); res();
        }catch(e){ rej(e); }
      });
    }
    function box(name){ return form.elements[name].closest('.ct-f'); }
    function setErr(name, text){
      var b = box(name), s = b.querySelector('.ct-err'); b.classList.add('has-err'); s.textContent = text; s.hidden = false;
    }
    function clearErr(b){ b.classList.remove('has-err'); var s = b.querySelector('.ct-err'); if (s){ s.hidden = true; s.textContent = ''; } }
    Array.prototype.forEach.call(form.querySelectorAll('.ct-f'), function(b){
      b.addEventListener('input', function(){ clearErr(b); note.textContent = ''; });
      b.addEventListener('change', function(){ clearErr(b); note.textContent = ''; });
    });
    form.elements.msg.addEventListener('input', function(){ count.textContent = form.elements.msg.value.length + ' / 600'; });

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var f = form.elements, v = { name:f.name.value.trim(), reach:f.reach.value.trim(), role:f.role.value, msg:f.msg.value.trim() }, bad = null;
      Array.prototype.forEach.call(form.querySelectorAll('.ct-f'), clearErr);
      function no(n, t){ setErr(n, t); if (!bad) bad = n; }
      if (v.name.length < 2) no('name', 'Please tell us your name.');
      var mail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.reach), tel = v.reach.replace(/\D/g, '').length >= 7 && /^[+\d\s()-]+$/.test(v.reach);
      if (!v.reach) no('reach', 'Add an email or phone number.');
      else if (!mail && !tel) no('reach', 'Enter a valid email or phone number.');
      if (!v.role) no('role', 'Choose one.');
      if (v.msg.length < 10) no('msg', 'Write a little more so we can help (10 characters or more).');
      if (bad){ note.textContent = 'Please fix the highlighted fields.'; var el = f[bad]; if (el && el.focus && el.type !== 'hidden' && el.offsetParent) el.focus({ preventScroll:false }); else box(bad).scrollIntoView({ block:'center' }); return; }
      var btn = form.querySelector('.ct-send'); btn.classList.add('is-busy'); note.textContent = '';
      deliver({ name:v.name, reach:v.reach, role:v.role, msg:v.msg, at:Date.now() }).then(function(){
        btn.classList.remove('is-busy'); form.reset(); count.textContent = '0 / 600';
        Array.prototype.forEach.call(form.querySelectorAll('select'), function(s){ s.dispatchEvent(new Event('dd-sync')); });
        form.hidden = true; done.hidden = false; done.scrollIntoView({ block:'nearest', behavior:O.reduce ? 'auto' : 'smooth' });
      }, function(){ btn.classList.remove('is-busy'); note.textContent = 'Could not send. Please try again.'; });
    });
    again.addEventListener('click', function(){ done.hidden = true; form.hidden = false; form.elements.name.focus({ preventScroll:true }); });
  });
})();
