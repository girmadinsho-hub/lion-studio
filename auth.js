/* ==========================================
   LION STUDIO — auth.js (the gate)
   Block 8: welcome stamp can't double-press.
   ========================================== */
(function(){
  var client = window.lionClient;
  if (!client) return;

  var elIn  = document.getElementById('auth-signed-in');
  var elOut = document.getElementById('auth-signed-out');
  var msg   = document.getElementById('a-msg');

  function show(signedIn){
    if (!elIn || !elOut) return;
    elIn.style.display  = signedIn ? 'block' : 'none';
    elOut.style.display = signedIn ? 'none'  : 'block';
  }

  async function ensureProfile(u){
    var ex = await client.from('creators').select('id').eq('id', u.id).maybeSingle();
    if (ex.data) return;

    await client.from('creators').upsert(
      { id: u.id, email: u.email,
        display_name: (u.email || 'creator').split('@')[0] },
      { onConflict: 'id' }
    );
    await client.from('wallets').upsert(
      { creator_id: u.id, balance: 30 },
      { onConflict: 'creator_id' }
    );

    var wl = await client.from('ledger').select('id')
      .eq('creator_id', u.id)
      .eq('reason', 'Welcome bonus — beta')
      .limit(1);
    if (!wl.data || !wl.data.length) {
      await client.from('ledger')
        .insert({ creator_id: u.id, delta: 30, reason: 'Welcome bonus — beta' });
    }
  }

  async function showBalance(id){
    var w = await client.from('wallets').select('balance').eq('creator_id', id).maybeSingle();
    var b = document.getElementById('a-balance');
    if (b) b.textContent = w.data ? w.data.balance : '?';
  }

  async function render(){
    var s = await client.auth.getSession();
    var u = s.data && s.data.session ? s.data.session.user : null;
    if (!u) { show(false); return; }
    show(true);
    var name = document.getElementById('a-name');
    var mail = document.getElementById('a-mail');
    if (name) name.textContent = (u.email || 'creator').split('@')[0];
    if (mail) mail.textContent = u.email || '';
    await ensureProfile(u);
    await showBalance(u.id);
  }

  var bIn  = document.getElementById('a-in');
  var bUp  = document.getElementById('a-up');
  var bOut = document.getElementById('a-out');

  if (bIn) bIn.addEventListener('click', async function(){
    msg.textContent = 'Opening the gate…';
    var email = document.getElementById('a-email').value.trim();
    var pass  = document.getElementById('a-pass').value;
    var r = await client.auth.signInWithPassword({ email: email, password: pass });
    if (r.error) { msg.textContent = '❌ ' + r.error.message; return; }
    msg.textContent = ''; render();
  });

  if (bUp) bUp.addEventListener('click', async function(){
    msg.textContent = 'Forging your key…';
    var email = document.getElementById('a-email').value.trim();
    var pass  = document.getElementById('a-pass').value;
    if (pass.length < 6) { msg.textContent = '❌ Password needs at least 6 characters.'; return; }
    var r = await client.auth.signUp({ email: email, password: pass });
    if (r.error) { msg.textContent = '❌ ' + r.error.message; return; }
    msg.textContent = ''; render();
  });

  if (bOut) bOut.addEventListener('click', async function(){
    await client.auth.signOut();
    render();
  });

  client.auth.onAuthStateChange(function(){ render(); });
  render();
})();
