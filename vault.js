/* ==========================================
   LION STUDIO — vault.js (the treasury)
   Block 7: balance, movements, daily bonus.
   ========================================== */
(function(){
  var client = window.lionClient;
  var body = document.getElementById('vault-body');
  if (!client || !body) return;

  var DAY = 24 * 60 * 60 * 1000;

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
        '<h2>The vault is for creators</h2>' +
        '<p>Sign in on the <b>Home</b> tab to open your treasury.</p>' +
      '</div>';
  }

  async function renderIn(u){
    var pro = await client.from('creators').select('display_name, plan, created_at').eq('id', u.id).maybeSingle();
    var wal = await client.from('wallets').select('balance').eq('creator_id', u.id).maybeSingle();
    var cnt = await client.from('studio_jobs').select('id', { count:'exact', head:true })
                .eq('creator_id', u.id).eq('kind','video');
    var led = await client.from('ledger').select('delta, reason, created_at')
                .eq('creator_id', u.id).order('created_at', { ascending:false }).limit(20);
    var last= await client.from('ledger').select('created_at')
                .eq('creator_id', u.id).eq('reason','Daily bonus')
                .order('created_at', { ascending:false }).limit(1);

    var balance = wal.data ? wal.data.balance : 0;
    var renders = (cnt.count !== null && cnt.count !== undefined) ? cnt.count : 0;
    var plan    = (pro.data && pro.data.plan) || 'free';
    var since   = pro.data ? when(pro.data.created_at).slice(0,10) : '';
    var name    = (pro.data && pro.data.display_name) || 'creator';

    var lastBonus = (last.data && last.data.length) ? Date.parse(last.data[0].created_at) : 0;
    var eligible = (Date.now() - lastBonus) > DAY;

    var ledHTML;
    if (led.error) ledHTML = '<p>❌ ' + esc(led.error.message) + '</p>';
    else if (!led.data || !led.data.length) ledHTML = '<p>No movements yet.</p>';
    else ledHTML = led.data.map(function(m){
      var d = m.delta || 0;
      return '<div class="mv">' +
        '<div class="d">' + esc(m.reason) + '<span class="when">' + when(m.created_at) + '</span></div>' +
        '<div class="amt ' + (d >= 0 ? 'plus' : 'minus') + '">' + (d > 0 ? '+' : '') + d + '</div>' +
      '</div>';
    }).join('');

    body.innerHTML =
      '<div class="card">' +
        '<h2>🪙 Your vault</h2>' +
        '<div class="bigbal"><span>' + balance + '</span><small>credits</small></div>' +
        '<p style="text-align:center;font-size:12px;color:#6f6a5e">🦁 ' + esc(name) +
        ' · plan ' + esc(plan) + ' · 🎬 ' + renders + ' render' + (renders === 1 ? '' : 's') +
        ' · since ' + since + '</p>' +
      '</div>' +
      '<div class="card">' +
        '<h2>🎁 Daily bonus</h2>' +
        '<p>Come back once a day and claim <b>+5 credits</b>. They will pay for real renders when the AI brain arrives.</p>' +
        (eligible
          ? '<button class="btn" id="v-bonus">🎁 Claim +5 credits</button>'
          : '<button class="btn ghost" disabled>✅ Claimed — come back tomorrow</button>') +
        '<div id="v-msg"></div>' +
      '</div>' +
      '<div class="card">' +
        '<h2>📜 Movements</h2>' +
        ledHTML +
      '</div>';

    var b = document.getElementById('v-bonus');
    if (b) b.addEventListener('click', function(){ claim(u); });
  }

  async function claim(u){
    var btn = document.getElementById('v-bonus');
    var msg = document.getElementById('v-msg');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Claiming…'; }

    var wal = await client.from('wallets').select('balance').eq('creator_id', u.id).maybeSingle();
    if (!wal.data) {
      if (msg) msg.textContent = '❌ Wallet not found — sign out and back in.';
      return;
    }
    var nb = (wal.data.balance || 0) + 5;

    var r1 = await client.from('wallets')
      .update({ balance: nb, updated_at: new Date().toISOString() })
      .eq('creator_id', u.id);
    if (r1.error) { if (msg) msg.textContent = '❌ ' + r1.error.message; return; }

    var r2 = await client.from('ledger')
      .insert({ creator_id: u.id, delta: 5, reason: 'Daily bonus' });
    if (r2.error) { if (msg) msg.textContent = '❌ ' + r2.error.message; return; }

    var home = document.getElementById('a-balance');
    if (home) home.textContent = nb;

    renderIn(u);
  }

  async function refresh(){
    var u = await me();
    if (u) { renderIn(u); } else { renderOut(); }
  }

  var nav = document.getElementById('nav-vault');
  if (nav) nav.addEventListener('click', function(){ refresh(); });

  client.auth.onAuthStateChange(function(){ refresh(); });
  refresh();
})();
