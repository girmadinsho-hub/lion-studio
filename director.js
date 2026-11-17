/* ==========================================
   LION STUDIO — director.js (Block 18)
   THE KLING DIRECTOR — free-forever console
   for the $0 AI video factory:
   Copilot/Dreamina (image) -> Kling 66/day
   (motion) -> CapCut (join + polish).
   100% offline. No login. No dollars.
   ========================================== */
(function(){

  // ---------- door 1: inject nav button + tab ----------
  var nav  = document.querySelector('nav');
  var main = document.querySelector('main');
  if (!nav || !main || document.getElementById('tab-director')) return;

  var navBtn = document.createElement('button');
  navBtn.id  = 'nav-director';
  navBtn.innerHTML = '<span class="ic">🎞️</span>Director';
navBtn.onclick = function(){ window.lionGo('director'); };
nav.appendChild(navBtn);

  var sec = document.createElement('section');
  sec.id = 'tab-director';
  sec.style.display = 'none';
  main.appendChild(sec);

  var css = document.createElement('style');
  css.textContent = [
    '.dshot{background:#0e0e10;border:1px solid #2a2a30;border-radius:12px;padding:12px;margin-bottom:12px;}',
    '.dshot.done{border-color:#4ade80;opacity:.65;}',
    '.dshot .num{font-size:11px;color:#f2b705;letter-spacing:2px;margin-bottom:6px;}',
    '.dshot .scene{font-size:13px;color:#f5f0e6;margin-bottom:8px;line-height:1.5;}',
    '.dshot .lab{font-size:10px;color:#6f6a5e;letter-spacing:1px;margin:8px 0 4px;text-transform:uppercase;}',
    '.dshot .pbox{background:#17171b;border:1px solid #232328;border-radius:8px;padding:8px;font-size:11px;color:#cfc7b8;line-height:1.5;word-break:break-word;}',
    '.dshot .row{display:flex;gap:8px;margin-top:8px;}',
    '.cbtn{flex:1;background:none;border:1px solid #f2b705;color:#f2b705;border-radius:8px;padding:8px 4px;font-size:11px;font-weight:700;font-family:inherit;}',
    '.okbtn{flex:0 0 84px;background:none;border:1px solid #2a2a30;color:#6f6a5e;border-radius:8px;padding:8px 4px;font-size:11px;font-weight:700;font-family:inherit;}',
    '.dshot.done .okbtn{border-color:#4ade80;color:#4ade80;}',
    '.dsum{background:#0e0e10;border:1px solid #232328;border-radius:12px;padding:12px;}',
    '.dsum .line{display:flex;justify-content:space-between;font-size:12px;color:#cfc7b8;padding:3px 0;}',
    '.dsum .line b{color:#f5f0e6;}',
    '.dverdict{margin-top:8px;font-size:12px;font-weight:700;text-align:center;padding:8px;border-radius:8px;}',
    '.dverdict.good{color:#4ade80;background:rgba(74,222,128,.08);}',
    '.dverdict.warn{color:#f2b705;background:rgba(242,183,5,.08);}'
  ].join('');
  document.head.appendChild(css);

  // ---------- door 2: teach lionGo the new tab ----------
  var oldGo = window.lionGo;
  window.lionGo = function(name){
    sec.style.display = (name === 'director') ? 'block' : 'none';
    navBtn.classList.toggle('active', name === 'director');
    if (name === 'director') {
      ['home','studio','vault'].forEach(function(t){
        var el = document.getElementById('tab-' + t);
        if (el) el.style.display = 'none';
        var b = document.getElementById('nav-' + t);
        if (b) b.classList.remove('active');
      });
      return;
    }
    if (oldGo) oldGo(name);
  };

  // ---------- state (survives refresh, lives in the phone) ----------
  var LS_CHAR  = 'lion_director_char';
  var LS_SHOTS = 'lion_director_shots';
  var LS_COST  = 'lion_director_cost';

  var DEFAULT_CHAR = 'Cute chibi 3D cartoon girl, big brown eyes, two braided pigtails with yellow ribbons, pink school dress, white shoes, Pixar style, soft warm lighting, highly detailed';

  var CAMS = [
    'camera holds steady with subtle handheld feel',
    'slow smooth camera push-in',
    'camera follows smoothly from behind',
    'camera slowly pulls back revealing the scene',
    'gentle camera pan from left to right'
  ];

  var MODELS = [
    { id:'k16', name:'Kling 1.6 Standard', cost:20 },
    { id:'k25', name:'Kling 2.5 Turbo',    cost:25 },
    { id:'k30', name:'Kling 3.0',          cost:45 }
  ];

  var EXAMPLE_SHOP = [
    'She runs toward the camera holding a glowing smartphone, stops and points at the viewer with excited face',
    'The smartphone stands on a clean display, screen glowing softly, light reflections sweep across the glass',
    'Earphones and accessories slowly rotate on a display stand, gentle studio light sweep, dark premium background',
    'She stands behind a shop counter and slides a phone box toward the camera with a big smile',
    'She waves goodbye in front of the shop door while the camera slowly pulls back in sunset light'
  ];

  var EXAMPLE_STORY = [
    'She walks home from school alone in the warm evening light',
    'A dark shadow appears behind her and starts following',
    'She notices the shadow, turns and prays quietly with closed eyes',
    'Bright golden light surrounds her and the shadow melts away',
    'She smiles and runs safely home as the sun sets'
  ];

  function load(k, fb){ try { var v = localStorage.getItem(k); return (v === null) ? fb : v; } catch(e){ return fb; } }
  function save(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  var charBlock = load(LS_CHAR, DEFAULT_CHAR);
  var shots = [];
  try { shots = JSON.parse(load(LS_SHOTS, '[]')) || []; } catch(e){ shots = []; }
  var modelId = load(LS_COST, 'k16');

  function persist(){ save(LS_SHOTS, JSON.stringify(shots)); }
  function currentModel(){
    var m = MODELS[0];
    for (var i = 0; i < MODELS.length; i++) if (MODELS[i].id === modelId) m = MODELS[i];
    return m;
  }
  function imgPrompt(i){ return charBlock.trim() + ', ' + shots[i].scene; }
  function motPrompt(i){ return shots[i].scene + ', ' + CAMS[i % CAMS.length] + ', cinematic lighting, smooth natural motion, 5 seconds'; }

  // ---------- build the UI ----------
  sec.innerHTML = ''
    + '<div class="card">'
    +   '<h2>🎞️ Kling Director</h2>'
    +   '<p>Your free-forever video factory console: story in, prompts out, credits counted.<br>'
    +   'Chain: <b>Copilot / Dreamina</b> (image) → <b>Kling</b> (motion, 66 free credits every day) → <b>CapCut</b> (join + music). No dollars, ever.</p>'
    + '</div>'
    + '<div class="card">'
    +   '<h2>1 · Your character</h2>'
    +   '<textarea id="d-char"></textarea>'
    +   '<div class="hint">Same block every time = same character in every scene. For product shots, replace it with a product description.</div>'
    +   '<button class="btn ghost" id="d-char-save">Save character</button>'
    + '</div>'
    + '<div class="card">'
    +   '<h2>2 · Your story</h2>'
    +   '<div class="hint">One line = one shot (5 seconds each).</div>'
    +   '<textarea id="d-story" placeholder="She walks home from school alone&#10;A dark shadow starts following her&#10;..."></textarea>'
    +   '<button class="btn" id="d-build">🎬 Break into shots</button>'
    +   '<div class="xbtns">'
    +     '<button class="xbtn" id="d-ex-shop">Shop-ad example</button>'
    +     '<button class="xbtn" id="d-ex-story">Story example</button>'
    +   '</div>'
    + '</div>'
    + '<div class="card">'
    +   '<h2>3 · Credit planner</h2>'
    +   '<div class="chips" id="d-models"></div>'
    +   '<div id="d-planner"></div>'
    +   '<div class="hint">Estimates only — always check the real price on Kling\'s screen before you press Generate. Free credits reset at midnight.</div>'
    + '</div>'
    + '<div id="d-shots-wrap"></div>'
    + '<button class="morebtn" id="d-reset">🗑 Reset director (clears saved shots)</button>'
    + '<div style="height:20px"></div>';

  // ---------- render ----------
  function line(k, v){ return '<div class="line"><span>' + k + '</span><b>' + v + '</b></div>'; }

  function plannerHTML(){
    var m = currentModel();
    var pend = 0, doneN = 0;
    shots.forEach(function(s){ if (s.done) doneN++; else pend++; });
    var need = pend * m.cost;
    var fits = Math.floor(66 / m.cost);
    var html = '<div class="dsum">'
      + line('Model', m.name)
      + line('Cost per 5s clip', m.cost + ' credits')
      + line('Free clips per day (66)', fits + (fits === 1 ? ' clip' : ' clips'))
      + line('Shots total / done', shots.length + ' / ' + doneN)
      + line('Pending', pend + (pend === 1 ? ' shot' : ' shots') + ' = ' + need + ' credits');
    if (shots.length === 0) {
      html += '<div class="dverdict warn">Write your story lines above, then press Break into shots.</div>';
    } else if (pend === 0) {
      html += '<div class="dverdict good">🎉 ALL SHOTS DONE — join them in CapCut and export.</div>';
    } else if (need <= 66) {
      html += '<div class="dverdict good">✅ All ' + pend + ' shots fit in one free day (' + need + ' of 66 credits).</div>';
    } else {
      var days = Math.ceil(need / 66);
      html += '<div class="dverdict warn">⚠️ ' + pend + ' shots = ' + need + ' credits = ' + days + ' free days. Do ' + fits + ' today, the rest tomorrow.</div>';
    }
    return html + '</div>';
  }

  function shotsHTML(){
    if (!shots.length) return '';
    var out = '';
    shots.forEach(function(s, i){
      out += '<div class="dshot' + (s.done ? ' done' : '') + '">'
        + '<div class="num">SHOT ' + (i + 1) + (s.done ? ' · DONE ✅' : ' · PENDING') + '</div>'
        + '<div class="scene">' + esc(s.scene) + '</div>'
        + '<div class="lab">🖼 Image prompt → Copilot / Dreamina</div>'
        + '<div class="pbox">' + esc(imgPrompt(i)) + '</div>'
        + '<div class="lab">🎞 Motion prompt → Kling (Standard, 5s)</div>'
        + '<div class="pbox">' + esc(motPrompt(i)) + '</div>'
        + '<div class="row">'
        +   '<button class="cbtn" data-copy="' + i + '">COPY IMAGE</button>'
        +   '<button class="cbtn" data-copym="' + i + '">COPY MOTION</button>'
        +   '<button class="okbtn" data-done="' + i + '">' + (s.done ? 'DONE ✅' : 'MARK DONE') + '</button>'
        + '</div></div>';
    });
    return out;
  }

  function renderModels(){
    document.getElementById('d-models').innerHTML = MODELS.map(function(m){
      return '<button class="pchip' + (m.id === modelId ? ' sel' : '') + '" data-model="' + m.id + '">'
        + m.name + ' · ' + m.cost + 'c</button>';
    }).join('');
  }

  function render(){
    document.getElementById('d-planner').innerHTML = plannerHTML();
    document.getElementById('d-shots-wrap').innerHTML = shotsHTML();
  }

  // ---------- actions ----------
  function build(){
    var raw = document.getElementById('d-story').value;
    var lines = raw.split(/\n+/).map(function(l){ return l.trim(); })
      .filter(function(l){ return l.length > 0; });
    if (!lines.length) { alert('Write one story line per shot first.'); return; }
    shots = lines.map(function(l){ return { scene: l, done: false }; });
    persist(); render();
  }

  function copyPrompt(text, btn){
    function ok(){ var o = btn.textContent; btn.textContent = 'COPIED ✅'; setTimeout(function(){ btn.textContent = o; }, 1200); }
    function fallback(){
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); }
      catch(e){ alert('Copy failed — long-press the prompt text and copy manually.'); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok).catch(fallback);
    } else { fallback(); }
  }

  document.getElementById('d-char').value = charBlock;
  document.getElementById('d-char-save').onclick = function(){
    charBlock = document.getElementById('d-char').value.trim() || DEFAULT_CHAR;
    save(LS_CHAR, charBlock);
    var b = this; b.textContent = 'SAVED ✅';
    setTimeout(function(){ b.textContent = 'Save character'; }, 1200);
    render();
  };

  document.getElementById('d-build').onclick = build;

  document.getElementById('d-ex-shop').onclick = function(){
    document.getElementById('d-story').value = EXAMPLE_SHOP.join('\n');
    build();
  };
  document.getElementById('d-ex-story').onclick = function(){
    document.getElementById('d-story').value = EXAMPLE_STORY.join('\n');
    build();
  };

  document.getElementById('d-models').addEventListener('click', function(e){
    var id = e.target.getAttribute && e.target.getAttribute('data-model');
    if (!id) return;
    modelId = id; save(LS_COST, modelId);
    renderModels(); render();
  });

  document.getElementById('d-shots-wrap').addEventListener('click', function(e){
    var t = e.target;
    var c = t.getAttribute && t.getAttribute('data-copy');
    var m = t.getAttribute && t.getAttribute('data-copym');
    var k = t.getAttribute && t.getAttribute('data-done');
    if (c !== null && c !== false) { copyPrompt(imgPrompt(+c), t); }
    else if (m !== null && m !== false) { copyPrompt(motPrompt(+m), t); }
    else if (k !== null && k !== false) {
      var i = +k; shots[i].done = !shots[i].done; persist(); render();
    }
  });

  document.getElementById('d-reset').onclick = function(){
    if (!shots.length || confirm('Clear all saved shots?')) {
      shots = []; persist(); render();
    }
  };

  renderModels();
  render();

})();
