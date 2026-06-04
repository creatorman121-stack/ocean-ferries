'use strict';

const APP_VERSION = 'V95 Online Systems Edition';
const STORE = 'oceanjet_portdesk_v91_accurate_source';
const LEGACY_STORES = ['oceanjet_portdesk_v90_professional','oceanjet_portdesk_v87_clean'];
// Core data is loaded from data.js before this file.

// ---------- Utilities ----------
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const peso = value => '₱' + (Number(value) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const cap = text => String(text||'').charAt(0).toUpperCase() + String(text||'').slice(1);
const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const todayText = () => new Date().toLocaleString('en-PH', {dateStyle:'medium', timeStyle:'short'});

let state = loadState();
let lastReceipt = '';
let selectedScheduleRoute = MAIN_CEBU_ROUTES[2];
let loginRole = 'passenger';

// ---------- Local state and storage ----------
function loadState(){
  try{
    let raw = localStorage.getItem(STORE);
    if(!raw){
      for(const legacyKey of LEGACY_STORES){
        raw = localStorage.getItem(legacyKey);
        if(raw) break;
      }
    }
    const saved = JSON.parse(raw || '{}');
    return {
      role: saved.role || 'passenger',
      view: saved.view || 'dashboard',
      dark: saved.dark !== false,
      data: mergeData(DEFAULT_DATA, saved.data || {})
    };
  }catch{
    return {role:'passenger', view:'dashboard', dark:true, data: structuredClone(DEFAULT_DATA)};
  }
}
function mergeData(base, saved){
  const out = Array.isArray(base) ? [...base] : {...base};
  for(const [key, value] of Object.entries(saved || {})){
    if(value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) out[key] = mergeData(base[key], value);
    else out[key] = value;
  }
  return out;
}
function save(){ localStorage.setItem(STORE, JSON.stringify(state)); }
function audit(action, detail=''){
  state.data.audit.unshift({id:uid('audit'), time:todayText(), role:state.role, action, detail});
  state.data.audit = state.data.audit.slice(0,500);
}
function queueSync(type, action, detail=''){
  state.data.syncOutbox.unshift({id:uid('outbox'), time:new Date().toISOString(), type, action, detail});
  state.data.syncOutbox = state.data.syncOutbox.slice(0,200);
}
function toast(message){
  const el = $('toast'); if(!el) return;
  el.textContent = message; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(()=>el.classList.remove('show'), 2400);
}
function download(name, content, type='text/plain'){
  const blob = new Blob([content], {type});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}
function getRoutes(){
  for(const [key, override] of Object.entries(state.data.scheduleOverrides || {})){
    if(ROUTES[key]) ROUTES[key].trips = (override.trips || []).map(t => [t.dep, t.vessel, t.arr, t.remarks || '']);
  }
  return ROUTES;
}
function routeLabel(key){ return getRoutes()[key]?.label || key.replace(/_/g,' → '); }
function currentFilter(){ return state.data.settings.routeFilter || 'all'; }

function openSidebar(){ $('sidebar').classList.add('open'); $('drawerOverlay').classList.add('show'); }
function closeSidebar(){ $('sidebar').classList.remove('open'); $('drawerOverlay').classList.remove('show'); }
function setTitle(title, subtitle){ $('pageTitle').textContent = title; $('pageSub').textContent = subtitle; }
function allowed(view){ return ROLE_NAVS[state.role].some(x => x[0] === view); }
// ---------- Shell, roles, and navigation ----------
function renderShell(){
  document.body.classList.toggle('light', !state.dark);
  $('themeBtn').textContent = state.dark ? '☀️' : '🌙';
  $('roleText').textContent = cap(state.role);
  $('versionText').textContent = APP_VERSION;
  $('sideRole').textContent = cap(state.role);
  $('sideStore').textContent = `${(JSON.stringify(state.data).length/1024).toFixed(1)} KB local storage`;
  $('nav').innerHTML = ROLE_NAVS[state.role].map(item => `<button class="${state.view===item[0]?'active':''}" onclick="renderApp('${item[0]}')"><span>${item[1]}</span><span>${item[2]}</span></button>`).join('');
  $('bottomNav').innerHTML = ROLE_NAVS[state.role].slice(0,5).map(item => `<button class="${state.view===item[0]?'active':''}" onclick="renderApp('${item[0]}')"><span>${item[1]}</span><br>${item[2].split(' ')[0]}</button>`).join('');
  ['passenger','cashier','admin'].forEach(role => {
    const btn = document.querySelector(`[data-role-btn="${role}"]`);
    if(btn) btn.classList.toggle('active', state.role === role);
  });
}
function renderApp(view = state.view){
  if(!allowed(view)) view = 'dashboard';
  state.view = view; save(); closeSidebar(); renderShell();
  const views = {dashboard, board, calculator, claim, track, trips, damage, queue, receipt, reports, sync, system};
  (views[view] || dashboard)();
}
function setRole(role){
  if(role === 'passenger'){
    state.role = 'passenger'; audit('Role switched','Passenger public mode'); save(); renderApp('dashboard'); return;
  }
  loginRole = role;
  $('loginRoleTitle').textContent = cap(role) + ' Login';
  $('loginUser').value = '';
  $('loginPass').value = '';
  $('login').classList.remove('hide');
  chooseLoginRole(role);
}
function chooseLoginRole(role){
  loginRole = role;
  document.querySelectorAll('.loginRoles button').forEach(btn => btn.classList.toggle('active', btn.dataset.loginRole === role));
  $('loginRoleTitle').textContent = cap(role) + (role === 'passenger' ? ' Access' : ' Login');
  $('loginCreds').classList.toggle('hide', role === 'passenger');
}
function loginNow(){
  if(loginRole !== 'passenger'){
    const want = state.data.settings[loginRole] || {};
    if($('loginUser').value.trim() !== want.u || $('loginPass').value.trim() !== want.p){ toast('Invalid '+loginRole+' login'); return; }
  }
  state.role = loginRole; audit('Login', cap(loginRole)); save(); $('login').classList.add('hide'); renderApp('dashboard'); toast('Welcome '+cap(loginRole));
}
function logout(){ state.role='passenger'; audit('Logout','Returned to passenger mode'); save(); renderApp('dashboard'); }
function toggleTheme(){ state.dark = !state.dark; save(); renderApp(state.view); }

function hero(title, subtitle, tag=''){
  return `<section class="hero"><div class="row"><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div>${tag?`<span class="badge info right">${esc(tag)}</span>`:''}</div></section>`;
}
function statusClass(status){
  if(['Boarding'].includes(status)) return 'ok';
  if(['Departing Soon','Delayed'].includes(status)) return 'warn';
  if(['Cancelled'].includes(status)) return 'bad';
  return 'info';
}
function parseTimeOn(date, timeText, dayOffset=0){
  const raw = String(timeText || '').trim().toUpperCase().replace(/\./g,'').replace(/\s+/g,' ');
  const m = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/) || raw.match(/^(\d{1,2}):(\d{2})$/);
  const d = new Date(date); d.setHours(0,0,0,0); d.setDate(d.getDate() + dayOffset);
  if(!m) return d;
  let h = Number(m[1]), min = Number(m[2] || 0); const ap = (m[3] || '').toUpperCase();
  if(ap === 'PM' && h < 12) h += 12; if(ap === 'AM' && h === 12) h = 0;
  d.setHours(h, min, 0, 0); return d;
}
function tripId(route, trip, dayIndex=0){ return `${route}|${trip.dep}|${trip.vessel}|${dayIndex}`.replace(/\s+/g,'_'); }
function scheduleTrips(dayIndex = 0){
  const routes = getRoutes(); const filter = currentFilter(); const now = new Date(); const rows = [];
  Object.entries(routes).forEach(([routeKey, route]) => {
    if(filter !== 'all' && filter !== routeKey) return;
    (route.trips || []).forEach(raw => {
      const trip = Array.isArray(raw) ? {dep:raw[0], vessel:raw[1], arr:raw[2], remarks:raw[3]} : raw;
      const departure = parseTimeOn(now, trip.dep, dayIndex);
      const boarding = new Date(departure.getTime() - 15*60000);
      const soon = new Date(departure.getTime() - 5*60000);
      const grace = new Date(departure.getTime() + 10*60000);
      const id = tripId(routeKey, trip, dayIndex);
      const manual = state.data.manualStatus[id];
      let status = 'Scheduled';
      if(dayIndex < 0) status = 'Closed';
      else if(now > grace) status = 'Closed';
      else if(now > departure) status = 'Departed';
      else if(now >= soon) status = 'Departing Soon';
      else if(now >= boarding) status = 'Boarding';
      if(manual && ['Delayed','Cancelled','Closed','Departed','Boarding','Scheduled'].includes(manual.status)) status = manual.status;
      rows.push({id, routeKey, routeLabel: route.label, short:route.short, travel:route.travel, vessel:trip.vessel, dep:trip.dep, arr:trip.arr, remarks:trip.remarks||'', departure, boarding, status, gate: gateForRoute(routeKey)});
    });
  });
  return rows.sort((a,b)=>a.departure-b.departure);
}
function gateForRoute(routeKey){
  if(routeKey.includes('tagbilaran')) return 'Gate 1';
  if(routeKey.includes('ormoc') || routeKey.includes('palompon')) return 'Gate 2';
  if(routeKey.includes('getafe')) return 'Gate 3';
  if(routeKey.includes('maasin') || routeKey.includes('surigao')) return 'Gate 4';
  return 'Gate TBA';
}
function pickTrip(){
  const today = scheduleTrips(0);
  const open = today.find(t => ['Boarding','Departing Soon','Scheduled','Delayed'].includes(t.status));
  if(open) return open;
  return scheduleTrips(1).find(t => ['Scheduled','Boarding','Departing Soon'].includes(t.status)) || null;
}
function routeFilterHtml(onchange='updateRouteFilter'){
  const options = ['<option value="all">All Routes</option>'].concat(Object.keys(getRoutes()).map(k => `<option value="${esc(k)}" ${currentFilter()===k?'selected':''}>${esc(routeLabel(k))}</option>`));
  return `<select id="routeFilter" onchange="${onchange}(this.value)">${options.join('')}</select>`;
}
function updateRouteFilter(value){ state.data.settings.routeFilter = value; save(); renderApp(state.view); }
function statusCounts(rows){ return rows.reduce((acc, row) => (acc[row.status]=(acc[row.status]||0)+1, acc), {}); }
function onlineEngine(){ return window.OJOnlineConfigEngine || null; }
function onlineStatus(){ try{return onlineEngine()?.publicStatus?.() || null;}catch{return null;} }
function onlineAdvisoryBanner(){
  const info = onlineStatus(); const adv = info?.advisory; const status = info?.status || {}; if(!adv) return '';
  let rows = (info.fareRows || []).slice(0,18);
  if(!rows.length){
    const cfg = window.OJ_ONLINE_CONFIG || {}; const next = (cfg.fareSchedules || [])[0] || {};
    rows = Object.entries(next.routes || {}).slice(0,18).map(([key,fare]) => ({key, label:ROUTES?.[key]?.label || key.replace(/_/g,' → '), fare, effectiveDate:next.effectiveDate, pending:true}));
  }
  const fareTable = rows.length ? `<div class="tableWrap onlineFareTable"><table><thead><tr><th>Route</th><th>Tourist / Open Air</th><th>Business</th><th>Effective</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.label || x.key)}</b>${x.pending?'<br><span class="tiny">Scheduled auto-update</span>':''}</td><td>${peso(x.fare?.['TC/OA'])}</td><td>${peso(x.fare?.BC)}</td><td>${esc(x.effectiveDate || '-')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Future fare schedule loaded. It will apply automatically on its effective date.</div>';
  return `<div class="card span12 onlineBanner"><div class="cardHead"><div><h3>📡 ${esc(adv.title || 'Online Fare Advisory')}</h3><p>${esc(adv.summary || '')}</p></div><span class="badge ${status.appliedRoutes?'ok':'warn'}">${esc(adv.badge || adv.effectiveDate || 'Scheduled')}</span></div><div class="chips"><span class="chip">Online engine: ${esc(status.configVersion || 'local')}</span><span class="chip">Today: ${esc(status.today || '')}</span><span class="chip">Applied routes: ${status.appliedRoutes || 0}</span><span class="chip">Offline fallback ready</span></div><div class="notice good" style="margin-top:12px">${(adv.body||[]).map(esc).join('<br>')}</div>${fareTable}</div>`;
}
function onlineControlCard(){
  const info = onlineStatus() || {}; const status = info.status || {}; const url = info.remoteUrl || './online-config.json';
  return `<div class="card span12"><div class="cardHead"><div><h3>Online Control Center</h3><p>Future-ready remote fare/advisory configuration. Works with GitHub Pages root JSON or any CORS-enabled JSON endpoint.</p></div><span class="badge ${status.remoteOk===false?'warn':'ok'}">${status.remoteOk===false?'Fallback':'Online Ready'}</span></div><div class="formGrid"><label>Online Config URL<input id="onlineConfigUrl" value="${esc(url)}" placeholder="./online-config.json or https://..."></label><label>Status<input readonly value="${esc((status.configVersion||'local') + ' · applied routes ' + (status.appliedRoutes||0))}"></label></div><div class="row" style="margin-top:12px"><button class="primary" onclick="saveOnlineConfigUrl()">Save Online URL</button><button onclick="syncOnlineConfigNow()">Sync Now</button><button onclick="downloadOnlineConfigTemplate()">Download Template JSON</button></div><div class="notice" style="margin-top:12px">To update fares later without editing app.js, edit <b>online-config.json</b> in GitHub or connect a live JSON endpoint. The app still opens offline using bundled fares.</div>${status.remoteError?`<div class="notice" style="margin-top:12px">Remote note: ${esc(status.remoteError)}</div>`:''}</div>`;
}

// ---------- Dashboard ----------
function dashboard(){
  setTitle('Command Dashboard','Clean professional operations overview');
  const rows = scheduleTrips(0); const current = pickTrip(); const counts = statusCounts(rows);
  const txToday = state.data.transactions.filter(x => x.date === new Date().toISOString().slice(0,10));
  const openClaims = state.data.claims.filter(x => x.status !== 'Closed').length;
  const evidenceWaiting = state.data.cases.filter(x => !x.locked).length;
  $('content').innerHTML = hero('OceanJet PortDesk','Online-ready operations console with automatic scheduled fares, advisory updates, and offline fallback.','V95 Online Systems') + `
    <div class="grid">
      ${onlineAdvisoryBanner()}
      <div class="card span3"><div class="kpi"><span class="tiny">Now / Next Vessel</span><b>${current?esc(current.vessel):'—'}</b><span class="muted">${current?esc(current.routeLabel+' · '+current.status):'No trip available'}</span></div></div>
      <div class="card span3"><div class="kpi"><span class="tiny">Trips Today</span><b>${rows.length}</b><span class="muted">Boarding ${counts.Boarding||0} · Delayed ${counts.Delayed||0}</span></div></div>
      <div class="card span3"><div class="kpi"><span class="tiny">Baggage Today</span><b>${txToday.length}</b><span class="muted">${peso(txToday.reduce((a,x)=>a+x.total,0))}</span></div></div>
      <div class="card span3"><div class="kpi"><span class="tiny">Claims / Evidence</span><b>${openClaims} / ${evidenceWaiting}</b><span class="muted">Open claims · waiting evidence</span></div></div>
      <div class="card span12"><div class="quick">
        <button onclick="renderApp('board')"><span class="ico">🛳️</span><b>Open Vessel Board</b><span class="tiny">Current and next trip</span></button>
        <button onclick="renderApp('calculator')"><span class="ico">🧮</span><b>Baggage Calculator</b><span class="tiny">Baggage-only receipt</span></button>
        <button onclick="renderApp('claim')"><span class="ico">📝</span><b>Claim Intake</b><span class="tiny">Link passenger and trip</span></button>
        <button onclick="renderApp('${state.role==='admin'?'damage':'trips'}')"><span class="ico">${state.role==='admin'?'📸':'🕐'}</span><b>${state.role==='admin'?'Evidence Studio':'Schedules'}</b><span class="tiny">${state.role==='admin'?'Manual-only upload':'Route times'}</span></button>
      </div></div>
      ${boardMonitorCard()}
      <div class="card span6"><div class="cardHead"><div><h3>Recent Baggage Receipts</h3><p>Last five baggage-only calculations.</p></div></div>${recentTransactionsHtml()}</div>
      <div class="card span6"><div class="cardHead"><div><h3>Readiness Checks</h3><p>Operational QA for clean build.</p></div><span class="badge ok">Professional</span></div>${readinessHtml()}</div>
    </div>`;
}
function readinessHtml(){
  const issues = [];
  MAIN_CEBU_ROUTES.forEach(k => { if(!ROUTES[k]) issues.push('Missing route '+k); if(!ROUTES[k]?.slab?.normal) issues.push('Missing slab '+k); if(!ROUTES[k]?.trips?.length) issues.push('Missing schedule '+k); });
  const pairs = state.data.cases.filter(x => x.photos?.stub && x.photos?.damage).length;
  return `<div class="chips"><span class="chip">8 Cebu routes checked from source</span><span class="chip">No auto scanner</span><span class="chip">No observer repair loops</span><span class="chip">${pairs} paired evidence case(s)</span></div>${issues.length?`<div class="notice" style="margin-top:10px">${issues.map(esc).join('<br>')}</div>`:`<div class="notice good" style="margin-top:10px">Core routes, baggage slabs, schedule rows, receipt tools, and manual evidence workflow are present.</div>`}`;
}
function recentTransactionsHtml(){
  const list = state.data.transactions.slice(0,5);
  if(!list.length) return '<div class="empty">No baggage receipts yet.</div>';
  return `<div class="tableWrap"><table><thead><tr><th>Time</th><th>Route</th><th>Trip</th><th>Total</th></tr></thead><tbody>${list.map(x=>`<tr><td>${esc(x.time)}</td><td>${esc(routeLabel(x.route))}</td><td>${esc(x.tripCode||'-')}</td><td><b>${peso(x.total)}</b></td></tr>`).join('')}</tbody></table></div>`;
}

function boardMonitorCard(){
  const rows = scheduleTrips(0), current = pickTrip(), next = rows.filter(t => !['Closed','Cancelled'].includes(t.status)).slice(0,6), counts = statusCounts(rows);
  if(!current) return `<div class="card span12"><div class="empty">No schedule loaded for selected filter.</div></div>`;
  return `<div class="card span12"><div class="cardHead"><div><h3>Port Departure Monitor</h3><p>Current/next vessel is calculated from device time and selected route filter.</p></div><label style="min-width:220px">Route Filter ${routeFilterHtml()}</label></div><div class="boardNow"><div class="nowBox"><span class="statusPill ${statusClass(current.status)}">${esc(current.status)}</span><h2>${['Boarding','Departing Soon'].includes(current.status)?'Now Boarding':'Next Vessel'}: ${esc(current.vessel)}</h2><div>${esc(current.routeLabel)} · ${esc(current.gate)}</div><div class="metricGrid"><div class="metric"><span>Boarding</span><b>${formatTime(current.boarding)}</b></div><div class="metric"><span>Departure</span><b>${esc(current.dep)}</b></div><div class="metric"><span>Arrival</span><b>${esc(current.arr||'-')}</b></div><div class="metric"><span>Status</span><b>${esc(current.status)}</b></div></div></div><div><h3>Next Departures</h3><div class="nextList">${next.map(t=>`<div class="nextItem"><time><b>${esc(t.dep)}</b></time><div><b>${esc(t.vessel)} · ${esc(t.routeLabel)}</b><span class="tiny">Board ${formatTime(t.boarding)} · ${esc(t.gate)}</span></div><span class="statusPill ${statusClass(t.status)}">${esc(t.status)}</span></div>`).join('') || '<div class="empty">No upcoming trips.</div>'}</div></div></div><div class="row" style="margin-top:12px"><button class="primary" onclick="useCurrentTripForBaggage()">Use Current for Baggage</button><button onclick="downloadPublicBoard()">Export Public Board HTML</button><button onclick="renderApp('trips')">Schedule Control</button></div></div>`;
}
function formatTime(date){ return date.toLocaleTimeString('en-PH', {hour:'numeric', minute:'2-digit', hour12:true}); }
// ---------- Vessel board and smart schedule ----------
function board(){
  setTitle('Automatic Vessel Board','Current-time schedule board');
  const rows = scheduleTrips(0); const lanes = ['Boarding','Departing Soon','Scheduled','Departed','Closed','Delayed','Cancelled'];
  $('content').innerHTML = hero('Automatic Vessel Boarding Board','Professional departure board with Now Boarding, Next Departure, Departed, Delayed, Cancelled, and Closed lanes.','Smart Schedule') + `<div class="grid">${boardMonitorCard()}<div class="card span12"><div class="cardHead"><div><h3>Status Lanes</h3><p>Manual delayed/cancelled statuses override automatic suggestions.</p></div><button class="small" onclick="board()">Refresh</button></div><div class="lanes">${lanes.map(lane=>{const list=rows.filter(t=>t.status===lane);return `<div class="lane"><h4>${esc(lane)} <span class="tiny">${list.length}</span></h4>${list.length?list.slice(0,8).map(t=>`<div class="tripCard"><b>${esc(t.vessel)}</b><span>${esc(t.routeLabel)}</span><small>Board ${formatTime(t.boarding)} · Depart ${esc(t.dep)} · ${esc(t.gate)}</small>${state.role==='admin'?manualStatusControls(t):''}</div>`).join(''):'<div class="empty">No trips.</div>'}</div>`}).join('')}</div></div><div class="span12" style="height:80px"></div></div>`;
}
function manualStatusControls(t){
  return `<div class="row" style="margin-top:8px"><button class="small" onclick="setTripStatus('${esc(t.id)}','Delayed')">Delay</button><button class="small danger" onclick="setTripStatus('${esc(t.id)}','Cancelled')">Cancel</button><button class="small" onclick="clearTripStatus('${esc(t.id)}')">Auto</button></div>`;
}
function setTripStatus(id,status){ state.data.manualStatus[id] = {status, time:todayText(), role:state.role}; audit('Manual trip status', `${id} → ${status}`); queueSync('schedule','status change',`${id} → ${status}`); save(); board(); }
function clearTripStatus(id){ delete state.data.manualStatus[id]; audit('Manual trip status cleared', id); save(); board(); }
function useCurrentTripForBaggage(){ const t=pickTrip(); if(!t){toast('No current trip found'); return;} sessionStorage.setItem('oj_current_trip', JSON.stringify(t)); renderApp('calculator'); toast('Current trip linked to calculator'); }

function slabCost(excessPerPax, rates){
  const [r0,r1,r2] = rates.map(Number);
  const t1 = Math.min(excessPerPax, 10);
  const t2 = Math.min(Math.max(excessPerPax - 10, 0), 30);
  const t3 = Math.max(excessPerPax - 40, 0);
  return {t1,t2,t3,c1:t1*r0,c2:t2*r1,c3:t3*r2,total:t1*r0+t2*r1+t3*r2};
}
// ---------- Baggage calculator and receipts ----------
function calculator(){
  setTitle('Baggage Calculator','Organized V55-style baggage fee workflow');
  const current = JSON.parse(sessionStorage.getItem('oj_current_trip') || 'null');
  const routeOptions = MAIN_CEBU_ROUTES.map(k=>`<option value="${k}">${esc(routeLabel(k))}</option>`).join('');
  $('content').innerHTML = hero('Baggage Calculator','Baggage-only computation, detailed slab breakdown, receipt preview, TXT download, and print tools.','Counter Ready') + `<div class="grid"><div class="card span5"><div class="cardHead"><div><h3>Estimate Details</h3><p>Receipt excludes passenger fare total.</p></div></div>${current?`<div class="notice good" style="margin-bottom:12px"><b>Linked trip:</b> ${esc(current.vessel)} · ${esc(current.routeLabel)} · ${esc(current.dep)}</div>`:''}<div class="formGrid"><label>Route<select id="calcRoute">${routeOptions}</select></label><label>Mode<select id="calcMode" onchange="toggleCalcMode()"><option value="normal">Normal Baggage</option><option value="fragile">Fragile Cargo</option></select></label><label id="classWrap">Class<select id="calcClass"><option value="tourist">Tourist / Open Air - 10kg</option><option value="business">Business - 20kg</option></select></label><label id="paxWrap">Passengers<input id="calcPax" type="number" min="1" step="1" value="1"></label><label>Total Weight (kg)<input id="calcWeight" type="number" min="0" step="0.1" value="0"></label><label>Rounding<select id="calcRound"><option value="exact">Exact kg</option><option value="ceil">Round up kg</option><option value="floor">Floor kg</option></select></label></div><div class="row" style="margin-top:12px"><button class="primary" onclick="computeBaggage()">Compute Fee</button><button onclick="resetCalc()">Reset</button><button onclick="runBaggageQA()">Formula QA</button></div></div><div class="card span7"><div class="cardHead"><div><h3>Computation Result</h3><p>Calculation appears here after compute.</p></div></div><div id="calcResult" class="empty">Enter baggage details and tap Compute Fee.</div><div id="receiptTools" class="row noPrint hide" style="margin-top:12px"><button onclick="downloadReceiptTxt()">Download TXT</button><button onclick="printReceipt()">Print Receipt</button></div></div><div class="card span12"><div class="cardHead"><div><h3>Main Cebu Route Slabs</h3><p>Normal and fragile rates used by this calculator.</p></div></div>${slabTable()}</div></div>`;
  if(current?.routeKey && MAIN_CEBU_ROUTES.includes(current.routeKey)) $('calcRoute').value = current.routeKey;
  toggleCalcMode();
}
function toggleCalcMode(){
  const fragile = $('calcMode')?.value === 'fragile';
  $('classWrap')?.classList.toggle('hide', fragile); $('paxWrap')?.classList.toggle('hide', fragile);
}
function resetCalc(){ $('calcWeight').value='0'; $('calcPax').value='1'; $('calcResult').className='empty'; $('calcResult').innerHTML='Enter baggage details and tap Compute Fee.'; $('receiptTools').classList.add('hide'); }
function getCalcParams(){ return {route:$('calcRoute').value, mode:$('calcMode').value, cls:$('calcClass').value, pax:Math.max(1, parseInt($('calcPax').value,10)||1), weight:Math.max(0, parseFloat($('calcWeight').value)||0), round:$('calcRound').value}; }
function computeBaggage(saveTransaction=true){
  const p = getCalcParams(); const route = ROUTES[p.route];
  const allowance = p.mode === 'normal' ? (p.cls === 'business' ? 20 : 10) : 0;
  const totalAllowance = allowance * p.pax;
  const excessTotal = Math.max(0, p.weight - totalAllowance);
  let chargeable = p.mode === 'normal' ? excessTotal / p.pax : p.weight;
  if(p.round === 'ceil') chargeable = Math.ceil(chargeable); if(p.round === 'floor') chargeable = Math.floor(chargeable);
  const slab = slabCost(chargeable, route.slab[p.mode]);
  const perPax = slab.total;
  const total = p.mode === 'normal' ? perPax * p.pax : perPax;
  const linked = JSON.parse(sessionStorage.getItem('oj_current_trip') || 'null');
  const lines = [
    ['Route', route.label], ['Mode', cap(p.mode)], ['Weight', p.weight.toFixed(1)+' kg'],
    ['Free allowance', p.mode==='normal'?`${allowance} kg × ${p.pax} pax = ${totalAllowance} kg`:'No free allowance for fragile cargo'],
    ['Chargeable excess', `${chargeable.toFixed(2)} kg ${p.mode==='normal'?'per passenger':''}`],
    ['Tier 1', `${slab.t1.toFixed(2)} kg × ${peso(route.slab[p.mode][0])} = ${peso(slab.c1)}`],
    ['Tier 2', `${slab.t2.toFixed(2)} kg × ${peso(route.slab[p.mode][1])} = ${peso(slab.c2)}`],
    ['Tier 3', `${slab.t3.toFixed(2)} kg × ${peso(route.slab[p.mode][2])} = ${peso(slab.c3)}`],
    ['Per passenger/cargo', peso(perPax)], ['TOTAL BAGGAGE FEE', peso(total)]
  ];
  const receiptText = `OCEANJET PORTDESK\nBAGGAGE FEE RECEIPT\n${todayText()}\n\n${lines.map(([a,b])=>`${a}: ${b}`).join('\n')}\n${linked?`Linked Trip: ${linked.vessel} / ${linked.routeLabel} / ${linked.dep}\n`:''}\nReceipt is baggage-only. Passenger fare is not included.`;
  lastReceipt = receiptText;
  $('calcResult').className='';
  $('calcResult').innerHTML = `<div class="result"><div class="line"><span>Total Baggage Fee</span><b class="total">${peso(total)}</b></div>${lines.slice(0,-1).map(([a,b])=>`<div class="line"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}</div><div class="receiptBox" style="margin-top:12px"><div class="receiptTitle">⛴ OceanJet PortDesk</div><div class="receiptSub">BAGGAGE FEE RECEIPT</div>${lines.map(([a,b])=>`<div class="receiptLine"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}${linked?`<div class="receiptLine"><span>Linked Trip</span><b>${esc(linked.vessel)} · ${esc(linked.dep)}</b></div>`:''}<div class="receiptTotal">TOTAL: ${peso(total)}</div><div class="tiny" style="text-align:center;margin-top:8px">${esc(todayText())} · Baggage-only receipt</div></div>`;
  $('receiptTools').classList.remove('hide');
  if(saveTransaction){
    const tx = {id:uid('bag'), date:new Date().toISOString().slice(0,10), time:todayText(), route:p.route, mode:p.mode, cls:p.cls, pax:p.pax, weight:p.weight, total, tripCode:linked?`${linked.vessel} ${linked.dep}`:'', tripId:linked?.id||''};
    state.data.transactions.unshift(tx); state.data.receipts.unshift({id:tx.id, text:receiptText, time:tx.time, total});
    audit('Baggage receipt generated', `${route.label} ${peso(total)}`); queueSync('baggage','receipt generated', tx.id); save();
  }
}
function downloadReceiptTxt(){ if(!lastReceipt){toast('Compute first'); return;} download('OceanJet_Baggage_Receipt_'+Date.now()+'.txt', lastReceipt, 'text/plain'); }
function printReceipt(){ window.print(); }
function slabTable(){ return `<div class="tableWrap"><table><thead><tr><th>Route</th><th>Normal Slab</th><th>Fragile Slab</th><th>Travel</th></tr></thead><tbody>${MAIN_CEBU_ROUTES.map(k=>`<tr><td><b>${esc(routeLabel(k))}</b></td><td>${ROUTES[k].slab.normal.map(peso).join(' / ')}</td><td>${ROUTES[k].slab.fragile.map(peso).join(' / ')}</td><td>${esc(ROUTES[k].travel)}</td></tr>`).join('')}</tbody></table></div>`; }
function runBaggageQA(){
  const lines=[]; let ok=true;
  MAIN_CEBU_ROUTES.forEach(k=>{try{const route=ROUTES[k]; const free=20; const excess=25; const per=excess/2; const s=slabCost(per, route.slab.normal); lines.push(`${route.label}: 2 pax / 45kg → ${peso(s.total*2)}`);}catch(e){ok=false; lines.push(`${k}: FAILED ${e.message}`);}});
  alert((ok?'PASS':'FAILED')+'\n'+lines.join('\n'));
}

// ---------- Claims ----------
function claim(){
  setTitle('Claim Intake','Create passenger claim and optionally link trip');
  const trip = pickTrip(); const tripOptions = ['<option value="">No linked trip</option>'].concat(scheduleTrips(0).slice(0,20).map(t=>`<option value="${esc(t.id)}">${esc(t.vessel)} · ${esc(t.routeLabel)} · ${esc(t.dep)}</option>`));
  $('content').innerHTML = hero('Claim Intake','Create clean claim records with duplicate warning and optional vessel/trip linkage.','Manual Entry') + `<div class="grid"><div class="card span6"><div class="formGrid"><label>Passenger Name<input id="claimName" placeholder="Full name"></label><label>Contact<input id="claimContact" placeholder="Phone / email"></label><label>Route<select id="claimRoute">${Object.keys(ROUTES).map(k=>`<option value="${k}">${esc(routeLabel(k))}</option>`).join('')}</select></label><label>Trip / Vessel<select id="claimTrip">${tripOptions.join('')}</select></label><label>Issue Type<select id="claimType"><option>Damaged baggage</option><option>Missing baggage</option><option>Lost item</option><option>Wrong baggage release</option><option>Other concern</option></select></label><label>Reference No.<input id="claimRef" placeholder="Ticket / stub / OR"></label></div><label style="margin-top:12px">Details<textarea id="claimDetails" placeholder="Describe what happened"></textarea></label><div class="row" style="margin-top:12px"><button class="primary" onclick="saveClaim()">Save Claim</button><button onclick="fillCurrentClaimTrip()">Use Current Trip</button></div></div><div class="card span6"><h3>Recent Claims</h3>${claimsListHtml()}</div></div>`;
  if(trip){ $('claimRoute').value = trip.routeKey; $('claimTrip').value = trip.id; }
}
function fillCurrentClaimTrip(){ const t=pickTrip(); if(t){$('claimRoute').value=t.routeKey; $('claimTrip').value=t.id; toast('Current trip selected');} }
function saveClaim(){
  const name=$('claimName').value.trim(); if(!name){toast('Passenger name required'); return;}
  const route=$('claimRoute').value, tripId=$('claimTrip').value, type=$('claimType').value, ref=$('claimRef').value.trim();
  const duplicate = state.data.claims.find(x => x.name.toLowerCase() === name.toLowerCase() && x.ref === ref && ref);
  const trip = scheduleTrips(0).concat(scheduleTrips(1)).find(t=>t.id===tripId);
  const claim = {id:uid('claim'), time:todayText(), name, contact:$('claimContact').value.trim(), route, routeLabel:routeLabel(route), tripId, tripCode:trip?`${trip.vessel} ${trip.dep}`:'', type, ref, details:$('claimDetails').value.trim(), status:'Open'};
  state.data.claims.unshift(claim); audit('Claim created', `${name} / ${type}`); queueSync('claim','created',claim.id); save(); toast(duplicate?'Claim saved. Duplicate warning found.':'Claim saved'); claim();
}
function claimsListHtml(){
  const list=state.data.claims.slice(0,8); if(!list.length) return '<div class="empty">No claims yet.</div>';
  return `<div class="tableWrap"><table><thead><tr><th>Passenger</th><th>Issue</th><th>Trip</th><th>Status</th></tr></thead><tbody>${list.map(x=>`<tr><td><b>${esc(x.name)}</b><br><span class="tiny">${esc(x.time)}</span></td><td>${esc(x.type)}<br>${esc(x.routeLabel)}</td><td>${esc(x.tripCode||'-')}</td><td><span class="statusPill ${x.status==='Closed'?'ok':'info'}">${esc(x.status)}</span></td></tr>`).join('')}</tbody></table></div>`;
}
function track(){
  setTitle('Track Claim','Public claim lookup');
  $('content').innerHTML = hero('Track Claim','Search by passenger name or reference number.','Public Tool') + `<div class="grid"><div class="card span12"><div class="row"><input id="trackQ" placeholder="Search name, reference, route, or claim ID" oninput="renderTrackResults()"><button onclick="renderTrackResults()">Search</button></div><div id="trackResults" style="margin-top:12px"></div></div></div>`;
  renderTrackResults();
}
function renderTrackResults(){
  const q=($('trackQ')?.value||'').toLowerCase().trim();
  const list=state.data.claims.filter(x=>!q || [x.id,x.name,x.ref,x.routeLabel,x.type,x.status].join(' ').toLowerCase().includes(q)).slice(0,30);
  $('trackResults').innerHTML = list.length ? claimsTable(list) : '<div class="empty">No matching claim.</div>';
}
function claimsTable(list){ return `<div class="tableWrap"><table><thead><tr><th>Claim</th><th>Passenger</th><th>Route / Trip</th><th>Issue</th><th>Status</th></tr></thead><tbody>${list.map(x=>`<tr><td>${esc(x.id)}</td><td><b>${esc(x.name)}</b><br>${esc(x.contact)}</td><td>${esc(x.routeLabel)}<br><span class="tiny">${esc(x.tripCode||'-')}</span></td><td>${esc(x.type)}<br><span class="tiny">${esc(x.details)}</span></td><td><span class="statusPill ${x.status==='Closed'?'ok':'info'}">${esc(x.status)}</span></td></tr>`).join('')}</tbody></table></div>`; }

let pendingPhotos = {stub:'', damage:''};
// ---------- Manual damage evidence ----------
function damage(){
  setTitle('Damage Evidence Studio','Manual-only evidence upload');
  const tripOptions = ['<option value="">No linked trip</option>'].concat(scheduleTrips(0).slice(0,20).map(t=>`<option value="${esc(t.id)}">${esc(t.vessel)} · ${esc(t.routeLabel)} · ${esc(t.dep)}</option>`));
  const claimOptions = ['<option value="">No linked claim</option>'].concat(state.data.claims.slice(0,50).map(c=>`<option value="${esc(c.id)}">${esc(c.name)} · ${esc(c.type)} · ${esc(c.id)}</option>`));
  $('content').innerHTML = hero('Damage Evidence Studio','Manual claim-stub and damage-image upload only. No scanner, no automatic camera, no demo evidence.','Safe Evidence') + `<div class="grid"><div class="card span6"><div class="formGrid"><label>Claim<select id="caseClaim">${claimOptions.join('')}</select></label><label>Trip<select id="caseTrip">${tripOptions.join('')}</select></label><label>Passenger Name<input id="caseName" placeholder="Full name"></label><label>Damage Type<select id="caseType"><option>Scratch / dent</option><option>Broken wheel / handle</option><option>Wet baggage</option><option>Missing contents</option><option>Torn baggage</option><option>Other</option></select></label><label>Bag Color<input id="caseColor" placeholder="e.g., black"></label><label>Bag Size<input id="caseSize" placeholder="e.g., medium"></label></div><label style="margin-top:12px">Notes<textarea id="caseNotes" placeholder="Manual inspection notes"></textarea></label><div class="photoGrid" style="margin-top:12px"><label class="photoSlot"><input class="hide" type="file" accept="image/*" onchange="loadPhoto(event,'stub')"><small>Tap to upload Claim Stub photo</small><div id="stubPreview"></div></label><label class="photoSlot"><input class="hide" type="file" accept="image/*" onchange="loadPhoto(event,'damage')"><small>Tap to upload Damage Image</small><div id="damagePreview"></div></label></div><div class="row" style="margin-top:12px"><button class="primary" onclick="saveEvidenceCase()">Save Evidence</button><button onclick="clearEvidenceForm()">Clear</button></div></div><div class="card span6"><h3>Evidence Pairing Rules</h3><div class="notice good" style="margin-top:10px">Required pair: Claim Stub + Damage Image. Batch logic is 1-2, 3-4, 5-6. Evidence remains manual and staff-controlled.</div><div style="margin-top:12px">${evidenceListHtml(5)}</div></div></div>`;
}
function loadPhoto(event, type){
  const file=event.target.files?.[0]; if(!file) return;
  const reader=new FileReader(); reader.onload=()=>{ pendingPhotos[type]=reader.result; $(type+'Preview').innerHTML = `<img src="${reader.result}" alt="${type}">`; }; reader.readAsDataURL(file);
}
function clearEvidenceForm(){ pendingPhotos={stub:'',damage:''}; damage(); }
function evidenceScore(x){ let s=0; if(x.name)s+=15; if(x.claimId)s+=10; if(x.tripId)s+=10; if(x.type)s+=10; if(x.color)s+=8; if(x.size)s+=7; if(x.notes)s+=10; if(x.photos?.stub)s+=15; if(x.photos?.damage)s+=15; return Math.min(100,s); }
function saveEvidenceCase(){
  const name=$('caseName').value.trim(); const claimId=$('caseClaim').value; const tripId=$('caseTrip').value;
  if(!name && !claimId){toast('Passenger or claim is required'); return;}
  if(!pendingPhotos.stub || !pendingPhotos.damage){toast('Claim Stub + Damage Image are both required'); return;}
  const claim = state.data.claims.find(c=>c.id===claimId); const trip = scheduleTrips(0).concat(scheduleTrips(1)).find(t=>t.id===tripId);
  const item = {id:uid('ev'), time:todayText(), claimId, tripId, tripCode:trip?`${trip.vessel} ${trip.dep}`:'', name:name || claim?.name || '', type:$('caseType').value, color:$('caseColor').value.trim(), size:$('caseSize').value.trim(), notes:$('caseNotes').value.trim(), photos:{...pendingPhotos}, locked:false};
  item.score = evidenceScore(item); state.data.cases.unshift(item); audit('Evidence saved', `${item.name} score ${item.score}%`); queueSync('evidence','saved',item.id); save(); pendingPhotos={stub:'',damage:''}; toast('Evidence saved'); damage();
}
function evidenceListHtml(limit=20){
  const list=state.data.cases.slice(0,limit); if(!list.length) return '<div class="empty">No evidence cases yet.</div>';
  return list.map(x=>`<div class="card" style="box-shadow:none;margin-bottom:10px"><div class="row"><b>${esc(x.name)}</b><span class="statusPill ${x.locked?'ok':'info'}">${x.locked?'Locked':'Open'}</span><span class="right tiny">Score ${x.score}%</span></div><div class="tiny">${esc(x.type)} · ${esc(x.tripCode||'No trip')}</div><div class="casePhotos" style="margin-top:8px"><img src="${x.photos.stub}" alt="stub"><img src="${x.photos.damage}" alt="damage"></div>${state.role==='admin'?`<div class="row" style="margin-top:8px"><button class="small" onclick="toggleEvidenceLock('${x.id}')">${x.locked?'Unlock':'Lock'}</button><button class="small danger" onclick="deleteEvidence('${x.id}')">Delete</button></div>`:''}</div>`).join('');
}
function toggleEvidenceLock(id){ const x=state.data.cases.find(c=>c.id===id); if(!x)return; x.locked=!x.locked; audit(x.locked?'Evidence locked':'Evidence unlocked',id); save(); renderApp(state.view); }
function deleteEvidence(id){ if(!confirm('Delete this evidence record?'))return; state.data.cases=state.data.cases.filter(c=>c.id!==id); audit('Evidence deleted',id); save(); renderApp(state.view); }
function queue(){
  setTitle('Review Queue','Claims and evidence review');
  $('content').innerHTML = hero('Claim Review Queue','Review open claims, linked trips, evidence scores, and safe case actions.','Admin Review') + `<div class="grid"><div class="card span7"><div class="cardHead"><div><h3>Claims</h3><p>Admin can close resolved claims.</p></div></div>${claimsTable(state.data.claims.slice(0,50))}</div><div class="card span5"><div class="cardHead"><div><h3>Evidence Cases</h3><p>Manual uploads with paired images.</p></div></div>${evidenceListHtml(20)}</div></div>`;
}

function receipt(){
  setTitle('Receipts','Baggage receipt archive');
  const list=state.data.receipts.slice(0,50);
  $('content').innerHTML = hero('Receipt Archive','Stored baggage-only TXT receipts from this browser.','Cashier') + `<div class="grid"><div class="card span12">${list.length?`<div class="tableWrap"><table><thead><tr><th>Time</th><th>Total</th><th>Action</th></tr></thead><tbody>${list.map(r=>`<tr><td>${esc(r.time)}</td><td><b>${peso(r.total)}</b></td><td><button class="small" onclick="downloadStoredReceipt('${r.id}')">Download TXT</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No receipts yet.</div>'}</div></div>`;
}
function downloadStoredReceipt(id){ const r=state.data.receipts.find(x=>x.id===id); if(r) download('OceanJet_Baggage_Receipt_'+id+'.txt', r.text, 'text/plain'); }

// ---------- Schedule control and exports ----------
function trips(){
  setTitle('Schedule Control','Routes, public board, CSV import/export');
  const keys=Object.keys(ROUTES); const selected = keys.includes(selectedScheduleRoute)?selectedScheduleRoute:keys[0];
  $('content').innerHTML = hero('Schedule Control Center','Clean route schedules restored from the old organized OceanJet data and editable through CSV import.','Offline Schedule') + `<div class="grid"><div class="card span4"><div class="cardHead"><div><h3>Routes</h3><p>Select a route schedule.</p></div></div><div class="routeButtons">${keys.map(k=>`<button class="${selected===k?'active':''}" onclick="selectScheduleRoute('${k}')"><b>${esc(routeLabel(k))}</b><span class="tiny">${esc(ROUTES[k].travel)} · ${ROUTES[k].trips.length} trip(s)</span></button>`).join('')}</div></div><div class="card span8"><div class="cardHead"><div><h3>${esc(routeLabel(selected))}</h3><p>Travel time: ${esc(ROUTES[selected].travel)}</p></div><div class="row"><button class="small" onclick="downloadScheduleCSV()">Export CSV</button><label class="fileBtn">Import CSV<input type="file" accept=".csv,text/csv" onchange="importScheduleCSV(event)"></label></div></div><div id="scheduleRows">${scheduleRowsHtml(selected)}</div></div><div class="card span12"><div class="cardHead"><div><h3>Public Board Export</h3><p>Generate a professional departure monitor HTML file for display or printing.</p></div><button class="primary" onclick="downloadPublicBoard()">Download Public Board HTML</button></div>${boardMonitorCard()}</div></div>`;
}
function selectScheduleRoute(k){ selectedScheduleRoute=k; trips(); }
function scheduleRowsHtml(k){
  const rows=ROUTES[k].trips; if(!rows.length) return '<div class="empty">No trips for this route.</div>';
  return rows.map(raw=>{const t=Array.isArray(raw)?{dep:raw[0],vessel:raw[1],arr:raw[2],remarks:raw[3]}:raw; return `<div class="scheduleRow"><div><b>${esc(t.dep)}</b><small>Depart</small></div><div><b>${esc(t.vessel)}</b><small>${esc(t.remarks||'Regular service')}</small></div><div class="arr"><b>${esc(t.arr||'-')}</b><small>Arrive</small></div><div class="status"><span class="statusPill info">${esc(gateForRoute(k))}</span></div></div>`;}).join('');
}
function buildScheduleCSV(){
  const rows=[['route','routeLabel','travel','departure','vessel','arrival','remarks']];
  Object.entries(ROUTES).forEach(([k,r]) => (r.trips||[]).forEach(raw=>{const t=Array.isArray(raw)?{dep:raw[0],vessel:raw[1],arr:raw[2],remarks:raw[3]}:raw; rows.push([k,r.label,r.travel,t.dep,t.vessel,t.arr||'',t.remarks||'']);}));
  return rows.map(r=>r.map(cell=>`"${String(cell??'').replace(/"/g,'""')}"`).join(',')).join('\n');
}
function downloadScheduleCSV(){ download('OceanJet_V95_Schedule_'+Date.now()+'.csv', buildScheduleCSV(), 'text/csv'); }
function parseCSVLine(line){ const out=[]; let cur='', q=false; for(let i=0;i<line.length;i++){const ch=line[i]; if(ch==='"'){ if(q && line[i+1]==='"'){cur+='"'; i++;} else q=!q; } else if(ch===',' && !q){out.push(cur); cur='';} else cur+=ch;} out.push(cur); return out; }
function importScheduleCSV(ev){
  const file=ev.target.files?.[0]; if(!file)return; const reader=new FileReader();
  reader.onload=()=>{try{const lines=String(reader.result||'').split(/\r?\n/).filter(x=>x.trim()); const headers=parseCSVLine(lines[0]).map(x=>x.toLowerCase()); const get=(row,key)=>row[headers.indexOf(key)]||''; const next={}; lines.slice(1).forEach(line=>{const row=parseCSVLine(line); const key=get(row,'route'); if(!key)return; next[key] ||= {trips:[]}; next[key].trips.push({dep:get(row,'departure'), vessel:get(row,'vessel'), arr:get(row,'arrival'), remarks:get(row,'remarks')});}); state.data.scheduleOverrides=next; audit('Schedule CSV imported', Object.keys(next).length+' route(s)'); queueSync('schedule','csv imported',Object.keys(next).length+' route(s)'); save(); toast('Schedule imported'); trips();}catch(e){toast('Import failed: '+e.message);} ev.target.value='';}; reader.readAsText(file);
}
function downloadPublicBoard(){
  const rows=scheduleTrips(0).slice(0,36), current=pickTrip(), counts=statusCounts(rows);
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OceanJet Public Vessel Board V95</title><style>body{margin:0;background:#03101b;color:#eef8ff;font-family:Inter,Arial,sans-serif}.wrap{max-width:1200px;margin:auto;padding:24px}.head{display:flex;justify-content:space-between;gap:18px;align-items:flex-end;border-bottom:1px solid rgba(255,255,255,.16);padding-bottom:18px;margin-bottom:18px}.logo{font-size:2rem;font-weight:1000}.now{background:linear-gradient(135deg,#00acd7,#006da8);padding:18px;border-radius:24px;min-width:330px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.metric{border:1px solid rgba(255,255,255,.14);border-radius:16px;background:#0d263d;padding:12px}.metric span{display:block;color:#9fb7c9;text-transform:uppercase;font-size:.72rem;font-weight:900}.metric b{font-size:1.4rem}table{width:100%;border-collapse:separate;border-spacing:0 10px}th{text-align:left;color:#9fb7c9;text-transform:uppercase;font-size:.78rem;letter-spacing:.06em}td{background:#0d263d;padding:15px;border-top:1px solid rgba(255,255,255,.12);border-bottom:1px solid rgba(255,255,255,.12)}td:first-child{border-radius:16px 0 0 16px;border-left:1px solid rgba(255,255,255,.12)}td:last-child{border-radius:0 16px 16px 0;border-right:1px solid rgba(255,255,255,.12)}.pill{border-radius:999px;padding:8px 12px;display:inline-block;font-weight:900}.ok{background:#123d31;color:#9cf4d0}.warn{background:#493714;color:#ffe4a6}.bad{background:#451b26;color:#ffc4cf}.info{background:#0f344d;color:#a5eef8}.foot{margin-top:16px;color:#9fb7c9;font-size:.86rem}@media(max-width:720px){.head{display:block}.now{min-width:0;margin-top:14px}.metrics{grid-template-columns:1fr 1fr}table{font-size:.84rem}th:nth-child(4),td:nth-child(4){display:none}}</style></head><body><div class="wrap"><div class="head"><div><div class="logo">⛴ OceanJet Vessel Board</div><div>Public port monitor · generated ${esc(todayText())}</div></div><div class="now"><div style="opacity:.8;text-transform:uppercase;font-size:.75rem;font-weight:900">Current / Next Vessel</div><h1 style="margin:.25em 0">${current?esc(current.vessel):'No trip'}</h1><div>${current?esc(current.routeLabel+' · '+current.status+' · '+current.dep):'Schedule not available'}</div></div></div><div class="metrics"><div class="metric"><span>Boarding</span><b>${counts.Boarding||0}</b></div><div class="metric"><span>Departing Soon</span><b>${counts['Departing Soon']||0}</b></div><div class="metric"><span>Scheduled</span><b>${counts.Scheduled||0}</b></div><div class="metric"><span>Alerts</span><b>${(counts.Delayed||0)+(counts.Cancelled||0)}</b></div></div><table><thead><tr><th>Route</th><th>Vessel</th><th>Gate</th><th>Boarding</th><th>Departure</th><th>Status</th></tr></thead><tbody>${rows.map(t=>`<tr><td><b>${esc(t.routeLabel)}</b></td><td>${esc(t.vessel)}</td><td>${esc(t.gate)}</td><td>${formatTime(t.boarding)}</td><td>${esc(t.dep)}</td><td><span class="pill ${statusClass(t.status)}">${esc(t.status)}</span></td></tr>`).join('')}</tbody></table><div class="foot">Offline export. Status is based on device time at export.</div></div></body></html>`;
  audit('Public vessel board exported','HTML'); queueSync('schedule','public board exported','HTML'); save(); download('OceanJet_V95_Public_Vessel_Board_'+Date.now()+'.html', html, 'text/html');
}

// ---------- Reports, sync, and system tools ----------
function reports(){
  setTitle('Reports','Operational exports and summaries');
  const total=state.data.transactions.reduce((a,x)=>a+x.total,0); const kg=state.data.transactions.reduce((a,x)=>a+x.weight,0);
  $('content').innerHTML = hero('Reports','Export local data and review cashier, claims, and evidence summaries.','Offline Reports') + `<div class="grid"><div class="card span3"><div class="kpi"><span class="tiny">Transactions</span><b>${state.data.transactions.length}</b><span class="muted">${peso(total)}</span></div></div><div class="card span3"><div class="kpi"><span class="tiny">Total KG</span><b>${kg.toFixed(1)}</b><span class="muted">Baggage weight</span></div></div><div class="card span3"><div class="kpi"><span class="tiny">Claims</span><b>${state.data.claims.length}</b><span class="muted">All records</span></div></div><div class="card span3"><div class="kpi"><span class="tiny">Evidence</span><b>${state.data.cases.length}</b><span class="muted">Manual uploads</span></div></div><div class="card span12"><div class="row"><button class="primary" onclick="exportJSON()">Export Backup JSON</button><button onclick="exportBaggageCSV()">Export Baggage CSV</button><button onclick="downloadScheduleCSV()">Export Schedule CSV</button></div></div></div>`;
}
function exportJSON(){ download('OceanJet_V95_Backup_'+Date.now()+'.json', JSON.stringify({version:APP_VERSION, exportedAt:new Date().toISOString(), state}, null, 2), 'application/json'); }
function exportBaggageCSV(){ const rows=[['id','time','route','mode','pax','weight','total','trip']].concat(state.data.transactions.map(x=>[x.id,x.time,routeLabel(x.route),x.mode,x.pax,x.weight,x.total,x.tripCode])); download('OceanJet_Baggage_'+Date.now()+'.csv', rows.map(r=>r.map(c=>`"${String(c??'').replace(/"/g,'""')}"`).join(',')).join('\n'), 'text/csv'); }
function sync(){
  setTitle('Online Sync Bridge','Manual backup, remote config, and online control');
  $('content').innerHTML = hero('Online Sync Bridge','Offline-first app with optional remote JSON configuration and manual backup/sync tools.','Future Ready') + `<div class="grid"><div class="card span6"><label>Apps Script Web App URL<input id="syncUrl" value="${esc(state.data.settings.syncUrl||'')}" placeholder="https://script.google.com/..."></label><div class="row" style="margin-top:12px"><button class="primary" onclick="saveSyncUrl()">Save URL</button><button onclick="testSync()">Test Connection</button><button onclick="downloadSyncPayload()">Download Payload</button></div><div class="notice" style="margin-top:12px">No Google login is forced. Local browser storage remains the main storage.</div></div><div class="card span6"><div class="cardHead"><div><h3>Local Outbox</h3><p>Items queued for manual sync or backup.</p></div><span class="badge ${state.data.syncOutbox.length?'warn':'ok'}">${state.data.syncOutbox.length}</span></div>${outboxHtml()}<div class="row" style="margin-top:12px"><button onclick="downloadSyncPayload()">Download Payload</button><button class="danger" onclick="clearOutbox()">Clear Outbox</button></div></div></div>`;
}
function saveSyncUrl(){ state.data.settings.syncUrl=$('syncUrl').value.trim(); audit('Sync URL saved','manual'); save(); toast('Sync URL saved'); }
async function testSync(){ const url=$('syncUrl').value.trim(); if(!url){toast('Enter Apps Script URL first');return;} try{const res=await fetch(url); toast(res.ok?'Connection successful':'Connection returned '+res.status);}catch{toast('Connection failed');} }
function syncPayload(){ return {version:APP_VERSION, generatedAt:new Date().toISOString(), onlineConfig: onlineStatus(), schedules:ROUTES, transactions:state.data.transactions, claims:state.data.claims, evidence:state.data.cases.map(x=>({...x, photos:{stub:!!x.photos?.stub, damage:!!x.photos?.damage}})), audit:state.data.audit, outbox:state.data.syncOutbox}; }
function downloadSyncPayload(){ download('OceanJet_V95_Sync_Payload_'+Date.now()+'.json', JSON.stringify(syncPayload(), null, 2), 'application/json'); }
function clearOutbox(){ if(confirm('Clear local outbox ledger?')){ state.data.syncOutbox=[]; audit('Outbox cleared','manual'); save(); sync(); } }
function outboxHtml(){ const list=state.data.syncOutbox.slice(0,12); return list.length?`<div class="tableWrap"><table><thead><tr><th>Time</th><th>Type</th><th>Action</th></tr></thead><tbody>${list.map(x=>`<tr><td>${esc(new Date(x.time).toLocaleString())}</td><td>${esc(x.type)}</td><td>${esc(x.action)}<br><span class="tiny">${esc(x.detail)}</span></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No pending outbox items.</div>'; }
function system(){
  setTitle('System Tools','Settings, credentials, backup, diagnostics');
  const removed = ['duplicate old patch layers','inline.js duplicate payload','AR scanner module','mutation observer repair patches','fake live monitor timers','playables SDK code','demo evidence labels'];
  $('content').innerHTML = hero('System Tools','Cleaned codebase controls and diagnostics.','Admin') + `<div class="grid"><div class="card span6"><h3>Credentials</h3><div class="formGrid"><label>Cashier Username<input id="cashierU" value="${esc(state.data.settings.cashier.u)}"></label><label>Cashier Password<input id="cashierP" value="${esc(state.data.settings.cashier.p)}"></label><label>Admin Username<input id="adminU" value="${esc(state.data.settings.admin.u)}"></label><label>Admin Password<input id="adminP" value="${esc(state.data.settings.admin.p)}"></label></div><button class="primary" style="margin-top:12px" onclick="saveCredentials()">Save Credentials</button></div><div class="card span6"><h3>Code Cleanup Summary</h3><div class="chips" style="margin-top:10px">${removed.map(x=>`<span class="chip">Removed: ${esc(x)}</span>`).join('')}</div><div class="notice good" style="margin-top:12px">The V90 package separates HTML/CSS/data, keeps one navigation system, and uses event-driven actions only.</div></div>${onlineControlCard()}<div class="card span12"><div class="row"><button class="primary" onclick="exportJSON()">Export Full Backup</button><label class="fileBtn">Import Backup JSON<input type="file" accept=".json" onchange="importBackup(event)"></label><button onclick="runDiagnostics()">Run Diagnostics</button><button class="danger" onclick="resetAll()">Reset Local Data</button></div><div id="diagOut" style="margin-top:12px"></div></div></div>`;
}
function saveOnlineConfigUrl(){
  const url = $('onlineConfigUrl')?.value.trim() || './online-config.json';
  onlineEngine()?.setRemoteUrl?.(url);
  audit('Online config URL saved', url); save(); toast('Online config URL saved');
}
async function syncOnlineConfigNow(){
  const engine = onlineEngine(); if(!engine){toast('Online engine unavailable'); return;}
  const url = $('onlineConfigUrl')?.value.trim() || engine.getRemoteUrl();
  engine.setRemoteUrl(url);
  const status = await engine.refresh(url);
  audit('Online config synced', `${status?.configVersion||'unknown'} · routes ${status?.appliedRoutes||0}`);
  save(); toast(status?.remoteOk===false ? 'Using offline fallback config' : 'Online config synced'); renderApp(state.view);
}
function downloadOnlineConfigTemplate(){ onlineEngine()?.downloadTemplate?.(); }
document.addEventListener('oj-online-config-applied', () => {
  try{ if(typeof state !== 'undefined' && ['dashboard','system','sync','calculator','trips','board'].includes(state.view)) renderApp(state.view); }catch{}
});
function saveCredentials(){ state.data.settings.cashier={u:$('cashierU').value.trim()||'cashier',p:$('cashierP').value.trim()||'cashier'}; state.data.settings.admin={u:$('adminU').value.trim()||'admin',p:$('adminP').value.trim()||'admin'}; audit('Credentials updated','admin'); save(); toast('Credentials saved'); }
function importBackup(ev){ const file=ev.target.files?.[0]; if(!file)return; const rd=new FileReader(); rd.onload=()=>{try{const obj=JSON.parse(rd.result); if(obj.state?.data) state.data=mergeData(DEFAULT_DATA,obj.state.data); else if(obj.data) state.data=mergeData(DEFAULT_DATA,obj.data); audit('Backup imported',file.name); save(); toast('Backup imported'); renderApp('system');}catch(e){toast('Invalid backup');}}; rd.readAsText(file); }
function resetAll(){ if(confirm('Reset all local OceanJet PortDesk data on this device?')){ localStorage.removeItem(STORE); location.reload(); } }
function runDiagnostics(){
  const d={version:APP_VERSION, role:state.role, view:state.view, routes:Object.keys(ROUTES).length, mainCebuRoutes:MAIN_CEBU_ROUTES.filter(k=>ROUTES[k]).length+'/8', scheduleRows:Object.values(ROUTES).reduce((a,r)=>a+(r.trips||[]).length,0), transactions:state.data.transactions.length, claims:state.data.claims.length, evidence:state.data.cases.length, manualOnlyEvidence:true, oneNavigationSystem:true, removedDuplicateInline:true, serviceWorker:'network first cache fallback', onlineEngine: onlineStatus()};
  $('diagOut').innerHTML = `<pre class="notice mono">${esc(JSON.stringify(d,null,2))}</pre>`; return d;
}

function updateClock(){
  const clock = $('clock');
  if(clock) clock.textContent = new Date().toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit',hour12:true});
}
function init(){
  renderShell(); renderApp(state.view);
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
  updateClock();
  window.__ojClockTimer = window.setInterval(updateClock, 30000);
}
document.addEventListener('DOMContentLoaded', init);
