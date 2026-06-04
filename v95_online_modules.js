/* OceanJet PortDesk V95 Online Systems Module Layer
   Non-destructive upgrade: extends navigation and adds online-ready modules without editing baggage formula logic. */
'use strict';
(function(){
  if(window.__OJ_V95_ONLINE_MODULES__) return;
  window.__OJ_V95_ONLINE_MODULES__ = true;
  const V95_VERSION = 'V95 Online Systems Module Layer';
  const STORE = 'oceanjet_portdesk_v95_online_modules';
  const DEFAULT_MODULES = [
    {id:'onlineFareEngine', icon:'💸', name:'Automatic Fare Engine', status:'Active', detail:'Scheduled fares and advisory updates are loaded from online-config.json with offline fallback.'},
    {id:'passengerHub', icon:'✨', name:'Passenger Self-Service Hub', status:'Active', detail:'Passenger-facing next trip, advisory, fare board, and claim quick actions.'},
    {id:'smartAlerts', icon:'🔔', name:'Smart Alerts Center', status:'Active', detail:'Rule-based alerting for boarding, delays, cancellations, and connection-watch trips.'},
    {id:'cashierCounterPlus', icon:'💳', name:'Cashier Counter Plus', status:'Active', detail:'Cashier daily transaction summary, quick trip linking, and counter tools.'},
    {id:'cloudBridge', icon:'☁️', name:'Cloud Bridge', status:'Ready', detail:'Remote JSON, Apps Script URL, backup payload, and future database bridge.'},
    {id:'damageDetector', icon:'🔬', name:'Damage Detector Addon', status:'Active', detail:'Manual evidence intake and QA exports loaded separately as a safe root addon.'},
    {id:'pwaOffline', icon:'📲', name:'PWA Offline Shell', status:'Active', detail:'Service worker caches launch assets and keeps the app usable during connection drops.'},
    {id:'featureFlags', icon:'🧩', name:'Remote Feature Flags', status:'Ready', detail:'Future modules can be turned on/off in online-config.json without changing app.js.'}
  ];

  const byId = id => document.getElementById(id);
  const safe = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const money = value => (typeof peso === 'function') ? peso(value) : '₱' + (Number(value) || 0).toFixed(2);
  const nowText = () => new Date().toLocaleString('en-PH', {dateStyle:'medium', timeStyle:'short'});
  const getStore = () => { try{return JSON.parse(localStorage.getItem(STORE) || '{}');}catch{return {};} };
  const setStore = data => { try{localStorage.setItem(STORE, JSON.stringify(Object.assign(getStore(), data || {})));}catch{} };
  const engine = () => (typeof onlineEngine === 'function' ? onlineEngine() : window.OJOnlineConfigEngine || null);
  const statusInfo = () => {
    try{ return (typeof onlineStatus === 'function' ? onlineStatus() : engine()?.publicStatus?.()) || {}; }catch{return {};}
  };
  const getConfig = () => window.OJ_ONLINE_CONFIG || engine()?.DEFAULT_CONFIG || {};
  const downloadFile = (name, content, type='application/json') => {
    const blob = new Blob([content], {type});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1200);
  };
  const toastV95 = msg => { try{ if(typeof toast === 'function') toast(msg); else console.info(msg); }catch{ console.info(msg); } };
  function callAudit(action, detail=''){
    try{ if(typeof audit === 'function') audit(action, detail); if(typeof save === 'function') save(); }catch{}
  }

  function installStyles(){
    if(byId('ojV95ModuleStyles')) return;
    const style = document.createElement('style');
    style.id = 'ojV95ModuleStyles';
    style.textContent = `
      .v95HeroGrid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px}.v95Panel{border:1px solid rgba(0,172,215,.36);border-radius:24px;background:linear-gradient(135deg,rgba(0,172,215,.15),rgba(124,77,255,.10));padding:16px}.v95Panel h3{margin:0 0 6px}.v95StatusDot{width:10px;height:10px;border-radius:50%;display:inline-block;background:#22c984;box-shadow:0 0 0 5px rgba(34,201,132,.12)}.v95StatusDot.off{background:#ff5c7a;box-shadow:0 0 0 5px rgba(255,92,122,.12)}.v95ModuleGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}.v95Module{border:1px solid var(--line);border-radius:20px;background:rgba(255,255,255,.045);padding:14px;display:grid;gap:7px}.v95Module .ico{font-size:1.8rem}.v95Module .status{width:max-content}.v95MiniBoard{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.v95MiniMetric{border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.045);padding:12px}.v95MiniMetric span{display:block;color:var(--muted);font-size:.75rem;text-transform:uppercase;font-weight:900}.v95MiniMetric b{font-size:1.35rem}.v95Alert{border-left:5px solid var(--brand);border-radius:16px;background:rgba(255,255,255,.045);padding:12px;margin:8px 0}.v95Alert.high{border-left-color:#ff5c7a}.v95Alert.medium{border-left-color:#f7b731}.v95Alert.low{border-left-color:#22c984}.v95FareCards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.v95FareCard{border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.045);padding:12px}.v95FareCard b{font-size:1rem}.v95FareCard .price{font-size:1.25rem;font-weight:1000}.v95ActionBar{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.v95Clipboard{word-break:break-all}.v95Pulse{animation:v95Pulse 1.5s ease-in-out infinite}@keyframes v95Pulse{0%,100%{opacity:1}50%{opacity:.55}}@media(max-width:820px){.v95HeroGrid{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  }

  function ensureRoleNavs(){
    try{
      const add = (role, item, after='dashboard') => {
        if(!ROLE_NAVS?.[role] || ROLE_NAVS[role].some(x => x[0] === item[0])) return;
        const idx = ROLE_NAVS[role].findIndex(x => x[0] === after);
        ROLE_NAVS[role].splice(idx >= 0 ? idx + 1 : ROLE_NAVS[role].length, 0, item);
      };
      add('passenger', ['passenger_hub','✨','Passenger Hub']);
      add('passenger', ['fare_board','💸','Fare Board'], 'calculator');
      add('cashier', ['counter_plus','💳','Counter Plus']);
      add('cashier', ['fare_board','💸','Fare Board'], 'counter_plus');
      add('admin', ['modules','🚀','V95 Modules']);
      add('admin', ['smart_alerts','🔔','Smart Alerts'], 'modules');
      add('admin', ['cloud_hub','☁️','Cloud Hub'], 'smart_alerts');
      add('admin', ['fare_board','💸','Fare Board'], 'cloud_hub');
    }catch(err){ console.warn('V95 nav install failed', err); }
  }

  function moduleData(){
    const cfg = getConfig();
    const onlineMods = Array.isArray(cfg.modules) ? cfg.modules : [];
    if(!onlineMods.length) return DEFAULT_MODULES;
    const iconMap = Object.fromEntries(DEFAULT_MODULES.map(m => [m.id, m.icon]));
    return onlineMods.map(m => ({id:m.id, icon:iconMap[m.id] || '🧩', name:m.name, status:capStatus(m.status), detail:m.description || m.detail || ''}));
  }
  function capStatus(status){ return String(status || 'ready').replace(/\b\w/g, c => c.toUpperCase()); }
  function networkBadge(){ return navigator.onLine ? '<span class="badge ok"><span class="v95StatusDot"></span> Online</span>' : '<span class="badge bad"><span class="v95StatusDot off"></span> Offline</span>'; }
  function cfgSummary(){
    const s = statusInfo(); const st = s.status || {};
    return `<div class="v95MiniBoard"><div class="v95MiniMetric"><span>Config Version</span><b>${safe(st.configVersion || getConfig().version || 'local')}</b></div><div class="v95MiniMetric"><span>Applied Routes</span><b>${safe(st.appliedRoutes || 0)}</b></div><div class="v95MiniMetric"><span>Today</span><b>${safe(st.today || s.today || '')}</b></div><div class="v95MiniMetric"><span>Remote</span><b>${st.remoteOk === false ? 'Fallback' : 'Ready'}</b></div></div>`;
  }

  function fareRows(limit=24){
    const rows = [];
    try{
      const cfg = getConfig();
      const active = (typeof ROUTES !== 'undefined') ? ROUTES : {};
      const scheduled = (cfg.fareSchedules || [])[0] || {};
      const keys = new Set([...Object.keys(scheduled.routes || {}), ...Object.keys(active).filter(k => active[k]?.fareEffectiveDate)]);
      keys.forEach(key => {
        const route = active[key] || {};
        const pendingFare = scheduled.routes?.[key];
        const fare = route.fare || pendingFare || {};
        rows.push({key, label:route.label || key.replace(/_/g,' → '), fare, effectiveDate:route.fareEffectiveDate || scheduled.effectiveDate || '-', applied:!!route.fareEffectiveDate});
      });
    }catch{}
    return rows.slice(0, limit);
  }
  function fareCards(limit=12){
    const rows = fareRows(limit);
    if(!rows.length) return '<div class="empty">No fare rows available.</div>';
    return `<div class="v95FareCards">${rows.map(r=>`<div class="v95FareCard"><b>${safe(r.label)}</b><div class="tiny">${r.applied?'Active fare':'Scheduled'} · ${safe(r.effectiveDate)}</div><div class="row" style="margin-top:8px"><div><span class="tiny">Tourist/Open Air</span><div class="price">${money(r.fare?.['TC/OA'])}</div></div><div class="right"><span class="tiny">Business</span><div class="price">${money(r.fare?.BC)}</div></div></div></div>`).join('')}</div>`;
  }

  function renderModules(){
    installStyles();
    if(typeof setTitle === 'function') setTitle('V95 Online Modules','Future-ready systems, feature flags, and online expansion controls');
    const content = byId('content'); if(!content) return;
    const mods = moduleData();
    const adv = statusInfo().advisory || getConfig().advisory || {};
    content.innerHTML = `${typeof hero === 'function' ? hero('V95 Online Systems Hub','A modular online-ready control center built on top of your existing OceanJet PortDesk without changing baggage formulas.','Futuristic Layer') : ''}
      <div class="grid">
        <div class="card span12"><div class="v95HeroGrid"><div class="v95Panel"><div class="row"><h3>🚀 Online Expansion Status</h3><span class="right">${networkBadge()}</span></div><p>Modules are loaded from the root as a safe layer. Future upgrades can be switched through <b>online-config.json</b> or a remote JSON endpoint.</p>${cfgSummary()}<div class="v95ActionBar"><button class="primary" onclick="renderApp('cloud_hub')">Open Cloud Hub</button><button onclick="renderApp('smart_alerts')">Review Smart Alerts</button><button onclick="OJ_V95.exportModuleMap()">Export Module Map</button></div></div><div class="v95Panel"><h3>📣 Current Advisory</h3><p>${safe(adv.summary || 'No advisory loaded.')}</p><div class="chips"><span class="chip">${safe(adv.badge || adv.effectiveDate || 'No effective date')}</span><span class="chip">Offline fallback enabled</span><span class="chip">GitHub JSON ready</span></div></div></div></div>
        <div class="card span12"><div class="cardHead"><div><h3>Module Registry</h3><p>These modules are active or ready for future server/database integration.</p></div><span class="badge info">${safe(V95_VERSION)}</span></div><div class="v95ModuleGrid">${mods.map(m=>`<div class="v95Module"><div class="ico">${safe(m.icon)}</div><b>${safe(m.name)}</b><span class="badge ${/active/i.test(m.status)?'ok':'info'} status">${safe(m.status)}</span><p class="tiny">${safe(m.detail)}</p></div>`).join('')}</div></div>
        <div class="card span12"><div class="cardHead"><div><h3>Live Fare Preview</h3><p>Fares can change automatically based on effective dates from the online config.</p></div><button onclick="renderApp('fare_board')">Open Full Fare Board</button></div>${fareCards(8)}</div>
      </div>`;
  }

  function renderPassengerHub(){
    installStyles();
    if(typeof setTitle === 'function') setTitle('Passenger Hub','Self-service trip, fares, advisory, and claim tools');
    const content = byId('content'); if(!content) return;
    const current = (typeof pickTrip === 'function') ? pickTrip() : null;
    const adv = statusInfo().advisory || getConfig().advisory || {};
    content.innerHTML = `${typeof hero === 'function' ? hero('Passenger Self-Service Hub','Quickly check the next vessel, updated fares, advisory notices, and claim tools.','Online Passenger Portal') : ''}
      <div class="grid">
        <div class="card span7"><div class="cardHead"><div><h3>Now / Next Vessel</h3><p>Calculated automatically from the current device time and route filter.</p></div>${networkBadge()}</div>${current?`<div class="nowBox"><span class="statusPill ${statusClass(current.status)}">${safe(current.status)}</span><h2>${safe(current.vessel)}</h2><div>${safe(current.routeLabel)} · ${safe(current.gate)} · Departs ${safe(current.dep)}</div><div class="metricGrid"><div class="metric"><span>Boarding</span><b>${formatTime(current.boarding)}</b></div><div class="metric"><span>Arrival</span><b>${safe(current.arr || '-')}</b></div><div class="metric"><span>Travel</span><b>${safe(current.travel || '-')}</b></div><div class="metric"><span>Status</span><b>${safe(current.status)}</b></div></div></div>`:'<div class="empty">No current trip available.</div>'}<div class="v95ActionBar"><button class="primary" onclick="useCurrentTripForBaggage()">Use Current Trip for Baggage</button><button onclick="renderApp('claim')">File Claim</button><button onclick="renderApp('trips')">View Schedules</button></div></div>
        <div class="card span5"><div class="cardHead"><div><h3>Advisory</h3><p>${safe(adv.title || 'Passenger Notice')}</p></div><span class="badge warn">${safe(adv.badge || '')}</span></div><div class="notice good">${safe(adv.summary || 'No advisory loaded.')}</div><div class="v95ActionBar"><button onclick="renderApp('fare_board')">View Updated Fares</button><button onclick="OJ_V95.copyPublicLink()">Copy Site Link</button></div><p id="v95CopyOut" class="tiny v95Clipboard"></p></div>
        <div class="card span12"><div class="cardHead"><div><h3>Updated Fare Preview</h3><p>Routes from the automatic fare engine.</p></div></div>${fareCards(12)}</div>
      </div>`;
  }

  function computeAlerts(){
    const cfg = getConfig();
    const rules = cfg.smartAlertRules || {}; const watch = (rules.watchConnectionRemarks || ['connect','via','connection']).map(x => String(x).toLowerCase());
    let rows = [];
    try{ rows = (typeof scheduleTrips === 'function' ? scheduleTrips(0).concat(scheduleTrips(1).slice(0,8)) : []); }catch{}
    return rows.slice(0,80).map(t => {
      const mins = Math.round((t.departure - new Date()) / 60000);
      const text = `${t.remarks || ''} ${t.routeLabel || ''}`.toLowerCase();
      let level = 'low'; let reason = 'Normal scheduled monitoring';
      if(['Delayed','Cancelled'].includes(t.status)){ level='high'; reason = `${t.status} trip needs staff/passenger attention`; }
      else if(t.status === 'Boarding' || mins <= 15 && mins >= -10){ level='high'; reason = 'Boarding window or immediate departure'; }
      else if(t.status === 'Departing Soon' || mins <= 45 && mins > 15){ level='medium'; reason = 'Departure is approaching'; }
      else if(watch.some(w => text.includes(w))){ level='medium'; reason = 'Connection/via route should be monitored'; }
      return {id:t.id, level, reason, vessel:t.vessel, route:t.routeLabel, dep:t.dep, gate:t.gate, status:t.status, mins};
    }).sort((a,b) => { const rank = {high:0, medium:1, low:2}; return (rank[a.level] - rank[b.level]) || (a.mins - b.mins); });
  }
  function renderSmartAlerts(){
    installStyles();
    if(typeof setTitle === 'function') setTitle('Smart Alerts','Boarding, delay, cancellation, and connection-watch alerts');
    const content = byId('content'); if(!content) return;
    const alerts = computeAlerts();
    const counts = alerts.reduce((a,x)=>(a[x.level]=(a[x.level]||0)+1,a),{});
    content.innerHTML = `${typeof hero === 'function' ? hero('Smart Alerts Center','Rule-based operational alerts for staff. Built now, ready for future weather/GPS/database feeds.','AI-Ready Logic') : ''}
      <div class="grid">
        <div class="card span12"><div class="v95MiniBoard"><div class="v95MiniMetric"><span>High Attention</span><b>${counts.high||0}</b></div><div class="v95MiniMetric"><span>Monitor</span><b>${counts.medium||0}</b></div><div class="v95MiniMetric"><span>Normal</span><b>${counts.low||0}</b></div><div class="v95MiniMetric"><span>Network</span><b>${navigator.onLine?'Online':'Offline'}</b></div></div><div class="v95ActionBar"><button class="primary" onclick="OJ_V95.exportAlerts()">Export Alerts JSON</button><button onclick="OJ_V95.requestNotify()">Enable Local Notifications</button><button onclick="OJ_V95.testNotify()">Test Notification</button></div></div>
        <div class="card span12"><div class="cardHead"><div><h3>Alert Feed</h3><p>Generated from trip status, departure time, and connection/via remarks.</p></div><button onclick="renderApp('smart_alerts')">Refresh</button></div>${alerts.slice(0,30).map(a=>`<div class="v95Alert ${safe(a.level)}"><div class="row"><b>${safe(a.vessel)} · ${safe(a.route)}</b><span class="right badge ${a.level==='high'?'bad':a.level==='medium'?'warn':'ok'}">${safe(a.level.toUpperCase())}</span></div><div>${safe(a.reason)}</div><div class="tiny">${safe(a.status)} · ${safe(a.gate)} · Departure ${safe(a.dep)} · ${Number.isFinite(a.mins)?safe(a.mins+' min'):''}</div></div>`).join('') || '<div class="empty">No alerts right now.</div>'}</div>
      </div>`;
  }

  function renderCloudHub(){
    installStyles();
    if(typeof setTitle === 'function') setTitle('Cloud Hub','Remote JSON, sync endpoint, backup, and future database bridge');
    const content = byId('content'); if(!content) return;
    const info = statusInfo(); const st = info.status || {}; const cfg = getConfig(); const store = getStore();
    content.innerHTML = `${typeof hero === 'function' ? hero('Cloud Bridge + Online Control','Connect GitHub JSON today and prepare for Google Apps Script, Firebase, Supabase, or a future admin database.','Online Infrastructure') : ''}
      <div class="grid">
        <div class="card span6"><div class="cardHead"><div><h3>Remote Config</h3><p>Read-only online settings for fares, advisory, feature flags, and modules.</p></div><span class="badge ${st.remoteOk===false?'warn':'ok'}">${st.remoteOk===false?'Fallback':'Ready'}</span></div><label>Config URL<input id="v95ConfigUrl" value="${safe(info.remoteUrl || './online-config.json')}"></label><div class="v95ActionBar"><button class="primary" onclick="OJ_V95.saveConfigUrl()">Save URL</button><button onclick="OJ_V95.syncConfig()">Sync Now</button><button onclick="downloadOnlineConfigTemplate()">Download Template</button></div><div class="notice" style="margin-top:12px">Current version: <b>${safe(st.configVersion || cfg.version || 'local')}</b><br>Applied routes: <b>${safe(st.appliedRoutes || 0)}</b></div></div>
        <div class="card span6"><div class="cardHead"><div><h3>Future Database Endpoint</h3><p>Use this later for writable online systems. For now, local storage remains safe.</p></div>${networkBadge()}</div><label>Cloud / Apps Script URL<input id="v95CloudUrl" value="${safe(store.cloudUrl || state?.data?.settings?.syncUrl || '')}" placeholder="https://script.google.com/... or future API endpoint"></label><div class="v95ActionBar"><button class="primary" onclick="OJ_V95.saveCloudUrl()">Save Endpoint</button><button onclick="OJ_V95.exportSyncPayload()">Download Sync Payload</button><button onclick="OJ_V95.copyPayloadSummary()">Copy Summary</button></div><p id="v95CloudOut" class="tiny v95Clipboard"></p></div>
        <div class="card span12"><div class="cardHead"><div><h3>Feature Flags</h3><p>Remote-ready switches from online-config.json.</p></div><button onclick="OJ_V95.exportOnlineConfig()">Export Current Online Config</button></div><div class="chips">${Object.entries(cfg.featureFlags || {}).map(([k,v])=>`<span class="chip">${safe(k)}: ${v?'ON':'OFF'}</span>`).join('') || '<span class="chip">No feature flags loaded</span>'}</div></div>
        <div class="card span12"><div class="cardHead"><div><h3>Online Module Map</h3><p>Modules currently known by V95.</p></div></div><div class="v95ModuleGrid">${moduleData().map(m=>`<div class="v95Module"><div class="ico">${safe(m.icon)}</div><b>${safe(m.name)}</b><span class="badge info status">${safe(m.status)}</span><p class="tiny">${safe(m.detail)}</p></div>`).join('')}</div></div>
      </div>`;
  }

  function renderCounterPlus(){
    installStyles();
    if(typeof setTitle === 'function') setTitle('Counter Plus','Cashier online-ready counter tools and daily summaries');
    const content = byId('content'); if(!content) return;
    const current = (typeof pickTrip === 'function') ? pickTrip() : null;
    const today = new Date().toISOString().slice(0,10);
    const tx = (state?.data?.transactions || []).filter(x => x.date === today);
    const total = tx.reduce((a,x)=>a+(Number(x.total)||0),0);
    content.innerHTML = `${typeof hero === 'function' ? hero('Cashier Counter Plus','Online-ready quick counter dashboard layered above the preserved baggage calculator.','Cashier Upgrade') : ''}
      <div class="grid">
        <div class="card span12"><div class="v95MiniBoard"><div class="v95MiniMetric"><span>Receipts Today</span><b>${tx.length}</b></div><div class="v95MiniMetric"><span>Baggage Revenue</span><b>${money(total)}</b></div><div class="v95MiniMetric"><span>Current Trip</span><b>${safe(current?.vessel || '—')}</b></div><div class="v95MiniMetric"><span>Mode</span><b>${navigator.onLine?'Online-ready':'Offline'}</b></div></div><div class="v95ActionBar"><button class="primary" onclick="renderApp('calculator')">Open Baggage Calculator</button><button onclick="useCurrentTripForBaggage()">Link Current Trip</button><button onclick="renderApp('receipt')">Receipts</button><button onclick="renderApp('fare_board')">Fare Board</button></div></div>
        <div class="card span6"><div class="cardHead"><div><h3>Next Counter Trip</h3><p>Use this to prepare baggage processing for the next vessel.</p></div></div>${current?`<div class="nowBox"><span class="statusPill ${statusClass(current.status)}">${safe(current.status)}</span><h2>${safe(current.vessel)}</h2><div>${safe(current.routeLabel)} · ${safe(current.gate)} · ${safe(current.dep)}</div></div>`:'<div class="empty">No trip found.</div>'}</div>
        <div class="card span6"><div class="cardHead"><div><h3>Updated Fare Snapshot</h3><p>Passenger fare fields from the online engine. Baggage formula remains unchanged.</p></div></div>${fareCards(4)}</div>
      </div>`;
  }

  function renderFareBoard(){
    installStyles();
    if(typeof setTitle === 'function') setTitle('Fare Board','Automatic fare schedule and effective-date preview');
    const content = byId('content'); if(!content) return;
    const info = statusInfo(); const adv = info.advisory || getConfig().advisory || {};
    const rows = fareRows(80);
    content.innerHTML = `${typeof hero === 'function' ? hero('Online Fare Board','Live route fare preview from the V95 online fare engine.','Effective-Date Engine') : ''}
      <div class="grid">
        <div class="card span12"><div class="cardHead"><div><h3>${safe(adv.title || 'Fare Advisory')}</h3><p>${safe(adv.summary || '')}</p></div><span class="badge warn">${safe(adv.badge || '')}</span></div><div class="v95ActionBar"><button class="primary" onclick="OJ_V95.exportFareCSV()">Export Fare CSV</button><button onclick="renderApp('cloud_hub')">Online Config</button></div></div>
        <div class="card span12"><div class="tableWrap"><table><thead><tr><th>Route</th><th>Tourist/Open Air</th><th>Business</th><th>Student</th><th>Minor</th><th>Effective</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${safe(r.label)}</b><br><span class="tiny">${safe(r.key)}</span></td><td>${money(r.fare?.['TC/OA'])}</td><td>${money(r.fare?.BC)}</td><td>${money(r.fare?.ST)}</td><td>${money(r.fare?.MI)}</td><td>${safe(r.effectiveDate)}</td><td><span class="badge ${r.applied?'ok':'warn'}">${r.applied?'Active':'Scheduled'}</span></td></tr>`).join('')}</tbody></table></div></div>
      </div>`;
  }

  function saveConfigUrl(){
    const url = byId('v95ConfigUrl')?.value.trim() || './online-config.json';
    try{ engine()?.setRemoteUrl?.(url); }catch{}
    callAudit('V95 config URL saved', url);
    toastV95('V95 config URL saved');
  }
  async function syncConfig(){
    const url = byId('v95ConfigUrl')?.value.trim() || './online-config.json';
    try{ const res = await engine()?.refresh?.(url); callAudit('V95 config synced', `${res?.configVersion || 'unknown'} · routes ${res?.appliedRoutes || 0}`); toastV95(res?.remoteOk === false ? 'Using offline fallback' : 'V95 config synced'); if(typeof renderApp === 'function') renderApp('cloud_hub'); }
    catch(err){ toastV95('Config sync failed: '+err.message); }
  }
  function saveCloudUrl(){
    const url = byId('v95CloudUrl')?.value.trim() || '';
    setStore({cloudUrl:url});
    try{ if(state?.data?.settings){ state.data.settings.syncUrl = url; if(typeof save === 'function') save(); } }catch{}
    callAudit('V95 cloud endpoint saved', url ? 'endpoint set' : 'endpoint cleared');
    toastV95('Cloud endpoint saved');
  }
  function exportSyncPayload(){
    let payload;
    try{ payload = typeof syncPayload === 'function' ? syncPayload() : {version:'V95', state}; }catch{ payload = {version:'V95', exportedAt:new Date().toISOString()}; }
    payload.v95 = {moduleLayer:V95_VERSION, onlineModules:moduleData(), featureFlags:getConfig().featureFlags || {}, exportedAt:new Date().toISOString()};
    downloadFile('OceanJet_V95_Cloud_Sync_Payload_'+Date.now()+'.json', JSON.stringify(payload, null, 2), 'application/json');
    callAudit('V95 sync payload exported','JSON');
  }
  function copyPayloadSummary(){
    const summary = `OceanJet V95 Summary\nGenerated: ${nowText()}\nRole: ${state?.role || '-'}\nRoutes: ${typeof ROUTES !== 'undefined' ? Object.keys(ROUTES).length : 0}\nTransactions: ${state?.data?.transactions?.length || 0}\nClaims: ${state?.data?.claims?.length || 0}\nEvidence: ${state?.data?.cases?.length || 0}\nOnline config: ${(statusInfo().status || {}).configVersion || getConfig().version || 'local'}`;
    navigator.clipboard?.writeText(summary).then(()=>toastV95('Summary copied')).catch(()=>{});
    const out = byId('v95CloudOut'); if(out) out.textContent = summary;
  }
  function exportOnlineConfig(){ downloadFile('OceanJet_V95_Current_Online_Config_'+Date.now()+'.json', JSON.stringify(getConfig(), null, 2), 'application/json'); }
  function exportModuleMap(){ downloadFile('OceanJet_V95_Module_Map_'+Date.now()+'.json', JSON.stringify({version:V95_VERSION, generatedAt:new Date().toISOString(), modules:moduleData(), featureFlags:getConfig().featureFlags || {}}, null, 2), 'application/json'); }
  function exportAlerts(){ downloadFile('OceanJet_V95_Smart_Alerts_'+Date.now()+'.json', JSON.stringify({version:V95_VERSION, generatedAt:new Date().toISOString(), alerts:computeAlerts()}, null, 2), 'application/json'); }
  function exportFareCSV(){
    const rows = [['routeKey','route','tourist_open_air','business','student','minor','effective','status']].concat(fareRows(1000).map(r=>[r.key,r.label,r.fare?.['TC/OA'],r.fare?.BC,r.fare?.ST,r.fare?.MI,r.effectiveDate,r.applied?'active':'scheduled']));
    downloadFile('OceanJet_V95_Fare_Board_'+Date.now()+'.csv', rows.map(r=>r.map(c=>`"${String(c ?? '').replace(/"/g,'""')}"`).join(',')).join('\n'), 'text/csv');
  }
  function copyPublicLink(){
    const link = location.href.split('#')[0];
    navigator.clipboard?.writeText(link).then(()=>toastV95('Site link copied')).catch(()=>{});
    const out = byId('v95CopyOut'); if(out) out.textContent = link;
  }
  async function requestNotify(){
    if(!('Notification' in window)){ toastV95('Notifications not supported on this browser'); return; }
    const permission = await Notification.requestPermission();
    toastV95(permission === 'granted' ? 'Notifications enabled' : 'Notifications not enabled');
  }
  function testNotify(){
    if(!('Notification' in window)){ toastV95('Notifications not supported'); return; }
    if(Notification.permission !== 'granted'){ toastV95('Enable notifications first'); return; }
    new Notification('OceanJet PortDesk V95', {body:'Smart Alerts are ready for boarding, delay, and advisory notices.', icon:'icons/icon-192.png'});
  }

  function installRouter(){
    if(window.__OJ_V95_ROUTER_INSTALLED__) return;
    window.__OJ_V95_ROUTER_INSTALLED__ = true;
    const base = window.renderApp;
    const customViews = {
      modules: renderModules,
      passenger_hub: renderPassengerHub,
      fare_board: renderFareBoard,
      smart_alerts: renderSmartAlerts,
      cloud_hub: renderCloudHub,
      counter_plus: renderCounterPlus
    };
    window.renderApp = function(view){
      if(customViews[view]){
        try{ state.view = view; if(typeof save === 'function') save(); }catch{}
        try{ if(typeof closeSidebar === 'function') closeSidebar(); }catch{}
        try{ if(typeof renderShell === 'function') renderShell(); }catch{}
        customViews[view]();
        return;
      }
      return base.apply(this, arguments);
    };
  }

  ensureRoleNavs();
  installRouter();
  window.OJ_V95 = {version:V95_VERSION, renderModules, renderPassengerHub, renderSmartAlerts, renderCloudHub, renderCounterPlus, renderFareBoard, exportModuleMap, exportAlerts, exportFareCSV, exportSyncPayload, exportOnlineConfig, copyPublicLink, saveConfigUrl, syncConfig, saveCloudUrl, copyPayloadSummary, requestNotify, testNotify, computeAlerts};
  window.addEventListener('online', () => toastV95('OceanJet V95 is online'));
  window.addEventListener('offline', () => toastV95('OceanJet V95 is offline; local mode active'));
  document.addEventListener('DOMContentLoaded', () => {
    installStyles();
    try{ document.title = 'OceanJet PortDesk V95 Online Systems'; }catch{}
    try{ const version = byId('versionText'); if(version) version.textContent = 'V95 Online Systems'; }catch{}
    try{ if(typeof renderShell === 'function') renderShell(); }catch{}
    console.info('OceanJet V95 online module layer loaded');
  });
})();
