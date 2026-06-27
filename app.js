/* ═══════════════════════════════════════════════════════════════
   Ocean Fast Ferries · Baggage Pro V300 — Application Logic
   ═══════════════════════════════════════════════════════════════ */

// ── Database Init ──
let DB = JSON.parse(localStorage.getItem(DB_KEY)) || {};
window.DB = DB;

(function mergeDefaults() {
  for (let key of Object.keys(DEFAULT_DB)) {
    if (!(key in DB)) { DB[key] = DEFAULT_DB[key]; continue; }
    if (typeof DEFAULT_DB[key] === 'object' && !Array.isArray(DEFAULT_DB[key])) {
      for (let subKey of Object.keys(DEFAULT_DB[key])) {
        if (!(subKey in DB[key])) DB[key][subKey] = DEFAULT_DB[key][subKey];
      }
    }
  }
})();
if (!DB.aiSettings) DB.aiSettings = { apiKey:'', useAI:true, model:'auto', timeoutMs:20000, lastStatus:'Not tested yet' };
if (DB.darkMode === undefined) DB.darkMode = false;

const saveDB = () => localStorage.setItem(DB_KEY, JSON.stringify(DB));
applyConnectingPassengerFares();

let currentRole = null, chatContext = [];
let lastReceiptText = '', lastTransaction = null;
let actionMenuOpen = false;

// ── Auth ──
function attemptLogin() {
  const u = $('loginUser').value.trim(), p = $('loginPass').value.trim();
  if (!u || !p) return toast('Please enter credentials');
  const cashier = DB.creds.cashier, supervisor = DB.creds.supervisor;
  if (u === cashier.u && p === cashier.p) { currentRole = 'cashier'; postLogin(); }
  else if (u === supervisor.u && p === supervisor.p) { currentRole = 'supervisor'; postLogin(); }
  else toast('Invalid username or password');
}
function logout() {
  currentRole = null; chatContext = [];
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $('loginOverlay').style.display = 'flex';
  $('roleBadge').textContent = '';
  $('drawerMenu').innerHTML = '';
}
function postLogin() {
  $('loginOverlay').style.display = 'none';
  $('roleBadge').textContent = currentRole === 'supervisor' ? '👑 Supervisor' : '💼 Cashier';
  applyTheme(); buildDrawerMenu(); showView('dashboard');
}

// ── Theme ──
function applyTheme() {
  document.body.classList.toggle('light-mode', !DB.darkMode);
  $('darkLightToggle').textContent = DB.darkMode ? '🌙' : '☀️';
}
function toggleTheme() { DB.darkMode = !DB.darkMode; saveDB(); applyTheme(); }

// ── Navigation ──
function buildDrawerMenu() {
  const items = [
    { view:'dashboard',  icon:'🏠', label:'Dashboard' },
    { view:'calculator', icon:'🧮', label:'Baggage Calc' },
    { view:'analytics',  icon:'📊', label:'Analytics' },
    { view:'map',        icon:'🗺️', label:'Live Map' },
    { view:'fares',      icon:'💰', label:'Fares & Slabs' },
    { view:'schedules',  icon:'🕐', label:'Schedules' },
    { view:'history',    icon:'📋', label:'History' },
    { view:'admin',      icon:'🔒', label:'Admin' }
  ];
  $('drawerMenu').innerHTML = items.map(i =>
    `<div class="drawer-item" data-view="${i.view}" onclick="navigate('${i.view}')"><i>${i.icon}</i> ${i.label}</div>`
  ).join('');
}
function toggleDrawer() {
  $('sideDrawer').classList.toggle('open');
  $('overlay').classList.toggle('show');
  $('hamburger').classList.toggle('open');
}
function closeDrawer() {
  $('sideDrawer').classList.remove('open');
  $('overlay').classList.remove('show');
  $('hamburger').classList.remove('open');
}
function navigate(view) { closeDrawer(); showView(view); }
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const viewEl = $(`view-${name}`);
  if (!viewEl) { console.warn('View not found:', name); return; }
  viewEl.classList.add('active');
  document.querySelectorAll('.drawer-item').forEach(el => el.classList.remove('active'));
  const item = document.querySelector(`.drawer-item[data-view="${name}"]`);
  if (item) item.classList.add('active');
  switch(name) {
    case 'dashboard':  buildDashboard(); break;
    case 'calculator': buildCalculator(); break;
    case 'analytics':  buildAnalytics(); break;
    case 'fares':      buildFares(); break;
    case 'schedules':  buildSchedules(); break;
    case 'history':    buildHistory(); break;
    case 'admin':      buildAdmin(); break;
    case 'map':        buildMap(); break;
  }
  updateDrawerBadges();
}

// ── Unified Action Menu ──
function toggleActionMenu() {
  actionMenuOpen = !actionMenuOpen;
  const fab = $('actionMenuFab');
  const items = $('actionMenuItems');
  if (!fab || !items) return;
  fab.classList.toggle('open', actionMenuOpen);
  items.classList.toggle('show', actionMenuOpen);
  // Close when clicking outside
  if (actionMenuOpen) {
    setTimeout(() => {
      document.addEventListener('click', closeActionMenuOutside, { once: true });
    }, 50);
  }
}
function closeActionMenuOutside(e) {
  if (e.target.closest('.action-menu-fab') || e.target.closest('.action-menu-items')) return;
  actionMenuOpen = false;
  $('actionMenuFab')?.classList.remove('open');
  $('actionMenuItems')?.classList.remove('show');
}

// ── Dashboard (V300: cleaned up, no duplicate sections) ──
function buildDashboard() {
  const s = DB.stats;
  const today = new Date().toISOString().slice(0,10);
  const todayTx = (DB.comps||[]).filter(c => c.time && c.time.slice(0,10) === today);
  const todayRev = todayTx.reduce((a,c) => a + Number(c.total||0), 0);
  const noteText = loadNote();
  const noteHtml = noteText
    ? `<div class="note-text">${noteText.replace(/</g,'&lt;')}</div>`
    : `<div class="note-placeholder">Tap Edit to add shift notes, supervisor info, vessel changes...</div>`;

  // Route activity
  const counts = {};
  todayTx.filter(c => c.route).forEach(c => { counts[c.route] = (counts[c.route]||0)+1; });
  const routeKeys = Object.keys(counts).sort((a,b) => counts[b]-counts[a]);
  const maxCount = routeKeys.length ? counts[routeKeys[0]] : 1;
  const routeHtml = routeKeys.length
    ? routeKeys.map(k => `<div class="route-row"><span class="route-name">${routeName(k)}</span><div class="route-bar"><div class="route-fill" style="width:${Math.round(counts[k]/maxCount*100)}%"></div></div><span class="route-count">${counts[k]}</span></div>`).join('')
    : '<div style="font-size:.75rem;color:#8fa3c8;padding:4px 0">No transactions yet today.</div>';

  $('view-dashboard').innerHTML = `
    <div class="grid2">
      <div class="stat-box"><div class="stat-value" id="statTrans">${s.transactions}</div><div class="stat-label">Transactions</div></div>
      <div class="stat-box"><div class="stat-value" id="statRev">₱${todayRev.toFixed(0)}</div><div class="stat-label">Today Revenue</div></div>
      <div class="stat-box"><div class="stat-value" id="statKg">${s.totalKg}kg</div><div class="stat-label">Total Weight</div></div>
      <div class="stat-box"><div class="stat-value" id="statTop">${s.topRoute || '--'}</div><div class="stat-label">Top Route</div></div>
    </div>
    <div class="note-card" id="noteCard">
      <div class="note-head"><span class="note-title">📌 Shift Notes</span><span class="note-edit" onclick="editNote()">✎ Edit</span></div>
      ${noteHtml}
    </div>
    <div class="card" style="margin-top:12px">
      <div class="card-header">📊 Today's Route Activity</div>${routeHtml}
    </div>
    <div class="card" style="margin-top:12px">
      <div class="card-header">📈 Revenue Pulse</div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><span style="font-size:1.4rem;font-weight:900;color:#22d3ee">${fmtPHP(todayRev)}</span><span style="font-size:.7rem;color:var(--text3);margin-left:6px">today</span></div>
        <div style="font-size:.72rem;color:var(--text2)">${todayTx.length} transactions</div>
      </div>
      <div style="height:6px;background:rgba(255,255,255,.07);border-radius:3px;margin-top:8px;overflow:hidden">
        <div style="height:100%;width:${Math.min(100,todayRev/50000*100)}%;background:linear-gradient(90deg,#22d3ee,#a855f7);border-radius:3px"></div>
      </div>
    </div>
    <button class="accent block" style="margin-top:8px" onclick="navigate('analytics')">📊 View Full Analytics →</button>
    <button class="accent block" style="margin-top:6px" onclick="navigate('calculator')">🧮 Open Calculator →</button>
  `;
}

