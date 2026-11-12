/* ==========================================
   LION STUDIO — app.js (shell engine)
   Block 13: fortress + brain probe.
   ========================================== */
(function(){

  // Version chip
  var chip = document.getElementById('ver-chip');
  if (chip && window.LION && window.LION.APP_VERSION) {
    chip.textContent = 'v' + window.LION.APP_VERSION;
  }

  // Service worker
  var sw = document.getElementById('sw-state');
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(function(){ if (sw) { sw.textContent = 'offline ready ✅'; sw.className = 'ok'; } })
      .catch(function(){ if (sw) { sw.textContent = 'sw failed ❌'; sw.className = 'bad'; } });
  }

  // Network dot
  function net(){
    var d = document.getElementById('net-dot');
    if (d) d.style.background = navigator.onLine ? '#4ade80' : '#f87171';
  }
  window.addEventListener('online', net);
  window.addEventListener('offline', net);
  net();

  // Tabs
  var tabs = ['home','studio','vault'];
  window.lionGo = function(name){
    tabs.forEach(function(t){
      document.getElementById('tab-' + t).style.display = (t === name) ? 'block' : 'none';
      var b = document.getElementById('nav-' + t);
      if (b) b.classList.toggle('active', t === name);
    });
  };
  window.lionGo('home');

  // Bridge self-test (lives in Home now)
  var sConfig = document.getElementById('s-config');
  var sLib    = document.getElementById('s-lib');
  var sDb     = document.getElementById('s-db');
  var sWrite  = document.getElementById('s-write');
  if (!sConfig) return;

  if (window.LION && window.LION.SUPABASE_URL && window.LION.SUPABASE_ANON_KEY) {
    sConfig.textContent = 'OK ✅'; sConfig.className = 'ok';
  } else {
    sConfig.textContent = 'MISSING ❌'; sConfig.className = 'bad';
    sLib.textContent = sDb.textContent = sWrite.textContent = 'skipped'; return;
  }

  if (window.supabase && window.supabase.createClient) {
    sLib.textContent = 'OK ✅'; sLib.className = 'ok';
  } else {
    sLib.textContent = 'FAILED ❌'; sLib.className = 'bad';
    sDb.textContent = sWrite.textContent = 'skipped'; return;
  }

  var client;
  try {
    client = window.supabase.createClient(
      window.LION.SUPABASE_URL, window.LION.SUPABASE_ANON_KEY
    );
  } catch(e) {
    sDb.textContent = 'BAD URL ❌ ' + e.message; sDb.className = 'bad'; return;
  }
  window.lionClient = client;

  (async function(){
    var r1 = await client.from('studio_jobs').select('id').limit(1);
    if (r1.error) {
      sDb.textContent = 'CHECK FAILED ❌ ' + ((r1.error.message||'').slice(0,60));
      sDb.className = 'bad'; sWrite.textContent = 'offline or blocked'; return;
    }
    sDb.textContent = 'TABLES FOUND ✅'; sDb.className = 'ok';

    var s = await client.auth.getSession();
    var u = (s.data && s.data.session) ? s.data.session.user : null;
    if (!u) {
      sWrite.textContent = 'locked 🔒 sign in to test';
      sWrite.className = 'warn';
      return;
    }

    var r2 = await client.from('studio_jobs')
      .insert({ creator_id: u.id, kind:'image', preset:'boot-test',
                prompt:'app shell round trip', status:'done', is_mock:true })
      .select('id').single();
    if (r2.error) {
      sWrite.textContent = 'WRITE FAILED ❌'; sWrite.className = 'bad'; return;
    }
    await client.from('studio_jobs').delete().eq('id', r2.data.id);
    sWrite.textContent = 'WRITE+CLEAN ✅'; sWrite.className = 'ok';
  })();

  // Brain probe — is the server room answering?
  var sBrain = document.getElementById('s-brain');
  if (sBrain) {
    (async function(){
      try {
        var r = await client.functions.invoke('lion-brain', { body: { action: 'ping' } });
        if (r.error) throw new Error('no answer');
        if (r.data && r.data.awake) {
          sBrain.textContent = 'AWAKE 🧠'; sBrain.className = 'ok';
        } else {
          sBrain.textContent = 'SLEEPING 💤'; sBrain.className = 'warn';
        }
      } catch(e) {
        sBrain.textContent = 'NOT DEPLOYED ❌'; sBrain.className = 'bad';
      }
    })();
  }

})();
