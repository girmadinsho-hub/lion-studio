/* ==========================================
   LION STUDIO — portfolio.js (Block 22)
   THE PORTFOLIO THEATER — your finished
   videos as a gallery. Paste a TikTok or
   direct video link, add a title, show it
   to clients. Share the best one as your
   live pitch. 100% offline.
   ========================================== */
(function(){

  // ---------- door 1: inject nav button + tab ----------
  var nav  = document.querySelector('nav');
  var main = document.querySelector('main');
  if (!nav || !main || document.getElementById('tab-portfolio')) return;

  var navBtn = document.createElement('button');
  navBtn.id  = 'nav-portfolio';
  navBtn.innerHTML = '<span class="ic">🏆</span>Work';
  navBtn.onclick = function(){ window.lionGo('portfolio'); };
  nav.appendChild(navBtn);

  var sec = document.createElement('section');
  sec.id = 'tab-portfolio';
  sec.style.display = 'none';
  main.appendChild(sec);

  var css = document.createElement('style');
  css.textContent = [
    '.pf-item{background:#0e0e10;border:1px solid #2a2a30;border-radius:12px;padding:12px;margin-bottom:10px;}',
    '.pf-item .t{font-size:14px;color:#f5f0e6;font-weight:700;margin-bottom:2px;}',
    '.pf-item .u{font-size:10px;color:#6f6a5e;word-break:break-all;margin-bottom:8px;}',
    '.pf-item .meta{font-size:11px;color:#cfc7b8;margin-bottom:8px;}',
    '.pf-row{display:flex;gap:8px;}',
    '.pf-open{flex:1;background:none;border:1px solid #f2b705;color:#f2b705;border-radius:8px;padding:8px 4px;font-size:11px;font-weight:700;font-family:inherit;}',
    '.pf-share{flex:1;background:none;border:1px solid #38bdf8;color:#38bdf8;border-radius:8px;padding:8px 4px;font-size:11px;font-weight:700;font-family:inherit;}',
    '.pf-del{flex:0 0 44px;background:none;border:1px solid #f87171;color:#f87171;border-radius:8px;padding:8px 4px;font-size:12px;font-weight:700;font-family:inherit;}',
    '.pf-hero{background:#0e0e10;border:1px solid #f2b705;border-radius:12px;padding:12px;margin-bottom:14px;}',
    '.pf-hero .k{font-size:10px;letter-spacing:2px;color:#f2b705;text-transform:uppercase;margin-bottom:6px;}',
    '.pf-hero .v{font-size:13px;color:#f5f0e6;line-height:1.5;word-break:break-word;}',
    '.pf-copy{margin-top:8px;width:100%;background:none;border:1px dashed #f2b705;color:#f2b705;border-radius:8px;padding:8px;font-size:11px;font-weight:700;font-family:inherit;}'
  ].join('');
  document.head.appendChild(css);

  // ---------- door 2: teach lionGo the new tab ----------
  var oldGo = window.lionGo;
  window.lionGo = function(name){
    sec.style.display = (name === 'portfolio') ? 'block' : 'none';
    navBtn.classList.toggle('active', name === 'portfolio');
    if (name === 'portfolio') {
      ['home','studio','vault','director','clients'].forEach(function(t){
        var el = document.getElementById('tab-' + t);
        if (el) el.style.display = 'none';
        var b = document.getElementById('nav-' + t);
        if (b) b.classList.remove('active');
      });
      return;
    }
    if (oldGo) oldGo(name);
  };

  // ---------- state ----------
  var LS_PF = 'lion_portfolio';
  var items = [];
  try {
    var raw = null;
    try { raw = localStorage.getItem(LS_PF); } catch(e){ raw = null; }
    items = JSON.parse(raw || '[]') || [];
  } catch(e){ items = []; }
  function persist(){
    try { localStorage.setItem(LS_PF, JSON.stringify(items)); } catch(e){}
  }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

  // ---------- build the UI ----------
  sec.innerHTML = ''
    + '<div class="card">'
    +   '<h2>🏆 Portfolio theater</h2>'
    +   '<p>Every finished video becomes your sales weapon. Add your best work here, then show this screen — or share the link — to win the next client.</p>'
    + '</div>'
    + '<div class="card">'
    +   '<h2>Add work</h2>'
    +   '<input id="p-title" placeholder="title (e.g. Smart Shop — phone promo)">'
    +   '<input id="p-url" placeholder="video link (TikTok / Telegram / direct MP4)" inputmode="url">'
    +   '<input id="p-for" placeholder="made for (e.g. @smartshopaddis)">'
    +   '<button class="btn" id="p-add">➕ Add to portfolio</button>'
    +   '<div id="p-msg" class="gm"></div>'
    + '</div>'
    + '<div id="p-hero"></div>'
    + '<div class="card">'
    +   '<h2>Your work</h2>'
    +   '<div id="p-list"></div>'
    + '</div>'
    + '<div style="height:20px"></div>';

  // ---------- render ----------
  function heroHTML(){
    if (!items.length) return '';
    var best = items[0];
    return '<div class="pf-hero">'
      + '<div class="k">⭐ Show this to your next client</div>'
      + '<div class="v"><b>' + esc(best.title) + '</b><br>' + esc(best.url) + '</div>'
      + '<button class="pf-copy" id="p-hero-copy">📋 Copy showreel pitch</button>'
      + '</div>';
  }

  function listHTML(){
    if (!items.length) return '<div class="hint" style="text-align:center;padding:10px 0">No work yet — add your first finished video above.</div>';
    var out = '';
    items.forEach(function(it){
      out += '<div class="pf-item">'
        + '<div class="t">' + esc(it.title) + '</div>'
        + (it.for ? '<div class="meta">made for ' + esc(it.for) + '</div>' : '')
        + '<div class="u">' + esc(it.url) + '</div>'
        + '<div class="pf-row">'
        +   '<button class="pf-open" data-open="' + it.id + '">▶ Open</button>'
        +   '<button class="pf-share" data-share="' + it.id + '">↗ Share</button>'
        +   '<button class="pf-del" data-del="' + it.id + '">✕</button>'
        + '</div></div>';
    });
    return out;
  }

  function render(){
    document.getElementById('p-hero').innerHTML = heroHTML();
    document.getElementById('p-list').innerHTML = listHTML();
    var hc = document.getElementById('p-hero-copy');
    if (hc) {
      hc.onclick = function(){
        var best = items[0];
        var pitch = '🎬 My video work — ' + best.title + '\nWatch: ' + best.url
          + '\nWant one for your shop? Order fast.';
        copyText(pitch, hc);
      };
    }
  }

  // ---------- helpers ----------
  function copyText(text, btn){
    function ok(){ var o = btn.textContent; btn.textContent = 'COPIED ✅'; setTimeout(function(){ btn.textContent = o; }, 1200); }
    function fallback(){
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); }
      catch(e){ alert('Copy failed — long-press the text and copy manually.'); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok).catch(fallback);
    } else { fallback(); }
  }

  function isUrl(s){
    return /^https?:\/\/.+\..+/i.test(String(s).trim());
  }

  // ---------- actions ----------
  document.getElementById('p-add').onclick = function(){
    var title = document.getElementById('p-title').value.trim();
    var url   = document.getElementById('p-url').value.trim();
    var made  = document.getElementById('p-for').value.trim();
    var msg   = document.getElementById('p-msg');
    if (!title || !url) {
      msg.textContent = 'Title and video link are needed.';
      msg.style.color = '#f87171';
      return;
    }
    if (!isUrl(url)) {
      msg.textContent = 'That link does not look right — must start with http';
      msg.style.color = '#f87171';
      return;
    }
    items.unshift({ id: uid(), title: title, url: url, for: made });
    persist(); render();
    document.getElementById('p-title').value = '';
    document.getElementById('p-url').value = '';
    document.getElementById('p-for').value = '';
    msg.textContent = 'Added to your portfolio ✅';
    msg.style.color = '#4ade80';
  };

  document.getElementById('p-list').addEventListener('click', function(e){
    var t = e.target;
    var op = t.getAttribute && t.getAttribute('data-open');
    var sh = t.getAttribute && t.getAttribute('data-share');
    var de = t.getAttribute && t.getAttribute('data-del');
    if (op) {
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === op) { window.open(items[i].url, '_blank'); break; }
      }
    } else if (sh) {
      for (var j = 0; j < items.length; j++) {
        if (items[j].id === sh) {
          var it = items[j];
          var text = '🎬 ' + it.title + '\nWatch: ' + it.url + '\nWant one for your shop? Order fast.';
          if (navigator.share) {
            navigator.share({ title: it.title, text: text, url: it.url }).catch(function(){});
          } else {
            copyText(text, t);
          }
          break;
        }
      }
    } else if (de) {
      for (var k = 0; k < items.length; k++) {
        if (items[k].id === de) { items.splice(k, 1); break; }
      }
      persist(); render();
    }
  });

  render();

})();
