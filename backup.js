/* ==========================================
   LION STUDIO — backup.js (Block 23)
   SAFE BACKUP — one tap saves your whole
   business (shots, brand, subtitles, orders,
   portfolio) into one file. Restore puts
   it all back. 100% offline.
   ========================================== */
(function(){

  var home = document.getElementById('tab-home');
  if (!home || document.getElementById('card-backup')) return;

  var KEYS = ['lion_director_char','lion_director_shots','lion_director_cost',
              'lion_director_brand','lion_director_subs','lion_orders','lion_portfolio'];

  function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function lsSet(k,v){ try { localStorage.setItem(k,v); } catch(e){} }

  function n(k){
    try { var v = JSON.parse(lsGet(k) || '[]'); return Array.isArray(v) ? v.length : 0; } catch(e){ return 0; }
  }
  function renderCounts(){
    var el = document.getElementById('bk-counts');
    if (el) el.textContent = n('lion_director_shots') + ' shots · ' + n('lion_orders') + ' orders · ' + n('lion_portfolio') + ' works live on this phone';
  }

  var card = document.createElement('div');
  card.className = 'card';
  card.id = 'card-backup';
  card.innerHTML = ''
    + '<h2>🛡 Safe backup</h2>'
    + '<p>Your business data lives only on this phone. One lost phone = lost ledger. Export a backup file after every work day and keep it somewhere safe (Telegram Saved Messages works well).</p>'
    + '<div class="hint" id="bk-counts"></div>'
    + '<div class="xbtns">'
    +   '<button class="xbtn" id="bk-export">⬇️ Export backup</button>'
    +   '<button class="xbtn" id="bk-import">⬆️ Restore backup</button>'
    + '</div>'
    + '<input type="file" id="bk-file" accept="application/json,.json" style="display:none">'
    + '<div id="bk-msg" class="gm"></div>';
  home.appendChild(card);

  function msg(t, ok){
    var m = document.getElementById('bk-msg');
    m.textContent = t;
    m.style.color = ok ? '#4ade80' : '#f87171';
  }

  document.getElementById('bk-export').onclick = function(){
    var data = {};
    KEYS.forEach(function(k){ var v = lsGet(k); if (v !== null) data[k] = v; });
    var pack = {
      app: 'lion-studio-backup',
      version: 1,
      date: new Date().toISOString().slice(0,10),
      data: data
    };
    var blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lion-backup-' + pack.date + '.json';
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); document.body.removeChild(a); }, 500);
    msg('Backup file saved ✅ Keep it somewhere safe.', true);
  };

  document.getElementById('bk-import').onclick = function(){
    document.getElementById('bk-file').click();
  };

  document.getElementById('bk-file').addEventListener('change', function(){
    var f = this.files && this.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function(){
      var pack;
      try { pack = JSON.parse(reader.result); }
      catch(e){ msg('That file is not a valid backup.', false); return; }
      if (!pack || pack.app !== 'lion-studio-backup' || typeof pack.data !== 'object') {
        msg('This file was not made by Lion Studio backup.', false);
        return;
      }
      if (!confirm('Restore backup from ' + (pack.date || 'unknown date') + '? Data on this phone will be replaced.')) return;
      KEYS.forEach(function(k){
        if (Object.prototype.hasOwnProperty.call(pack.data, k)) lsSet(k, pack.data[k]);
      });
      msg('Restored ✅ Reloading…', true);
      setTimeout(function(){ location.reload(); }, 800);
    };
    reader.readAsText(f);
    this.value = '';
  });

  renderCounts();

})();
