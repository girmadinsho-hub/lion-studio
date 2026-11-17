/* ==========================================
   LION STUDIO — earnings.js (Block 24)
   EARNINGS HISTORY — every paid order gets
   a date, grouped by month with bars so you
   watch your business grow. Lives inside
   the Clients tab. 100% offline.
   ========================================== */
(function(){

  var tab = document.getElementById('tab-clients');
  if (!tab || document.getElementById('card-earn')) return;

  var LS_ORDERS = 'lion_orders';
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function lsGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function lsSet(k,v){ try { localStorage.setItem(k,v); } catch(e){} }
  function loadOrders(){
    try { return JSON.parse(lsGet(LS_ORDERS) || '[]') || []; }
    catch(e){ return []; }
  }
  function money(n){ return Number(n || 0).toLocaleString() + ' ETB'; }
  function pad2(n){ n = String(n); while (n.length < 2) n = '0' + n; return n; }
  function monthKey(ts){ var d = new Date(ts); return d.getFullYear() + '-' + pad2(d.getMonth() + 1); }
  function monthLabel(key){ var p = key.split('-'); return MONTHS[parseInt(p[1],10) - 1] + ' ' + p[0]; }

  // ---------- self-heal: paid orders must carry a date ----------
  function heal(){
    var orders = loadOrders();
    var changed = false;
    orders.forEach(function(o){
      if (o.status === 'paid' && !o.paidAt) { o.paidAt = Date.now(); changed = true; }
      if (o.status !== 'paid' && o.paidAt) { delete o.paidAt; changed = true; }
    });
    if (changed) lsSet(LS_ORDERS, JSON.stringify(orders));
  }

  // ---------- build the card ----------
  var card = document.createElement('div');
  card.className = 'card';
  card.id = 'card-earn';
  card.innerHTML = '<h2>📈 Earnings history</h2><div id="er-body"></div>';
  tab.appendChild(card);

  var css = document.createElement('style');
  css.textContent = [
    '.er-month{display:flex;align-items:center;gap:8px;margin-bottom:8px;}',
    '.er-lab{flex:0 0 64px;font-size:11px;color:#cfc7b8;}',
    '.er-barw{flex:1;background:#17171b;border:1px solid #232328;border-radius:6px;overflow:hidden;}',
    '.er-bar{height:14px;background:#f2b705;border-radius:5px 0 0 5px;min-width:2px;}',
    '.er-amt{flex:0 0 90px;font-size:11px;font-weight:700;color:#f5f0e6;text-align:right;white-space:nowrap;}',
    '.er-total{font-size:11px;color:#6f6a5e;text-align:center;margin-top:10px;letter-spacing:1px;text-transform:uppercase;}'
  ].join('');
  document.head.appendChild(css);

  function render(){
    var el = document.getElementById('er-body');
    if (!el) return;
    var orders = loadOrders().filter(function(o){ return o.status === 'paid' && o.paidAt; });
    if (!orders.length) {
      el.innerHTML = '<div class="hint" style="text-align:center;padding:6px 0">No paid orders yet — mark an order PAID and it lands here with its month.</div>';
      return;
    }
    var byMonth = {};
    var allTime = 0;
    orders.forEach(function(o){
      var k = monthKey(o.paidAt);
      if (!byMonth[k]) byMonth[k] = { total: 0, count: 0 };
      byMonth[k].total += Number(o.price) || 0;
      byMonth[k].count++;
      allTime += Number(o.price) || 0;
    });
    var keys = Object.keys(byMonth).sort().reverse().slice(0, 6);
    var max = 1;
    keys.forEach(function(k){ if (byMonth[k].total > max) max = byMonth[k].total; });
    var html = '';
    keys.forEach(function(k){
      var m = byMonth[k];
      var w = Math.max(2, Math.round((m.total / max) * 100));
      html += '<div class="er-month">'
        + '<span class="er-lab">' + monthLabel(k) + '</span>'
        + '<div class="er-barw"><div class="er-bar" style="width:' + w + '%"></div></div>'
        + '<span class="er-amt">' + money(m.total) + '</span>'
        + '</div>';
    });
    html += '<div class="er-total">All time: ' + money(allTime) + ' · ' + orders.length + ' paid order' + (orders.length === 1 ? '' : 's') + '</div>';
    el.innerHTML = html;
  }

  heal();
  render();

  // ---------- live refresh when the ledger changes ----------
  var pending = null;
  function refresh(){
    if (pending) clearTimeout(pending);
    pending = setTimeout(function(){ heal(); render(); }, 150);
  }
  var targets = [document.getElementById('c-sum'), document.getElementById('c-list')];
  var MO = window.MutationObserver;
  if (MO && targets[0]) {
    var mo = new MO(refresh);
    targets.forEach(function(t){ if (t) mo.observe(t, { childList: true }); });
  } else {
    setInterval(refresh, 2000);
  }

})();
