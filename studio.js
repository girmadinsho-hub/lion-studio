/* ==========================================
   LION STUDIO — studio.js (Director's Cut)
   Block 8: real product photo + moving
   camera + the phone speaks the ad.
   Still mock. Still free. Now cinematic.
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
        '<p style="font-size:11px;color:#6f6a5e">Mock mode: fake brain, real flow. Costs 0 credits. Renders with a photo get the cinema screen + voice.</p>' +
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
    loadJobs();
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
    if (u) { renderIn(); } else { renderOut(); }
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
    void th.offsetWidth; /* restart the camera move from frame zero */
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
      '</div>';
    }

    if (j.status === 'done') {
      return '<div class="job">' + head +
        '<div class="frame"><span class="mockbadge">MOCK</span>' +
          scenes.map(function(s){ return '<div class="scene">' + esc(s) + '</div>'; }).join('') +
        '</div>' +
        '<div class="jmeta">' + esc(p.label) + ' · ' + stamp + ' · cost 0 credits</div>' +
      '</div>';
    }

    return '<div class="job">' + head +
      '<div class="jmeta" id="jl-' + j.id + '">🎬 Warming up…</div>' +
      '<div class="jmeta">' + esc(p.label) + ' · mock render in progress</div>' +
    '</div>';
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

    /* Self-heal: finish any mock render left pending by a closed tab */
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
    box.onclick = function(e){
      var b = e.target.closest ? e.target.closest('.playbtn') : null;
      if (b) play(b.getAttribute('data-id'));
    };
  }

  /* Re-render every time the Studio door opens */
  var nav = document.getElementById('nav-studio');
  if (nav) nav.addEventListener('click', function(){ refresh(); });

  refresh();
})();
