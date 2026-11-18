/* Sell page. Only the shell for now: the selling and upload system comes later. */
(function(){
  var O = window.Ohgrow, SKEY = 'ohgrow.session';
  function signedIn(){ try{ var u = JSON.parse(localStorage.getItem(SKEY)); return !!(u && u.email); }catch(_){ return false; } }

  /* only signed-in sellers belong here. Anyone else goes back to the home page. */
  if (!signedIn()){ window.location.replace('home.html'); return; }

  /* signing out in another tab sends this page home too */
  window.addEventListener('storage', function(e){
    if ((e.key === SKEY || e.key === null) && !signedIn()) O.go('home.html');
  });

  O.ready.then(function(){
    /* the shared header, side bar and menu use in-page links (#market, #guide) that only exist on the home page */
    O.$$('a[href^="#"]').forEach(function(a){ a.setAttribute('href', 'home.html' + a.getAttribute('href')); });
  });
})();
