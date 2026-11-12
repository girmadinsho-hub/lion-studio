/* ==========================================
   LION STUDIO — studio.js (Export Room)
   Block 10: the phone films your ad into a
   real video file. Free. No AI. No key.
   ========================================== */
(function(){
  var client = window.lionClient;
  var body = document.getElementById('studio-body');
  if (!client || !body) return;

  var PRESETS = {
    hot:    { emoji:'🔥', label:'Hot Deal',
              scenes:['🔥 {P} — price drop!','📸 {P}, up close and shining.','🛒 Order today — before it is gone!'] },
    fresh:  { emoji:'✨', label:'New Arrival',
              scenes:['✨ Something new just landed…','📸 Meet {P}.','🛒 Be the first — order now!'] },
    bundle: { emoji:'🎁', label:'Bundle Offer',
              scenes:['🎁 Buy more, save more!','📸 {P} — the full bundle.','🛒 Best value — grab it now!'] },
    love:   { emoji:'💬', label:'Customer Love',
              scenes:['💬 "I love this!" — a happy buyer','📸 {P}, the crowd favourite.','🛒 Join them — order yours!'] }
  };
  var pick = 'hot';
  var photoData = null;
  var jobsById = {};
  var shop = { name: '', contact: '' };
  var pendingShare = {};
  var recording = false;

  function esc(s){
    return String(s || '').replace(/[&<>"']/g, function(c){
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  function when(iso){
    var t = new Date(iso);
    return isNaN(t.getTime()) ? '' : t.toISOString().slice(0,16).replace('T',' ');
  }

  async function me(){
    var s = await client.auth.getSession();
    return (s.data && s.data.session) ? s.data.session.user : null;
  }

  function renderOut(){
    body.innerHTML =
      '<div class="card locked">' +
        '<div class="big">🔒</div>' +
        '<h2>Studio is for creators</h2>' +
        '<p>Sign in on the <b>Home</b> tab to claim your seat.<br>Mock renders are <b>free</b> during beta.</p>' +
      '</div>';
  }

  function renderIn(){
    var chips = Object.keys(PRESETS).map(function(k){
      return '<button class="pchip' + (k === pick ? ' sel' : '') +
             '" data-k="' + k + '">' + PRESETS[k].emoji + ' ' + PRESETS[k].label + '</button>';
    }).join('');

    body.innerHTML =
      '<div class="card">' +
        '<h2>🏪 My shop</h2>' +
        '<input id="sh-name" maxlength="40" placeholder="shop name — e.g. Madinsho Fashion" value="' + esc(shop.name) + '">' +
        '<input id="sh-contact" maxlength="60" placeholder="how buyers reach you — e.g. Telegram: @yourname" value="' + esc(shop.contact) + '">' +
        '<button class="btn ghost" id="sh-save">💾 Save shop line</button>' +
        '<div class="gm" id="sh-msg"></div>' +
        '<p style="font-size:11px;color:#6f6a5e">This text is baked into the end-card of every video you export.</p>' +
      '</div>' +
      '<div class="card">' +
        '<h2>🎬 New video ad</h2>' +
        '<div class="chips" id="st-chips">' + chips + '</div>' +
        '<input id="st-name" maxlength="60" placeholder="product name — e.g. leather handbag">' +
        '<textarea id="st-desc" maxlength="200" placeholder="one or two lines about it (optional)"></textarea>' +
        '<input type="file" id="st-photo" accept="image/*" style="display:none">' +
        '<button class="btn ghost" id="st-photo-btn">📸 Add product photo (camera or gallery)</button>' +
        '<div id="st-thumb" style="display:none">' +
          '<img id="st-thumb-img" alt="product">' +
          '<button class="linkbtn" id="st-photo-rm">✕ remove photo</button>' +
        '</div>' +
        '<button class="btn" id="st-go">✨ Generate — FREE (mock)</button>' +
        '<div id="st-msg"></div>' +
        '<p style="font-size:11px;color:#6f6a5e">Mock mode: fake brain, real flow. Costs 0 credits.<br>Tip: while exporting a video, keep the app on screen — it films live.</p>' +
      '</div>' +
      '<div class="card">' +
        '<h2>🎞️ Recent renders</h2>' +
        '<div id="st-jobs"><p>Loading…</p></div>' +
      '</div>';

    document.getElementById('st-chips').addEventListener('click', function(e){
      var b = e.target.closest ? e.target.closest('.pchip') : null;
      if (!b) return;
      pick = b.getAttribute('data-k');
      var all = document.querySelectorAll('#st-chips .pchip');
      for (var i = 0; i < all.length; i++) all[i].classList.remove('sel');
      b.classList.add('sel');
    });

    var fin = document.getElementById('st-photo');
    document.getElementById('st-photo-btn').addEventListener('click', function(){ fin.click(); });
    fin.addEventListener('change', handlePhoto);
    document.getElementById('st-photo-rm').addEventListener('click', function(){
      photoData = null; fin.value = '';
      document.getElementById('st-thumb').style.display = 'none';
    });

    document.getElementById('st-go').addEventListener('click', generate);
    document.getElementById('sh-save').addEventListener('click', saveShop);
    loadJobs();
  }

  async function saveShop(){
    var msg = document.getElementById('sh-msg');
    var u = await me();
    if (!u) { msg.textContent = '❌ sign in first'; msg.style.color = '#f87171'; return; }
    var name = document.getElementById('sh-name').value.trim();
    var contact = document.getElementById('sh-contact').value.trim();
    var r = await client.from('creators')
      .update({ shop_name: name, contact_line: contact })
      .eq('id', u.id);
    if (r.error) { msg.textContent = '❌ ' + r.error.message; msg.style.color = '#f87171'; return; }
    shop.name = name; shop.contact = contact;
    msg.textContent = '✅ Saved — your end-card now carries your shop line';
    msg.style.color = '#4ade80';
  }

  function handlePhoto(e){
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var msg = document.getElementById('st-msg');
    msg.textContent = '📦 Packing your photo…';
    var rd = new FileReader();
    rd.onload = function(){
      var img = new Image();
      img.onload = function(){
        try {
          var maxSide = 640;
          var sc = Math.min(1, maxSide / Math.max(img.width, img.height));
          var cv = document.createElement('canvas');
          cv.width  = Math.max(1, Math.round(img.width  * sc));
          cv.height = Math.max(1, Math.round(img.height * sc));
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          photoData = cv.toDataURL('image/jpeg', 0.62);
          document.getElementById('st-thumb-img').src = photoData;
          document.getElementById('st-thumb').style.display = 'block';
          msg.textContent = '';
        } catch(err){
          msg.textContent = '❌ That photo refused to load — try another one.';
        }
      };
      img.onerror = function(){ msg.textContent = '❌ That photo refused to load — try another one.'; };
      img.src = rd.result;
    };
    rd.readAsDataURL(f);
  }

  async function refresh(){
    var u = await me();
    if (!u) { renderOut(); return; }
    var pro = await client.from('creators')
      .select('shop_name, contact_line').eq('id', u.id).maybeSingle();
    if (pro.data) {
      shop.name = pro.data.shop_name || '';
      shop.contact = pro.data.contact_line || '';
    }
    renderIn();
  }

  async function generate(){
    var msg  = document.getElementById('st-msg');
    var go   = document.getElementById('st-go');
    var name = document.getElementById('st-name').value.trim();
    var desc = document.getElementById('st-desc').value.trim();
    if (!name) { msg.textContent = '❌ Give your product a name first.'; return; }

    go.disabled = true; go.textContent = '⏳ Working…';
    var u = await me();
    if (!u) {
      go.disabled = false; go.textContent = '✨ Generate — FREE (mock)';
      msg.textContent = '❌ Please sign in on the Home tab first.';
      return;
    }

    var prompt = desc ? (name + ' — ' + desc) : name;
    var row = {
      creator_id: u.id,
      kind: 'video',
      preset: pick,
      prompt: prompt,
      status: 'pending',
      provider: 'mock',
      credits_cost: 0,
      is_mock: true
    };
    if (photoData) row.photo_data = photoData;

    var r = await client.from('studio_jobs').insert(row).select('id').single();

    if (r.error) {
      go.disabled = false; go.textContent = '✨ Generate — FREE (mock)';
      msg.textContent = '❌ ' + r.error.message;
      return;
    }
    msg.textContent = '';

    await loadJobs();
    var jobId = r.data.id;
    var lines = ['Writing the script…','Casting the light…','Rendering scenes…'];
    var i = 0;
    var el = document.getElementById('jl-' + jobId);
    if (el) el.textContent = '🎬 ' + lines[0];
    var tick = setInterval(function(){
      i = (i + 1) % lines.length;
      var x = document.getElementById('jl-' + jobId);
      if (x) x.textContent = '🎬 ' + lines[i];
    }, 2200);

    setTimeout(async function(){
      clearInterval(tick);
      await client.from('studio_jobs')
        .update({ status: 'done', result_url: 'mock://preview' })
        .eq('id', jobId);
      go.disabled = false; go.textContent = '✨ Generate — FREE (mock)';
      loadJobs();
    }, 7000);
  }

  function say(text){
    if (!('speechSynthesis' in window)) return;
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.95;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  }

  function play(id){
    var th = document.getElementById('th-' + id);
    if (!th) return;
    var j = jobsById[id];
    if (!j) return;
    var p = PRESETS[j.preset] || PRESETS.hot;
    var prod = (j.prompt || '').split(' — ')[0] || 'your product';
    var scenes = p.scenes.map(function(t){ return t.replace('{P}', prod); });
    var btn = th.querySelector('.playbtn');

    if (window.speechSynthesis) window.speechSynthesis.cancel();
    th.classList.remove('playing');
    void th.offsetWidth;
    th.classList.add('playing');
    if (btn) btn.style.display = 'none';

    setTimeout(function(){ say(scenes[0]); }, 200);
    setTimeout(function(){ say(scenes[1]); }, 3600);
    setTimeout(function(){ say(scenes[2]); }, 7000);
    setTimeout(function(){
      th.classList.remove('playing');
      if (btn) { btn.style.display = ''; btn.textContent = '▶ Replay'; }
    }, 10500);
  }

  function cardHTML(j){
    var p = PRESETS[j.preset] || PRESETS.hot;
    var prod = (j.prompt || '').split(' — ')[0] || 'your product';
    var stamp = when(j.created_at);
    var scenes = p.scenes.map(function(t){ return t.replace('{P}', prod); });

    var head = '<div class="top"><b>' + p.emoji + ' ' + esc(prod) + '</b>' +
      '<span class="jstatus ' + (j.status === 'done' ? 'done">DONE ✅' : 'pend">RENDERING') + '</span></div>';

    var xbtns = '<div class="xbtns">' +
      '<button class="xbtn" data-act="save" data-id="' + j.id + '">⬇️ Save video</button>' +
      '<button class="xbtn" data-act="share" data-id="' + j.id + '">📤 Share</button>' +
    '</div>';

    if (j.status === 'done' && j.photo_data) {
      return '<div class="job">' + head +
        '<div class="theater" id="th-' + j.id + '">' +
          '<img src="' + j.photo_data + '" alt="">' +
          '<div class="vignette"></div>' +
          '<div class="tscene t1">' + esc(scenes[0]) + '</div>' +
          '<div class="tscene t2">' + esc(scenes[1]) + '</div>' +
          '<div class="tscene t3">' + esc(scenes[2]) + '</div>' +
          '<div class="tendcard">🦁 ' + esc(prod) + '<small>LION STUDIO</small></div>' +
          '<button class="playbtn" data-id="' + j.id + '">▶ Play</button>' +
          '<span class="mockbadge">MOCK</span>' +
        '</div>' +
        '<div class="jmeta">' + esc(p.label) + ' · ' + stamp + ' · cost 0 credits · 🔊 voice</div>' +
        xbtns +
      '</div>';
    }

    if (j.status === 'done') {
      return '<div class="job">' + head +
        '<div class="frame"><span class="mockbadge">MOCK</span>' +
          scenes.map(function(s){ return '<div class="scene">' + esc(s) + '</div>'; }).join('') +
        '</div>' +
        '<div class="jmeta">' + esc(p.label) + ' · ' + stamp + ' · cost 0 credits</div>' +
        xbtns +
      '</div>';
    }

    return '<div class="job">' + head +
      '<div class="jmeta" id="jl-' + j.id + '">🎬 Warming up…</div>' +
      '<div class="jmeta">' + esc(p.label) + ' · mock render in progress</div>' +
    '</div>';
  }

  /* ---------- The film camera ---------- */

  function pickMime(){
    var list = ['video/mp4;codecs=avc1.42E01E','video/mp4',
                'video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
    for (var i = 0; i < list.length; i++) {
      try { if (MediaRecorder.isTypeSupported(list[i])) return list[i]; } catch(e){}
    }
    return '';
  }

  function wrapTxt(ctx, text, maxW){
    var words = String(text).split(' ');
    var lines = [], cur = '';
    words.forEach(function(w){
      var test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function downloadBlob(blob, fname){
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 30000);
  }

  function setBtns(id, text, disabled){
    ['xs-', 'xh-'].forEach(function(p){
      var b = document.getElementById(p + id);
      if (b) { b.disabled = !!disabled; if (text) b.textContent = text; }
    });
  }

  async function makeVideo(id){
    if (recording) return;
    var j = jobsById[id];
    if (!j) return;
    var msg = document.getElementById('st-msg');

    if (!window.MediaRecorder || !pickMime()) {
      if (msg) msg.textContent = '❌ This phone cannot film videos — tell the Captain.';
      return;
    }

    var p = PRESETS[j.preset] || PRESETS.hot;
    var prod = (j.prompt || '').split(' — ')[0] || 'your product';
    var scenes = p.scenes.map(function(t){ return t.replace('{P}', prod); });

    var img = null;
    if (j.photo_data) {
      img = await new Promise(function(res){
        var i = new Image();
        i.onload = function(){ res(i); };
        i.onerror = function(){ res(null); };
        i.src = j.photo_data;
      });
    }

    var W = 720, H = 900;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');

    var stream = cv.captureStream(30);
    var mime = pickMime();
    var rec;
    try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4500000 }); }
    catch(e) { rec = new MediaRecorder(stream); }
    var chunks = [];
    rec.ondataavailable = function(e){ if (e.data && e.data.size) chunks.push(e.data); };
    var stopped = new Promise(function(res){ rec.onstop = res; });

    recording = true;
    setBtns(id, '🎥 0s / 10s', true);
    rec.start(250);

    var t0 = performance.now(), DUR = 10500;
    var wins = [[300,3300],[3400,6600],[6700,9900]];

    function ease(u){ return u < 0.5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2)/2; }

    function draw(t){
      if (img) {
        var u = ease(Math.min(1, t / DUR));
        var z = 1 + 0.14 * u;
        var s = Math.max(W / img.width, H / img.height) * z;
        var dw = img.width * s, dh = img.height * s;
        var dx = (W - dw)/2 - 0.02 * W * u;
        var dy = (H - dh)/2 - 0.02 * H * u;
        ctx.drawImage(img, dx, dy, dw, dh);
      } else {
        var g = ctx.createLinearGradient(0, H * (t/DUR), W, H * (1 - t/DUR));
        g.addColorStop(0, '#1b1400'); g.addColorStop(.5, '#3a2b00'); g.addColorStop(1, '#1b1400');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }

      var vg = ctx.createLinearGradient(0, 0, 0, H);
      vg.addColorStop(0, 'rgba(0,0,0,.35)');
      vg.addColorStop(.35, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,.65)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

      ctx.textAlign = 'center';
      for (var i = 0; i < 3; i++) {
        var a = wins[i][0], b = wins[i][1];
        if (t >= a && t <= b) {
          var al = Math.min(1, (t - a)/250, (b - t)/250);
          ctx.globalAlpha = Math.max(0, al);
          ctx.fillStyle = '#ffe9a8';
          ctx.font = 'bold 42px sans-serif';
          ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 12;
          var lines = wrapTxt(ctx, scenes[i], W - 120);
          var y = H - 200 - (lines.length - 1) * 26;
          lines.forEach(function(ln){ ctx.fillText(ln, W/2, y); y += 52; });
          ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }
      }

      if (t < 8800) {
        ctx.globalAlpha = .85;
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#f2b705';
        ctx.fillText('🦁 Lion Studio', W - 28, 48);
        ctx.globalAlpha = 1;
      }

      if (t >= 8900) {
        var k = Math.min(1, (t - 8900)/500);
        ctx.fillStyle = 'rgba(14,14,16,' + (0.9 * k).toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = k;
        ctx.textAlign = 'center';
        ctx.font = 'bold 56px sans-serif';
        ctx.fillText('🦁', W/2, H/2 - 170);
        ctx.fillStyle = '#f2b705';
        ctx.font = 'bold 44px sans-serif';
        var pl = wrapTxt(ctx, prod, W - 120);
        var py = H/2 - 70;
        pl.forEach(function(ln){ ctx.fillText(ln, W/2, py); py += 52; });
        if (shop.name) {
          ctx.font = 'bold 30px sans-serif';
          ctx.fillStyle = '#ffe9a8';
          ctx.fillText(shop.name, W/2, py + 26);
        }
        if (shop.contact) {
          ctx.font = '28px sans-serif';
          ctx.fillStyle = '#cfc7b8';
          ctx.fillText(shop.contact, W/2, py + 66);
        }
        ctx.font = '22px sans-serif';
        ctx.fillStyle = '#6f6a5e';
        ctx.fillText('L I O N   S T U D I O', W/2, H - 70);
        ctx.globalAlpha = 1;
      }
    }

    function frame(now){
      var t = now - t0;
      draw(t);
      var sec = Math.min(10, Math.floor(t / 1000));
      setBtns(id, '🎥 ' + sec + 's / 10s', true);
      if (t < DUR) requestAnimationFrame(frame);
      else rec.stop();
    }
    requestAnimationFrame(frame);

    await stopped;
    stream.getTracks().forEach(function(tr){ tr.stop(); });
    recording = false;

    var blob = new Blob(chunks, { type: mime.split(';')[0] });
    var ext = mime.indexOf('mp4') > -1 ? 'mp4' : 'webm';
    var slug = prod.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'ad';
    var fname = 'lion-' + slug + '.' + ext;

    if (blob.size < 5000) {
      setBtns(id, '', false);
      setBtns(id, '⬇️ Save video', false);
      document.getElementById('xh-' + id).textContent = '📤 Share';
      if (msg) msg.textContent = '❌ Recording came out empty — tell the Captain.';
      return;
    }

    pendingShare[id] = { blob: blob, fname: fname, prod: prod, tagline: scenes[2] };
    var bS = document.getElementById('xs-' + id);
    var bH = document.getElementById('xh-' + id);
    if (bS) { bS.disabled = false; bS.textContent = '⬇️ Save video'; }
    if (bH) { bH.disabled = false; bH.textContent = '📤 Tap to share'; }
  }

  async function loadJobs(){
    var box = document.getElementById('st-jobs');
    if (!box) return;
    var u = await me();
    if (!u) return;

    var r = await client.from('studio_jobs')
      .select('id, preset, prompt, status, is_mock, created_at, photo_data')
      .eq('creator_id', u.id)
      .eq('kind', 'video')
      .order('created_at', { ascending: false })
      .limit(10);

    if (r.error) { box.innerHTML = '<p>❌ ' + esc(r.error.message) + '</p>'; return; }
    var jobs = r.data || [];
    if (!jobs.length) {
      box.innerHTML = '<p>Nothing yet — your first render waits above.</p>';
      return;
    }

    var now = Date.now();
    var heals = [];
    jobs.forEach(function(j){
      if (j.status === 'pending' && j.is_mock &&
          (now - Date.parse(j.created_at)) > 30000) {
        heals.push(client.from('studio_jobs')
          .update({ status: 'done', result_url: 'mock://preview' })
          .eq('id', j.id));
      }
    });
    if (heals.length) { await Promise.all(heals); return loadJobs(); }

    jobsById = {};
    jobs.forEach(function(j){ jobsById[j.id] = j; });

    box.innerHTML = jobs.map(cardHTML).join('');

    box.onclick = async function(e){
      var pb = e.target.closest ? e.target.closest('.playbtn') : null;
      if (pb) { play(pb.getAttribute('data-id')); return; }

      var xb = e.target.closest ? e.target.closest('.xbtn') : null;
      if (!xb || xb.disabled) return;
      var act = xb.getAttribute('data-act');
      var id  = xb.getAttribute('data-id');

      if (act === 'save') {
        makeVideo(id).then(function(){
          var ps = pendingShare[id];
          if (ps) downloadBlob(ps.blob, ps.fname);
        });
        return;
      }

      if (act === 'share') {
        var ps2 = pendingShare[id];
        if (ps2) {
          delete pendingShare[id];
          xb.textContent = '📤 Share';
          var file = new File([ps2.blob], ps2.fname, { type: ps2.blob.type });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({ files: [file], title: ps2.prod, text: ps2.tagline });
            } catch(e) {}
          } else {
            downloadBlob(ps2.blob, ps2.fname);
          }
          return;
        }
        makeVideo(id);
      }
    };
  }

  var nav = document.getElementById('nav-studio');
  if (nav) nav.addEventListener('click', function(){ refresh(); });

  refresh();
})();
