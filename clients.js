/* ==========================================
   LION STUDIO — clients.js (Block 21)
   THE CLIENT DESK — mini-CRM + money counter.
   Orders in, statuses tapped, ETB counted.
   100% offline. Your business ledger.
   ========================================== */
(function(){

  // ---------- door 1: inject nav button + tab ----------
  var nav  = document.querySelector('nav');
  var main = document.querySelector('main');
  if (!nav || !main || document.getElementById('tab-clients')) return;

  var navBtn = document.createElement('button');
  navBtn.id  = 'nav-clients';
  navBtn.innerHTML = '<span class="ic">💼</span>Clients';
  navBtn.onclick = function(){ window.lionGo('clients'); };
  nav.appendChild(navBtn);

  var sec = document.createElement('section');
  sec.id = 'tab-clients';
  sec.style.display = 'none';
  main.appendChild(sec);

  var css = document.createElement('style');
  css.textContent = [
    '.cl-ord{background:#0e0e10;border:1px solid #2a2a30;border-radius:12px;padding:12px;margin-bottom:10px;}',
    '.cl-ord .top{display:flex;align-items:center;gap:8px;}',
    '.cl-ord .who{flex:1;min-width:0;}',
    '.cl-ord .who b{font-size:13px;color:#f5f0e6;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.cl-ord .who small{font-size:11px;color:#6f6a5e;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.cl-ord .amt{font-size:14px;font-weight:700;color:#f2b705;white-space:nowrap;}',
    '.cl-st{margin-top:8px;display:flex;gap:8px;align-items:center;}',
    '.cl-chip{font-size:10px;letter-spacing:1px;padding:4px 10px;border-radius:999px;border:1px solid #2a2a30;color:#cfc7b8;background:none;font-family:inherit;}',
    '.cl-chip.new{color:#f2b705;border-color:#f2b705;}',
    '.cl-chip.done{color:#38bdf8;border-color:#38bdf8;}',
    '.cl-chip.paid{color:#4ade80;border-color:#4ade80;}',
    '.cl-del{margin-left:auto;background:none;border:none;color:#f87171;font-size:14px;padding:4px 6px;font-family:inherit;}',
    '.cl-sum{display:flex;gap:10px;margin-bottom:14px;}',
    '.cl-box{flex:1;background:#0e0e10;border:1px solid #232328;border-radius:12px;padding:10px;text-align:center;}',
    '.cl-box b{display:block;font-size:20px;color:#f2b705;}',
    '.cl-box.paid b{color:#4ade80;}',
    '.cl-box small{font-size:9px;letter-spacing:1px;color:#6f6a5e;text-transform:uppercase;}'
  ].join('');
  document.head.appendChild(css);

  // ---------- door 2: teach lionGo the new tab ----------
  var oldGo = window.lionGo;
  window.lionGo = function(name){
    sec.style.display = (name === 'clients') ? 'block' : 'none';
    navBtn.classList.toggle('active', name === 'clients');
    if (name === 'clients') {
      ['home','studio','vault','director'].forEach(function(t){
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
  var LS_ORDERS = 'lion_orders';
  var orders = [];
  try {
    var raw = null;
    try { raw = localStorage.getItem(LS_ORDERS); } catch(e){ raw = null; }
    orders = JSON.parse(raw || '[]') || [];
  } catch(e){ orders = []; }
  function persist(){
    try { localStorage.setItem(LS_ORDERS, JSON.stringify(orders)); } catch(e){}
  }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

  function nextStatus(s){
    if (s === 'new') return 'done';
    if (s === 'done') return 'paid';
    return 'new';
  }

  // ---------- build the UI ----------
  sec.innerHTML = ''
    + '<div class="card">'
    +   '<h2>💼 Client desk</h2>'
    +   '<p>Your video business ledger: every order, every birr, in one place. Works offline, saved on this phone.</p>'
    + '</div>'
    + '<div class="card">'
    +   '<h2>New order</h2>'
    +   '<input id="c-name" placeholder="client name (e.g. Merkato Smart Shop)">'
    +   '<input id="c-phone" placeholder="phone (optional)" inputmode="tel">'
    +   '<input id="c-item" placeholder="what (e.g. 1 promo video for TikTok)">'
    +   '<input id="c-price" placeholder="price in ETB (e.g. 500)" inputmode="numeric" type="number">'
    +   '<button class="btn" id="c-add">➕ Add order</button>'
    +   '<div id="c-msg" class="gm"></div>'
    + '</div>'
    + '<div class="card">'
    +   '<h2>The money</h2>'
    +   '<div class="cl-sum" id="c-sum"></div>'
    +   '<div id="c-list"></div>'
    + '</div>'
    + '<div style="height:20px"></div>';

  // ---------- render ----------
  function money(n){ return Number(n || 0).toLocaleString() + ' ETB'; }

  function sumHTML(){
    var paid = 0, waiting = 0, count = orders.length;
    orders.forEach(function(o){
      if (o.status === 'paid') paid += Number(o.price) || 0;
      else waiting += Number(o.price) || 0;
    });
    return '<div class="cl-box paid"><b>' + money(paid) + '</b><small>Earned</small></div>'
      +     '<div class="cl-box"><b>' + money(waiting) + '</b><small>Waiting</small></div>'
      +     '<div class="cl-box"><b>' + count + '</b><small>Orders</small></div>';
  }

  function statusChip(o){
    var label = 'NEW';
    if (o.status === 'done') label = 'DONE';
    if (o.status === 'paid') label = 'PAID';
    return '<button class="cl-chip ' + o.status + '" data-cycle="' + o.id + '">' + label + '</button>';
  }

  function listHTML(){
    if (!orders.length) return '<div class="hint" style="text-align:center;padding:10px 0">No orders yet — add your first one above.</div>';
    var out = '';
    orders.forEach(function(o){
      out += '<div class="cl-ord">'
        + '<div class="top">'
        +   '<div class="who"><b>' + esc(o.name) + '</b><small>' + esc(o.item) + (o.phone ? ' · ' + esc(o.phone) : '') + '</small></div>'
        +   '<div class="amt">' + money(o.price) + '</div>'
        + '</div>'
        + '<div class="cl-st">'
        +   statusChip(o)
        +   '<button class="cl-del" data-del="' + o.id + '">✕</button>'
        + '</div></div>';
    });
    return out;
  }

  function render(){
    document.getElementById('c-sum').innerHTML = sumHTML();
    document.getElementById('c-list').innerHTML = listHTML();
  }

  // ---------- actions ----------
  document.getElementById('c-add').onclick = function(){
    var name  = document.getElementById('c-name').value.trim();
    var phone = document.getElementById('c-phone').value.trim();
    var item  = document.getElementById('c-item').value.trim();
    var price = parseFloat(document.getElementById('c-price').value) || 0;
    var msg   = document.getElementById('c-msg');
    if (!name || !item) {
      msg.textContent = 'Client name and item are needed.';
      msg.style.color = '#f87171';
      return;
    }
    orders.unshift({ id: uid(), name: name, phone: phone, item: item, price: price, status: 'new' });
    persist(); render();
    document.getElementById('c-name').value = '';
    document.getElementById('c-phone').value = '';
    document.getElementById('c-item').value = '';
    document.getElementById('c-price').value = '';
    msg.textContent = 'Order saved ✅ Go make the video.';
    msg.style.color = '#4ade80';
  };

  document.getElementById('c-list').addEventListener('click', function(e){
    var t = e.target;
    var cyc = t.getAttribute && t.getAttribute('data-cycle');
    var del = t.getAttribute && t.getAttribute('data-del');
        if (cyc) {
      for (var i = 0; i < orders.length; i++) {
        if (orders[i].id === cyc) {
          orders[i].status = nextStatus(orders[i].status);
          if (orders[i].status === 'paid') orders[i].paidAt = Date.now();
          else delete orders[i].paidAt;
          break;
        }
      }
      persist(); render();
    } else if (del) {
      for (var j = 0; j < orders.length; j++) {
        if (orders[j].id === del) { orders.splice(j, 1); break; }
      }
      persist(); render();
    }
  });

  render();

})();