// ── Shift Notes ──
const NOTE_KEY = 'off_note_v300';
function loadNote() { try { return localStorage.getItem(NOTE_KEY) || ''; } catch(e) { return ''; } }
function saveNote(t) { try { localStorage.setItem(NOTE_KEY, t); } catch(e) {} }
function editNote() {
  const card = $('noteCard'); if(!card) return;
  const text = loadNote();
  card.innerHTML = `<div class="note-head"><span class="note-title">📌 Shift Notes</span></div>
    <textarea class="note-input" id="noteInput" placeholder="Type operational notes here...">${text}</textarea>
    <div class="note-actions"><button class="note-save" onclick="saveNoteEdit()">✓ Save</button><button class="note-cancel" onclick="cancelNoteEdit()">Cancel</button></div>`;
  const inp = $('noteInput'); if(inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
}
function saveNoteEdit() {
  const inp = $('noteInput'); if(!inp) return;
  saveNote(inp.value.trim());
  toast('Note saved ✓');
  buildDashboard();
}
function cancelNoteEdit() { buildDashboard(); }

// ── Calculator ──
function buildCalculator() {
  $('view-calculator').innerHTML = `
    <div class="card glow">
      <div class="card-header">🧮 Baggage Calculator</div>
      <div class="input-group"><label>Route</label>
        <div class="swap-wrap">
          <select id="calcRoute">${CEBU_BAGGAGE_ROUTES.map(k => `<option value="${k}">${routeName(k)}</option>`).join('')}</select>
          <button class="swap-btn" onclick="swapRoute()" title="Swap direction">⇄</button>
        </div>
      </div>
      <div class="input-group"><label>Mode</label><select id="calcMode" onchange="onModeChange()"><option value="normal">Normal</option><option value="fragile">Fragile</option></select></div>
      <div id="normalFields">
        <div class="grid2">
          <div class="input-group"><label>Class</label><select id="calcClass" onchange="updateAllowBar()"><option value="tourist">Tourist (10kg)</option><option value="business">Business (20kg)</option></select></div>
          <div class="input-group"><label>Passengers</label><input type="number" id="pax" value="1" min="1" onchange="updateAllowBar()" oninput="updateAllowBar()"></div>
        </div>
      </div>
      <div class="input-group"><label>Total Weight (kg)</label><input type="number" id="weight" value="0" step="0.1" min="0" oninput="updateAllowBar();updateWeightSuggestion()" onchange="updateAllowBar();updateWeightSuggestion()"></div>
      <div class="weight-suggest" id="weightSuggest"></div>
      <div class="allow-bar ok" id="allowBar">
        <div class="allow-row"><span class="allow-label">Free Allowance</span><span class="allow-status">Enter weight above</span></div>
      </div>
      <div class="input-group"><label>Rounding</label><select id="rounding"><option value="exact">Exact</option><option value="floor">Floor E (whole kg)</option></select></div>
      <button class="primary block" onclick="compute()">💰 Compute Fee</button>
      <button class="accent block" style="margin-top:6px" onclick="cashierAdjust()">💵 Smart Adjustment</button>
      <button class="reset-btn" onclick="resetCalc()">↺ Clear / Reset</button>
    </div>
    <div id="resultCard" class="card" style="display:none">
      <div class="result-banner"><div class="result-total" id="totalDisplay"></div><div id="perPaxDisplay" style="color:var(--text2);font-weight:600"></div></div>
      <div class="steps" id="stepsDisplay"></div>
      <div class="change-box" id="changeBox" style="display:none">
        <div style="font-weight:700;font-size:.78rem;margin-bottom:6px">💵 Change Calculator</div>
        <div class="change-row"><input type="number" id="tenderedInput" placeholder="Amount tendered (₱)" oninput="calcChange()"></div>
        <div class="change-result" id="changeResult"></div>
      </div>
      <button class="share-fab" id="shareBtn" onclick="shareReceipt()" style="display:none">📤 Share Receipt</button>
    </div>
    <div class="receipt" id="receipt"></div>
  `;
  $('calcRoute').value = 'cebu_tagbilaran';
  onModeChange(); updateAllowBar();
}

function onModeChange() {
  const isFragile = $('calcMode').value === 'fragile';
  const grid = $('normalFields')?.querySelector('.grid2');
  if (grid) grid.style.display = isFragile ? 'none' : 'grid';
  updateAllowBar(); updateWeightSuggestion();
}

function updateAllowBar() {
  const bar = $('allowBar'); if(!bar) return;
  const mode = ($('calcMode')?.value) || 'normal';
  const cls = ($('calcClass')?.value) || 'tourist';
  const pax = Math.max(1, parseInt(($('pax')?.value)||1, 10));
  const weight = parseFloat(($('weight')?.value)||0) || 0;
  if (mode === 'fragile') {
    bar.className = 'allow-bar warn';
    bar.innerHTML = `<div class="allow-row"><span class="allow-label">Fragile Mode</span><span class="allow-status warn">Full weight charged</span></div><div class="allow-detail">No free allowance — fee applies to all ${weight.toFixed(1)}kg</div>`;
    return;
  }
  const freeTotal = (DB.freeAllowance[cls]||10) * pax;
  const pct = Math.min(100, Math.round((weight/Math.max(freeTotal,1))*100));
  const excess = Math.max(0, weight - freeTotal);
  const state = excess > 0 ? 'over' : pct >= 80 ? 'warn' : 'ok';
  const statusText = excess > 0 ? `+${excess.toFixed(1)}kg excess` : `${weight.toFixed(1)}kg / ${freeTotal}kg free`;
  bar.className = `allow-bar ${state}`;
  bar.innerHTML = `<div class="allow-row"><span class="allow-label">Free Allowance (${cls} ×${pax})</span><span class="allow-status ${state}">${statusText}</span></div>
    <div class="allow-track"><div class="allow-fill ${state}" style="width:${pct}%"></div></div>
    <div class="allow-detail">${freeTotal}kg free • ${excess > 0 ? excess.toFixed(1)+'kg will be charged' : 'within free allowance'}</div>`;
}

function swapRoute() {
  const routeSel = $('calcRoute'); if(!routeSel) return;
  const v = routeSel.value || '';
  const parts = v.split('_');
  if (parts.length < 2) { toast('No reverse route'); return; }
  const rev = parts[1] + '_' + parts[0];
  let found = false;
  for (let i = 0; i < routeSel.options.length; i++) {
    if (routeSel.options[i].value === rev) { routeSel.value = rev; found = true; break; }
  }
  if (!found) { toast('Reverse route not available'); return; }
  toast('Route swapped ⇄');
  if ($('resultCard')?.style.display !== 'none') compute();
  updateAllowBar();
}

function resetCalc() {
  if($('pax')) $('pax').value = '1';
  if($('weight')) $('weight').value = '0';
  if($('calcMode')) $('calcMode').value = 'normal';
  if($('calcClass')) $('calcClass').value = 'tourist';
  const rc = $('resultCard'); if(rc) rc.style.display = 'none';
  const rcpt = $('receipt'); if(rcpt) { rcpt.innerHTML = ''; rcpt.style.display = 'none'; }
  const cb = $('changeBox'); if(cb) cb.style.display = 'none';
  const sb = $('shareBtn'); if(sb) sb.style.display = 'none';
  onModeChange(); updateAllowBar();
  if($('weight')) $('weight').focus();
  toast('↺ Calculator cleared');
}

function getCalcParams() {
  return {
    route: $('calcRoute').value, mode: $('calcMode').value,
    cls: $('calcClass').value, pax: parseInt($('pax').value)||1,
    weight: parseFloat($('weight').value)||0, rounding: $('rounding').value
  };
}

function compute(override = null) {
  const p = override || getCalcParams();
  const {route, mode, cls, pax, weight, rounding} = p;
  if (!DB.slabs[route]?.[mode]) { toast('Slab rates not found for this route/mode'); return; }
  const free = mode === 'normal' ? DB.freeAllowance[cls] : 0;
  const freeTotal = free * pax;
  let excess = Math.max(0, weight - freeTotal);
  let E = mode === 'normal' ? excess / pax : weight;
  if (rounding === 'floor') E = Math.floor(E);
  const slab = slabCost(E, DB.slabs[route][mode]);
  const perPax = slab.total;
  const total = mode === 'normal' ? perPax * pax : perPax;

  const steps = [
    `Free: ${free}kg × ${pax}pax = ${freeTotal}kg`,
    `Excess: ${weight}kg → ${excess.toFixed(1)}kg`,
    `E/pax: ${excess.toFixed(1)} ÷ ${pax} = ${E.toFixed(2)}kg`
  ];
  if (slab.t1>0) steps.push(`Tier1: ${slab.t1.toFixed(1)}kg × ₱${DB.slabs[route][mode][0]} = ₱${slab.c1.toFixed(2)}`);
  if (slab.t2>0) steps.push(`Tier2: ${slab.t2.toFixed(1)}kg × ₱${DB.slabs[route][mode][1]} = ₱${slab.c2.toFixed(2)}`);
  if (slab.t3>0) steps.push(`Tier3: ${slab.t3.toFixed(1)}kg × ₱${DB.slabs[route][mode][2]} = ₱${slab.c3.toFixed(2)}`);
  steps.push(`Per pax: ₱${perPax.toFixed(2)}`);
  steps.push(`Total: ${fmtPHP(total)}`);

  $('totalDisplay').textContent = fmtPHP(total);
  $('perPaxDisplay').textContent = mode==='normal' ? `₱${perPax.toFixed(2)} per passenger` : 'Fragile cargo';
  $('stepsDisplay').innerHTML = steps.map(s => `<div>• ${s}</div>`).join('');
  $('resultCard').style.display = 'block';

  const changeBox = $('changeBox'); if(changeBox) changeBox.style.display = 'block';
  const tendered = $('tenderedInput'); if(tendered) tendered.value = '';
  const changeResult = $('changeResult'); if(changeResult) changeResult.textContent = '';

  const shareBtn = $('shareBtn');
  if (shareBtn && navigator.share) shareBtn.style.display = 'block';
  else if (shareBtn) shareBtn.style.display = 'none';

  // Receipt with real QR code placeholder (filled by QRCode.js)
  const receiptHtml = `
    <div style="text-align:center;font-weight:bold;font-size:1rem;margin-bottom:6px">⛴️ Ocean Fast Ferries</div>
    <div style="text-align:center;font-size:.7rem;margin-bottom:8px">BAGGAGE FEE RECEIPT</div>
    <div>Route: <b>${routeName(route)}</b></div><div>Mode: <b>${mode.toUpperCase()}</b></div>
    <div>${mode==='normal'?`Class: <b>${cls}</b> | Pax: <b>${pax}</b>`:`Fragile Cargo`}</div>
    <div>Weight: <b>${weight} kg</b></div>
    <hr style="margin:6px 0">${steps.map(s => `<div>${s}</div>`).join('')}<hr style="margin:6px 0">
    <div style="text-align:center;font-weight:bold;font-size:1.1rem">💰 TOTAL: ${fmtPHP(total)}</div>
    <div class="receipt-qr" id="receiptQR"></div>
    <div style="font-size:.65rem;margin-top:6px;text-align:center">${new Date().toLocaleString()}</div>`;
  $('receipt').innerHTML = receiptHtml + `
    <div class="receipt-actions">
      <button class="primary-pdf" onclick="downloadReceiptPDF()">📄 Download PDF</button>
      <button onclick="downloadReceipt()">TXT</button>
      <button onclick="printReceiptPDF()">Print</button>
    </div>`;
  $('receipt').style.display = 'block';

  // Generate real QR code if library loaded
  generateReceiptQR(total, route);

  lastReceiptText = ['Ocean Fast Ferries','BAGGAGE FEE RECEIPT','Route: '+routeName(route),'Mode: '+mode.toUpperCase(),
    mode==='normal'?'Class: '+cls+' | Pax: '+pax:'Fragile Cargo','Weight: '+weight+' kg',
    '---',...steps,'---','TOTAL: '+fmtPHP(total),'Date: '+new Date().toLocaleString()].join('\n');

  if (!override) {
    lastTransaction = {route,mode,cls,pax,weight,total,time:new Date().toISOString()};
    DB.stats.transactions++; DB.stats.revenue += total; DB.stats.totalKg += weight;
    if (!DB.stats.routeCounts[route]) DB.stats.routeCounts[route] = 0;
    DB.stats.routeCounts[route]++;
    let top='',max=0;
    for (let [k,v] of Object.entries(DB.stats.routeCounts)) if(v>max){max=v;top=k;}
    DB.stats.topRoute = top;
    // V300 FIX: Only store in comps (no more duplicate DB.history)
    DB.comps.push({...lastTransaction});
    saveDB(); buildDashboard(); updateDrawerBadges();
  }
}

// ── Real QR Code Generation ──
function generateReceiptQR(total, route) {
  const qrEl = $('receiptQR');
  if (!qrEl) return;
  if (typeof QRCode !== 'undefined') {
    try {
      new QRCode(qrEl, {
        text: `OFF|${route}|${total}|${Date.now()}`,
        width: 64, height: 64,
        colorDark: '#000000', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.L
      });
    } catch(e) { qrEl.innerHTML = '<small style="color:#999">QR</small>'; }
  } else {
    qrEl.innerHTML = '<small style="color:#999">QR (offline)</small>';
  }
}

function calcChange() {
  const tendered = parseFloat($('tenderedInput')?.value) || 0;
  const totalText = $('totalDisplay')?.textContent || '₱0';
  const totalNum = parseFloat(totalText.replace(/[₱,]/g,'')) || 0;
  const result = $('changeResult'); if(!result) return;
  if (tendered <= 0) { result.textContent = ''; return; }
  const change = tendered - totalNum;
  result.textContent = change >= 0 ? `Change: ${fmtPHP(change)}` : `Short: ${fmtPHP(Math.abs(change))}`;
}

function shareReceipt() {
  if (!lastReceiptText) return;
  if (navigator.share) {
    navigator.share({ title:'Ocean Fast Ferries Receipt', text:lastReceiptText }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(lastReceiptText).then(()=>toast('Receipt copied to clipboard')).catch(()=>toast('Share not supported'));
  }
}

function undoLastTransaction() {
  if (!lastTransaction) { toast('Nothing to undo'); return; }
  if (!confirm('Undo last transaction?')) return;
  const t = DB.comps.pop();
  if (t) {
    DB.stats.transactions = Math.max(0, DB.stats.transactions-1);
    DB.stats.revenue = Math.max(0, DB.stats.revenue - t.total);
    DB.stats.totalKg = Math.max(0, DB.stats.totalKg - t.weight);
    if (DB.stats.routeCounts[t.route]) DB.stats.routeCounts[t.route] = Math.max(0, DB.stats.routeCounts[t.route]-1);
    saveDB(); buildDashboard(); updateDrawerBadges();
    toast('Last transaction undone');
  }
  lastTransaction = null;
}

function downloadReceipt() {
  if (!lastReceiptText) return toast('Compute a receipt first');
  const blob = new Blob([lastReceiptText], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `ocean_receipt_${receiptFileStamp()}.txt`; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1200);
}
function downloadReceiptPDF() {
  if (!lastReceiptText) return toast('Compute a receipt first');
  const pdf = buildReceiptPDF(lastReceiptText);
  const blob = new Blob([pdf], {type:'application/pdf'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `ocean_baggage_receipt_${receiptFileStamp()}.pdf`; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1200);
}
function printReceiptPDF() {
  const receipt = $('receipt'); if(!receipt||!lastReceiptText) return toast('Compute a receipt first');
  const win = window.open('','_blank','width=420,height=640');
  if (!win) return toast('Popup blocked. Use Download PDF instead.');
  win.document.write(`<!doctype html><html><head><title>Ocean Fast Ferries Receipt</title><style>body{font-family:Courier New,monospace;padding:20px;color:#111}.receipt{border:1px solid #111;padding:16px;max-width:360px;margin:auto}.receipt-actions,.receipt-download-btn{display:none!important}@media print{button{display:none}}</style></head><body><div class="receipt">${receipt.innerHTML}</div><script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body></html>`);
  win.document.close();
}
function cashierAdjust() {
  const p = getCalcParams();
  if (p.mode==='fragile') {
    let w = p.weight; if(w<=0){toast('Enter weight first');return;}
    for (let testW=Math.floor(w)-1;testW>=0;testW--) {
      let slab=slabCost(testW,DB.slabs[p.route].fragile); let tot=slab.total;
      if(Math.abs(tot%1)<.001&&tot>0){$('weight').value=testW;compute();toast(`Adjusted to ${testW}kg → ${fmtPHP(tot)}`);return;}
    }
    toast('No whole-peso total found for Fragile'); return;
  }
  const free=DB.freeAllowance[p.cls]*p.pax; let excess=p.weight-free;
  if(excess<=0){toast('No excess to adjust');return;}
  for(let e=Math.floor(excess)-1;e>=0;e--){
    let testW=e+free; let E=e/p.pax; let slab=slabCost(E,DB.slabs[p.route].normal);
    let tot=slab.total*p.pax; if(Math.abs(tot%1)<.001){$('weight').value=testW;compute();toast(`Adjusted to ${testW}kg → ${fmtPHP(tot)}`);return;}
  }
  toast('No whole-peso total found');
}

function updateWeightSuggestion() {
  const el = $('weightSuggest'); if(!el) return;
  const weight = Number($('weight')?.value||0);
  const mode = $('calcMode')?.value||'normal';
  const s = suggestWeightCategory(weight,mode);
  if(!s||weight<=0){el.innerHTML='';el.style.display='none';return;}
  el.style.display='flex';
  el.innerHTML=`<span style="font-size:1.1rem">${s.icon}</span><div><b style="color:var(--accent2)">${s.label}</b><br><small style="color:var(--text3)">${s.tip}</small></div>`;
}

// ── Fares View ──
function buildFares() {
  $('view-fares').innerHTML = `<div class="card glow"><div class="card-header">💰 Passenger Fares</div>
    <select id="fareRoute" onchange="renderFareTable()">${CEBU_BAGGAGE_ROUTES.map(r=>`<option value="${r}">${routeName(r)}</option>`).join('')}</select>
    <div id="fareTable" style="margin-top:8px"></div>
    <div class="fare-ref-table" id="fareRefTable"></div>
  </div><div class="card"><div class="card-header">📦 Slab Rates (per kg)</div><div id="slabDisplay"></div></div>`;
  renderFareTable(); renderSlabDisplay();
}
function renderFareTable() {
  const key=$('fareRoute')?.value, data=getPassengerFare(key); if(!data) return;
  const rows=FARE_CLASSES.map(cls=>`<tr><td>${FARE_CLASS_LABELS[cls]||cls}</td><td style="text-align:right;font-weight:600">${data[cls]!=null?fmtPHP(Number(data[cls])):'—'}</td></tr>`).join('');
  $('fareTable').innerHTML=`<table>${rows}</table>${fareBreakdownHtml(key)}`;
  const refRows=CEBU_BAGGAGE_ROUTES.map(k=>{const f=getPassengerFare(k);return f?`<tr><td>${routeName(k)}</td><td style="text-align:right">${fmtPHP(Number(f['TC/OA']||0))}</td><td style="text-align:right">${fmtPHP(Number(f['BC']||0))}</td></tr>`:''}).join('');
  const refEl=$('fareRefTable');if(refEl)refEl.innerHTML=`<div style="margin-top:12px;font-weight:700;font-size:.82rem">All Routes Quick Reference</div><table style="margin-top:6px"><tr><th>Route</th><th style="text-align:right">Tourist</th><th style="text-align:right">Business</th></tr>${refRows}</table>`;
}
function renderSlabDisplay() {
  const el=$('slabDisplay');if(!el)return;
  el.innerHTML=CEBU_BAGGAGE_ROUTES.map(k=>{
    const n=DB.slabs[k]?.normal||[0,0,0],f=DB.slabs[k]?.fragile||[0,0,0];
    return `<div style="padding:6px 0;border-bottom:1px solid var(--border)"><b style="color:var(--accent)">${routeName(k)}</b>
      <div style="font-size:.75rem;color:var(--text2)">Normal: ₱${n[0]}/₱${n[1]}/₱${n[2]} per kg (Tiers 1/2/3)</div>
      <div style="font-size:.75rem;color:var(--text2)">Fragile: ₱${f[0]}/₱${f[1]}/₱${f[2]} per kg</div></div>`;
  }).join('');
}

// ── Schedules View ──
function buildSchedules() {
  const keys = Object.keys(DB.schedules||{});
  $('view-schedules').innerHTML = `
    <div class="search-bar"><input id="schedSearch" placeholder="Search route, vessel..." oninput="filterSchedules()"></div>
    <div id="schedList"></div>`;
  filterSchedules();
}
function filterSchedules() {
  const q = ($('schedSearch')?.value||'').toLowerCase();
  const keys = Object.keys(DB.schedules||{}).filter(k => !q || (DB.schedules[k].title||'').toLowerCase().includes(q) || k.includes(q));
  const list = $('schedList'); if(!list) return;
  list.innerHTML = keys.map(k => {
    const sc = DB.schedules[k];
    return `<div class="card"><div class="card-header">${sc.title}</div>
      <div style="font-size:.72rem;color:var(--text2);margin-bottom:8px">Travel: ${sc.travel}</div>
      <table><tr><th>Depart</th><th>Vessel</th><th>Arrive</th><th>Notes</th></tr>
      ${(sc.trips||[]).map(t=>`<tr><td>${t.dep}</td><td>${t.vessel}</td><td>${t.arr||'—'}</td><td style="font-size:.7rem;color:var(--text3)">${t.remarks||''}</td></tr>`).join('')}
      </table></div>`;
  }).join('');
}

// ── History View (V300: with search + CSV export, no duplicate data) ──
function buildHistory() {
  $('view-history').innerHTML = `
    <div class="card">
      <div class="card-header" style="justify-content:space-between"><span>📋 Transaction History</span>
        <button class="sm" onclick="exportHistoryCSV()">📥 CSV</button>
      </div>
      <div class="search-bar"><input id="histSearch" placeholder="Search route, date, amount..." oninput="filterHistory()"></div>
      <div id="histList"></div>
      ${currentRole==='supervisor'?`<button class="danger block" style="margin-top:10px" onclick="clearHistory()">🗑️ Clear All History</button>`:''}
    </div>`;
  filterHistory();
}
function filterHistory() {
  const q = ($('histSearch')?.value||'').toLowerCase();
  const txs = (DB.comps||[]).slice().reverse().filter(c =>
    !q || (c.route||'').toLowerCase().includes(q) || (c.time||'').includes(q) || fmtPHP(c.total).includes(q) || String(c.mode).includes(q)
  );
  const list = $('histList'); if(!list) return;
  list.innerHTML = txs.length ? txs.map((c,i) => `
    <div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:.8rem">
      <div style="display:flex;justify-content:space-between"><span style="color:var(--accent);font-weight:600">${routeName(c.route)}</span><b>${fmtPHP(c.total)}</b></div>
      <div style="color:var(--text3);font-size:.7rem">${c.mode} | ${c.pax||1}pax | ${c.weight}kg | ${(c.time||'').slice(0,16).replace('T',' ')}</div>
    </div>
  `).join('') : '<p style="color:var(--text3);padding:8px 0">No matching transactions</p>';
}
function exportHistoryCSV() {
  const rows = [['Date','Route','Mode','Class','Pax','Weight(kg)','Total(PHP)']];
  (DB.comps||[]).forEach(c => {
    rows.push([(c.time||'').slice(0,16).replace('T',' '), routeName(c.route), c.mode, c.cls||'', c.pax||1, c.weight, c.total]);
  });
  exportCSV(rows, `ocean_history_${receiptFileStamp()}.csv`);
  toast('CSV exported ✓');
}
function clearHistory() {
  if (!confirm('Clear ALL transaction history? This cannot be undone.')) return;
  DB.comps = []; DB.stats = {transactions:0,revenue:0,totalKg:0,topRoute:'',routeCounts:{}};
  saveDB(); buildHistory(); buildDashboard(); updateDrawerBadges();
  toast('History cleared');
}

// ── Analytics View (V300: NEW — Chart.js powered) ──
function buildAnalytics() {
  const today = new Date().toISOString().slice(0,10);
  const txs = DB.comps || [];

  $('view-analytics').innerHTML = `
    <div class="card glow">
      <div class="card-header">📊 Revenue Analytics</div>
      <div class="chart-card"><canvas id="chartRevenue"></canvas></div>
    </div>
    <div class="card">
      <div class="card-header">🥧 Route Breakdown</div>
      <div class="chart-card"><canvas id="chartRoutes"></canvas></div>
    </div>
    <div class="card">
      <div class="card-header">⚖️ Weight Distribution</div>
      <div class="chart-card"><canvas id="chartWeight"></canvas></div>
    </div>
    <button class="accent block" onclick="exportAnalyticsCSV()">📥 Export Analytics CSV</button>
  `;

  // Wait for DOM to render canvases
  setTimeout(() => renderAnalyticsCharts(txs, today), 100);
}

function renderAnalyticsCharts(txs, today) {
  if (typeof Chart === 'undefined') {
    const fallback = '<div style="color:var(--text3);font-size:.85rem;padding:20px;text-align:center">Charts require internet connection (Chart.js CDN). Data is still tracked locally.</div>';
    const c1=$('chartRevenue'); if(c1) c1.parentNode.innerHTML = fallback;
    return;
  }

  // Revenue by day (last 7 days)
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0,10));
  }
  const revByDay = days.map(d => txs.filter(c => c.time && c.time.slice(0,10) === d).reduce((a,c) => a + Number(c.total||0), 0));
  const dayLabels = days.map(d => { const dt = new Date(d); return dt.toLocaleDateString('en-PH',{weekday:'short',day:'numeric'}); });

  const commonOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#9da4c0', font: { size: 11 } } } },
    scales: { x: { ticks: { color: '#5d6380' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#5d6380' }, grid: { color: 'rgba(255,255,255,0.05)' } } }
  };

  // Revenue Line Chart
  const ctx1 = $('chartRevenue')?.getContext('2d');
  if (ctx1) new Chart(ctx1, {
    type: 'line',
    data: { labels: dayLabels, datasets: [{ label: 'Revenue (₱)', data: revByDay, borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.15)', fill: true, tension: 0.3 }] },
    options: { ...commonOpts, plugins: { ...commonOpts.plugins, legend: { display: false } } }
  });

  // Route Pie Chart
  const routeCounts = {};
  txs.forEach(c => { if(c.route) routeCounts[c.route] = (routeCounts[c.route]||0) + 1; });
  const routeLabels = Object.keys(routeCounts).map(k => routeName(k));
  const routeData = Object.values(routeCounts);
  const pieColors = ['#f43f5e','#fb923c','#22d3ee','#a855f7','#22c55e','#eab308','#3b82f6','#ec4899'];

  const ctx2 = $('chartRoutes')?.getContext('2d');
  if (ctx2) new Chart(ctx2, {
    type: 'doughnut',
    data: { labels: routeLabels, datasets: [{ data: routeData, backgroundColor: pieColors.slice(0,routeLabels.length) }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#9da4c0', font: { size: 10 }, padding: 12 } } } }
  });

  // Weight Distribution Bar Chart
  const weightBuckets = { '0-10kg':0, '11-20kg':0, '21-40kg':0, '41+kg':0 };
  txs.forEach(c => {
    const w = Number(c.weight||0);
    if (w <= 10) weightBuckets['0-10kg']++;
    else if (w <= 20) weightBuckets['11-20kg']++;
    else if (w <= 40) weightBuckets['21-40kg']++;
    else weightBuckets['41+kg']++;
  });

  const ctx3 = $('chartWeight')?.getContext('2d');
  if (ctx3) new Chart(ctx3, {
    type: 'bar',
    data: { labels: Object.keys(weightBuckets), datasets: [{ label: 'Transactions', data: Object.values(weightBuckets), backgroundColor: ['#22c55e','#eab308','#fb923c','#ef4444'] }] },
    options: { ...commonOpts, plugins: { ...commonOpts.plugins, legend: { display: false } } }
  });
}

function exportAnalyticsCSV() {
  const txs = DB.comps || [];
  const rows = [['Date','Route','Mode','Class','Pax','Weight(kg)','Total(PHP)','Hour']];
  txs.forEach(c => {
    const hour = c.time ? new Date(c.time).getHours() : '';
    rows.push([(c.time||'').slice(0,10), routeName(c.route), c.mode, c.cls||'', c.pax||1, c.weight, c.total, hour]);
  });
  exportCSV(rows, `ocean_analytics_${receiptFileStamp()}.csv`);
  toast('Analytics CSV exported ✓');
}

// ── Admin View ──
function buildAdmin() {
  $('view-admin').innerHTML = `
    <div class="card"><div class="card-header">🔒 Admin Panel</div>
      <div style="font-size:.8rem;color:var(--text2);margin-bottom:12px">Role: <b>${currentRole}</b></div>
      ${currentRole==='supervisor'?`
        <div class="input-group"><label>Change Cashier Username</label><input id="adminCashierU" value="${DB.creds.cashier.u}"></div>
        <div class="input-group"><label>Change Cashier Password</label><input id="adminCashierP" value="${DB.creds.cashier.p}"></div>
        <button class="primary block" onclick="saveCreds()">Save Credentials</button>
        <div style="margin-top:16px"></div>
        <div class="input-group"><label>AI API Key (Gemini)</label><input id="adminApiKey" value="${DB.aiSettings.apiKey||''}" placeholder="Enter Gemini API key"></div>
        <button class="accent block" onclick="saveApiKey()">Save API Key</button>
      `:`<div style="color:var(--text3);font-size:.82rem">Supervisor access required to modify settings.</div>`}
    </div>
    <div class="card"><div class="card-header">💾 Data Management</div>
      <div class="grid2">
        <button class="accent block" onclick="exportDatabase()">📤 Export JSON</button>
        <button class="accent block" onclick="importDatabasePrompt()">📥 Import JSON</button>
      </div>
      <div style="margin-top:8px;font-size:.72rem;color:var(--text3)">Transactions: ${DB.comps?.length||0} | DB Size: ${Math.round(JSON.stringify(DB).length/1024)}KB</div>
    </div>`;
}
function saveCreds() {
  const u=$('adminCashierU')?.value?.trim(), p=$('adminCashierP')?.value?.trim();
  if(u) DB.creds.cashier.u=u; if(p) DB.creds.cashier.p=p;
  saveDB(); toast('Credentials saved ✓');
}
function saveApiKey() {
  const k=$('adminApiKey')?.value?.trim();
  DB.aiSettings.apiKey=k||''; saveDB(); toast('API key saved ✓');
}
function exportDatabase() {
  const blob=new Blob([JSON.stringify(DB,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`ocean_db_backup_${receiptFileStamp()}.json`;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1200);toast('Database exported ✓');
}
function importDatabasePrompt() {
  const input=document.createElement('input');input.type='file';input.accept='.json';
  input.onchange=e=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();r.onload=ev=>{
      try{const data=JSON.parse(ev.target.result);Object.assign(DB,data);saveDB();toast('Database imported ✓');buildAdmin();}
      catch(err){toast('Invalid JSON file');}
    };r.readAsText(f);
  };input.click();
}

// ── Drawer Badges ──
function updateDrawerBadges() {
  const txs = DB.comps || [];
  const today = new Date().toISOString().slice(0,10);
  const todayTx = txs.filter(c => c.time && c.time.slice(0,10) === today);
  const histItem = document.querySelector('.drawer-item[data-view="history"]');
  if (histItem) {
    let badge = histItem.querySelector('.txn-badge');
    if (!badge && todayTx.length > 0) {
      badge = document.createElement('span'); badge.className = 'txn-badge';
      histItem.style.position = 'relative'; histItem.appendChild(badge);
    }
    if (badge) {
      badge.textContent = todayTx.length > 99 ? '99+' : todayTx.length;
      badge.classList.toggle('show', todayTx.length > 0);
    }
  }
}

// ── Tally Counter ──
const TALLY_KEY = 'off_tally_v300';
let tallyCount = 0;
try { const s = localStorage.getItem(TALLY_KEY); if(s) tallyCount = JSON.parse(s).count||0; } catch(e) {}
function saveTally() { try { localStorage.setItem(TALLY_KEY, JSON.stringify({count:tallyCount})); } catch(e) {} }
function showTally() {
  if ($('tallyOverlay')) return;
  const today = new Date().toLocaleDateString('en-PH',{weekday:'short',month:'short',day:'numeric'});
  const ov = document.createElement('div'); ov.id='tallyOverlay'; ov.className='tally-overlay';
  ov.innerHTML = `<div class="tally-title">🚃 Passenger Tally</div><div class="tally-vessel">${today} • Tap + to count</div>
    <div class="tally-num" id="tallyNum">${String(tallyCount).padStart(3,'0')}</div>
    <div class="tally-btns"><button class="tally-btn minus" id="tallyMinus">−</button><button class="tally-btn plus" id="tallyPlus">+</button></div>
    <div class="tally-actions"><button onclick="closeTally()">← Close</button><button class="tally-reset" onclick="resetTally()">Reset to 0</button></div>`;
  document.body.appendChild(ov);
  $('tallyPlus').onclick = () => { tallyCount++; saveTally(); const n=$('tallyNum'); if(n){n.textContent=String(tallyCount).padStart(3,'0');n.classList.add('bump');setTimeout(()=>n.classList.remove('bump'),80);} };
  $('tallyMinus').onclick = () => { if(tallyCount<=0)return; tallyCount--; saveTally(); const n=$('tallyNum'); if(n)n.textContent=String(tallyCount).padStart(3,'0'); };
}
function closeTally() { const o=$('tallyOverlay'); if(o)o.remove(); }
function resetTally() { tallyCount=0; saveTally(); const n=$('tallyNum'); if(n)n.textContent='000'; toast('Tally reset'); }

// ── Fare Lookup Panel ──
function openFarePanel() {
  if ($('farePanel')) return;
  const ov = document.createElement('div'); ov.className='fare-panel'; ov.id='farePanel';
  ov.innerHTML = `<div class="fare-title">💰 Quick Fare Lookup</div>
    <div class="fare-header"><input class="fare-search" id="fareSearchInput" placeholder="🔍 Search route..." oninput="filterFareItems(this.value)"><button class="fare-close" onclick="closeFarePanel()">✕</button></div>
    <div class="fare-grid" id="fareGrid">${buildFareItems('')}</div>`;
  document.body.appendChild(ov);
  setTimeout(()=>{const s=$('fareSearchInput');if(s)s.focus();},150);
}
function closeFarePanel() { const p=$('farePanel'); if(p)p.remove(); }
function filterFareItems(v) { const g=$('fareGrid'); if(g)g.innerHTML=buildFareItems(v); }
function buildFareItems(search) {
  const term=(search||'').toLowerCase();
  return CEBU_BAGGAGE_ROUTES.filter(k=>!term||routeName(k).toLowerCase().includes(term)||k.includes(term)).map(k=>{
    const f=getPassengerFare(k)||{};
    return `<div class="fare-item"><div class="fare-item-route">${routeName(k)}</div>
      <div class="fare-item-prices">${['TC/OA','BC','ST','MI'].map((c,i)=>`<div class="fare-item-cell"><div class="v">${fmtPHP(Number(f[c]||0))}</div><div class="k">${['Tourist','Biz','Student','Minor'][i]}</div></div>`).join('')}</div>
      <button class="fare-calc-btn" onclick="goCalcFromFare('${k}')">Use in Calculator →</button></div>`;
  }).join('') || '<div style="color:#8fa3c8;font-size:.78rem;padding:10px">No routes found</div>';
}
function goCalcFromFare(route) {
  closeFarePanel(); navigate('calculator');
  setTimeout(()=>{if($('calcRoute'))$('calcRoute').value=route;updateAllowBar();toast('Route set: '+routeName(route));},120);
}

// ── Shift Timer ──
const SHIFT_KEY = 'off_shift_v300';
function loadShiftState() { try { const s=localStorage.getItem(SHIFT_KEY); return s?JSON.parse(s):null; } catch(e) { return null; } }
function saveShiftState(state) { try { localStorage.setItem(SHIFT_KEY,JSON.stringify(state)); } catch(e) {} }
function getShiftElapsed() { const state=loadShiftState(); if(!state||!state.startTime) return 0; return Math.floor((Date.now()-state.startTime)/1000); }
function hms(sec) { const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60; return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'); }

function showShiftTimer() {
  if ($('timerOverlay')) return;
  const state=loadShiftState(), running=!!(state&&state.startTime);
  const todayTx=(DB.comps||[]).filter(c=>c.time&&c.time.slice(0,10)===new Date().toISOString().slice(0,10));
  const rev=todayTx.reduce((a,c)=>a+Number(c.total||0),0);
  const elapsed=running?getShiftElapsed():0;
  const startStr=running?new Date(state.startTime).toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'}):'--:--';
  const ov=document.createElement('div'); ov.id='timerOverlay'; ov.className='timer-overlay';
  ov.innerHTML=`<div class="timer-card"><div class="timer-label">${running?'● Live Shift Timer':'Shift Timer'}</div>
    <div class="timer-hms" id="shiftHMS">${running?hms(elapsed):'00:00:00'}</div>
    <div class="timer-meta"><b>Started:</b> ${startStr}<br><b>Transactions:</b> ${todayTx.length} today<br><b>Revenue:</b> ${fmtPHP(rev)} today</div>
    <div class="timer-actions">${running
      ?'<button class="timer-stop" onclick="stopShift()">⏹ End Shift</button>'
      :'<button class="timer-start" onclick="startShift()">▶ Start Shift</button>'}
      <button class="timer-close" onclick="this.closest(\'.timer-overlay\').remove()">← Close</button></div></div>`;
  ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
  document.body.appendChild(ov);
}
window.startShift=()=>{saveShiftState({startTime:Date.now()});const o=$('timerOverlay');if(o)o.remove();toast('▶ Shift started!');};
window.stopShift=()=>{const elapsed=getShiftElapsed();saveShiftState(null);const o=$('timerOverlay');if(o)o.remove();toast('⏹ Shift ended — '+hms(elapsed)+' on duty');};

// ── Header Clock ──
function tickHeaderClock() {
  const clk=$('headerClock'); if(!clk) return;
  const d=new Date(); const h=d.getHours(),m=d.getMinutes(),s=d.getSeconds();
  const ap=h>=12?'PM':'AM'; const hh=h%12||12;
  const state=loadShiftState();
  if(state&&state.startTime){
    const elapsed=Math.floor((Date.now()-state.startTime)/1000);
    clk.textContent=hms(elapsed)+' ●';clk.classList.add('shift-active');
  } else {
    clk.textContent=String(hh).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+' '+ap;
    clk.classList.remove('shift-active');
  }
  const disp=$('shiftHMS');
  if(disp&&state&&state.startTime){disp.textContent=hms(Math.floor((Date.now()-state.startTime)/1000));}
}
setInterval(tickHeaderClock,1000); tickHeaderClock();

// ── Offline Status ──
function updateOfflineStatus() {
  const badge=$('offlineBadge'); if(!badge) return;
  badge.classList.toggle('show', !navigator.onLine);
}
window.addEventListener('online', updateOfflineStatus);
window.addEventListener('offline', updateOfflineStatus);
setTimeout(updateOfflineStatus, 1000);

// ── Departure Alerts ──
let _alertDismissed=false, _lastAlertKey='';
function checkDepartures() {
  const now=new Date(); const nowMin=now.getHours()*60+now.getMinutes();
  const alerts=[];
  Object.keys(DB.schedules||{}).forEach(k=>{
    if(!/^cebu_/.test(k)) return;
    (DB.schedules[k].trips||[]).forEach(t=>{
      const m=String(t.dep).trim().match(/(\d{1,2}):(\d{2})\s*([AP]M)?/i); if(!m)return;
      let h=+m[1],mn=+m[2],ap=(m[3]||'').toUpperCase();
      if(ap==='PM'&&h!==12)h+=12; if(ap==='AM'&&h===12)h=0;
      const depMin=h*60+mn; let eta=depMin-nowMin; if(eta<-45)eta+=1440;
      if(eta>0&&eta<=20) alerts.push({vessel:t.vessel||'Vessel',route:routeName(k),eta,dep:t.dep});
    });
  });
  const badge=$('alertBadge'); if(!badge) return;
  if(!alerts.length){badge.classList.remove('show');_alertDismissed=false;return;}
  const top=alerts.sort((a,b)=>a.eta-b.eta)[0];
  const key=top.vessel+top.dep;
  if(key===_lastAlertKey&&_alertDismissed)return;
  if(key!==_lastAlertKey){_alertDismissed=false;_lastAlertKey=key;}
  badge.querySelector('.alert-text').textContent=`⚠️ ${top.vessel} → ${top.route} departs in ${top.eta}m`;
  badge.classList.add('show');
}
$('alertBadge').onclick=()=>{_alertDismissed=true;$('alertBadge').classList.remove('show');};
setInterval(checkDepartures,60000); setTimeout(checkDepartures,2000);

// ── Dynamic Background ──
function updateDynamicBackground() {
  const h=new Date().getHours(); let bg='#070b19';
  if(h>=5&&h<8) bg='#1a0f2e'; else if(h>=8&&h<17) bg='#0a1f3a'; else if(h>=17&&h<19) bg='#2e1a0f';
  document.documentElement.style.setProperty('--bg-base',bg);
}
updateDynamicBackground(); setInterval(updateDynamicBackground,60000);

// ── Touch Swipe for Drawer ──
let touchStartX=0;
document.addEventListener('touchstart',e=>{touchStartX=e.touches[0].clientX});
document.addEventListener('touchend',e=>{const diff=e.changedTouches[0].clientX-touchStartX;if(touchStartX<50&&diff>80)toggleDrawer();if(touchStartX>200&&diff<-80)closeDrawer()});

// ── Keyboard Shortcuts ──
document.addEventListener('keydown',e=>{
  if(e.ctrlKey&&e.shiftKey&&e.key==='E') exportDatabase();
  if(e.ctrlKey&&e.shiftKey&&e.key==='I'){e.preventDefault();importDatabasePrompt();}
});

// ── Haptic on Buttons ──
document.addEventListener('click',e=>{
  const btn=e.target.closest('button,.drawer-item,.tally-btn,.hamburger');
  if(btn) haptic(btn.classList.contains('primary')?[18]:[8]);
},{passive:true});

// ── AI Chat ──
function toggleChat() {
  const panel=$('chatPanel');
  if(!panel)return;
  panel.classList.toggle('open');
  if(panel.classList.contains('open')&&$('chatInput'))$('chatInput').focus();
}
function sendAIChat() {
  const input=$('chatInput'); if(!input)return;
  const msg=input.value.trim(); if(!msg)return;
  input.value='';
  const body=$('chatBody');
  body.innerHTML+=`<div class="chat-bubble user">${msg.replace(/</g,'&lt;')}</div>`;
  body.innerHTML+=`<div class="loading-dot" id="chatLoading"><span></span><span></span><span></span></div>`;
  body.scrollTop=body.scrollHeight;

  chatContext.push({role:'user',parts:[{text:msg}]});
  if(chatContext.length>12) chatContext=chatContext.slice(-12);

  const apiKey=DB.aiSettings?.apiKey;
  if(!apiKey){
    setTimeout(()=>{
      const ld=$('chatLoading');if(ld)ld.remove();
      body.innerHTML+=`<div class="chat-bubble bot">I need a Gemini API key to respond. Ask your supervisor to add one in Admin panel. For now, I can help with built-in info about Ocean Fast Ferries routes, fares, and schedules.</div>`;
      body.scrollTop=body.scrollHeight;
    },500);
    return;
  }
  const model=DB.aiSettings.model||'gemini-2.0-flash';
  fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({contents:chatContext,systemInstruction:{parts:[{text:'You are the Ocean Fast Ferries Baggage Pro AI assistant. Help with baggage fees, routes, schedules, fares, and operational questions. Be concise and professional. Routes: Cebu-Tagbilaran, Cebu-Ormoc, Cebu-Getafe, Cebu-Palompon, Cebu-Maasin, Cebu-Dumaguete (via Tagbilaran), Cebu-Surigao (via Maasin), Cebu-Siquijor (via Tagbilaran). Slab rates apply for excess baggage.'}]}})
  }).then(r=>r.json()).then(data=>{
    const ld=$('chatLoading');if(ld)ld.remove();
    const text=data?.candidates?.[0]?.content?.parts?.[0]?.text||'Sorry, I could not generate a response.';
    body.innerHTML+=`<div class="chat-bubble bot">${text.replace(/</g,'&lt;')}</div>`;
    chatContext.push({role:'model',parts:[{text}]});
    body.scrollTop=body.scrollHeight;
  }).catch(err=>{
    const ld=$('chatLoading');if(ld)ld.remove();
    body.innerHTML+=`<div class="chat-bubble bot">Connection error. Please try again.</div>`;
    body.scrollTop=body.scrollHeight;
  });
}

// ── Voice Commands ──
function startVoice() {
  if(!('webkitSpeechRecognition' in window)&&!('SpeechRecognition' in window)) return toast('Voice not supported');
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const recognition=new Recognition(); recognition.lang='en-US'; recognition.interimResults=false;
  recognition.onresult=e=>{
    const transcript=e.results[0][0].transcript.toLowerCase().trim();
    const routes=['tagbilaran','ormoc','getafe','palompon','maasin','dumaguete','surigao','siquijor'];
    const routeMatch=routes.find(r=>transcript.includes(r));
    if(routeMatch&&$('calcRoute')){$('calcRoute').value='cebu_'+routeMatch;updateAllowBar();haptic([20]);toast('🎤 Route set: '+titleCase(routeMatch));return;}
    const weightMatch=transcript.match(/(\d+)\s*(kg|kilo|kilograms?)/);
    if(weightMatch&&$('weight')){$('weight').value=weightMatch[1];updateAllowBar();updateWeightSuggestion();haptic([20]);toast('🎤 Weight set: '+weightMatch[1]+'kg');return;}
    const paxMatch=transcript.match(/(\d+)\s*(pax|passengers?|people)/);
    if(paxMatch&&$('pax')){$('pax').value=paxMatch[1];updateAllowBar();haptic([20]);toast('🎤 Passengers set: '+paxMatch[1]);return;}
    if(transcript.includes('compute')||transcript.includes('calculate')){compute();haptic([25]);return;}
    if($('chatInput')){$('chatInput').value=transcript;sendAIChat();}
  };
  recognition.onerror=()=>toast('Voice recognition failed');
  recognition.start(); toast('🎤 Listening...');
}

// ── Service Worker ──
if('serviceWorker' in navigator){
  const SW_CODE=`
    const CACHE='off-v300b-cache';
    const ASSETS=['/','/index.html','/styles.css','/app.js','/data.js','/utils.js','/map.js','/manifest.json'];
    self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));self.skipWaiting();});
    self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
    self.addEventListener('fetch',e=>{
      if(e.request.method!=='GET')return;
      const url=new URL(e.request.url);
      const isAppAsset=url.pathname.endsWith('.js')||url.pathname.endsWith('.css')||url.pathname.endsWith('.html')||url.pathname==='/';
      if(isAppAsset){
        e.respondWith(fetch(e.request).then(res=>{
          if(res.ok){const cl=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));}
          return res;
        }).catch(()=>caches.match(e.request).then(r=>r||caches.match('/index.html'))));
      }else{
        e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
          if(res.ok){const cl=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));}return res;
        }).catch(()=>caches.match('/index.html'))));
      }
    });`;
  const blob=new Blob([SW_CODE],{type:'application/javascript'});
  navigator.serviceWorker.register(URL.createObjectURL(blob)).then(()=>console.log('SW registered')).catch(()=>{});
}
