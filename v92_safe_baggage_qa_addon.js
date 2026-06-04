/* OceanJet PortDesk V92 Safe Baggage QA + Damage Detector Addon
   Root-loaded, non-destructive addon for GitHub Pages.
   It does not replace app.js, data.js, schedules, or baggage formula. */
'use strict';
(function(){
  if(window.__OJ_V92_SAFE_QA_ADDON__) return;
  window.__OJ_V92_SAFE_QA_ADDON__ = true;
  const ADDON_VERSION = 'V92 Safe Root Addon / V93 Launch Pack';
  const STORE_KEY = 'oceanjet_portdesk_v92_damage_detector_records';

  const byId = id => document.getElementById(id);
  const safe = v => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const nowText = () => new Date().toLocaleString('en-PH', {dateStyle:'medium', timeStyle:'short'});
  const uid = () => 'det-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7);
  const records = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; } };
  const saveRecords = list => localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0,250)));
  const downloadFile = (name, content, type) => {
    const blob = new Blob([content], {type});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1200);
  };
  function addonToast(message){
    const el = byId('toast');
    if(!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(addonToast.timer);
    addonToast.timer = setTimeout(()=>el.classList.remove('show'), 2400);
  }
  function installStyles(){
    if(byId('ojV92AddonStyles')) return;
    const style = document.createElement('style');
    style.id = 'ojV92AddonStyles';
    style.textContent = `
      .addonPanel{border:1px solid rgba(0,172,215,.35);border-radius:22px;background:linear-gradient(135deg,rgba(0,172,215,.14),rgba(34,201,132,.08));padding:14px;margin-top:12px}
      .addonPreview{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-top:12px}
      .addonPreview figure{margin:0;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.045)}
      .addonPreview img{width:100%;height:125px;object-fit:cover;display:block}.addonPreview figcaption{padding:8px;font-size:.78rem;color:var(--muted)}
      .addonScore{font-size:2rem;font-weight:1000}.addonTools{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.addonDanger{background:linear-gradient(135deg,#ff5c7a,#be2949)!important;color:#fff!important}`;
    document.head.appendChild(style);
  }
  function guessDamageScore(type, notes, count){
    let score = 30;
    if(type) score += 18;
    if(notes && notes.trim().length >= 12) score += 18;
    if(count >= 2) score += 24;
    else if(count === 1) score += 12;
    if(/wet|broken|crack|tear|torn|dent|scratch|missing/i.test((type||'') + ' ' + (notes||''))) score += 10;
    return Math.min(100, score);
  }
  function fileToDataURL(file){
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }
  function routeOptions(){
    try{
      return Object.entries(ROUTES || {}).map(([k,r]) => `<option value="${safe(k)}">${safe(r.label || k)}</option>`).join('');
    }catch{return '<option value="">Route unavailable</option>';}
  }
  function tripOptions(){
    try{
      const trips = (typeof scheduleTrips === 'function') ? scheduleTrips(0).slice(0,60) : [];
      return ['<option value="">No linked trip</option>'].concat(trips.map(t => `<option value="${safe(t.id)}">${safe(t.vessel)} · ${safe(t.routeLabel)} · ${safe(t.dep)}</option>`)).join('');
    }catch{return '<option value="">No linked trip</option>';}
  }
  function evidenceRecordRows(){
    const list = records().slice(0,20);
    if(!list.length) return '<div class="empty">No detector records yet.</div>';
    return `<div class="tableWrap"><table><thead><tr><th>Time</th><th>Passenger</th><th>Damage</th><th>Images</th><th>Score</th></tr></thead><tbody>${list.map(x=>`<tr><td>${safe(x.time)}</td><td><b>${safe(x.name||'-')}</b><br><span class="tiny">${safe(x.routeLabel||'No route')}</span></td><td>${safe(x.type)}<br><span class="tiny">${safe(x.notes||'')}</span></td><td>${(x.images||[]).length}</td><td><b>${x.score}%</b></td></tr>`).join('')}</tbody></table></div>`;
  }
  function renderDamageDetector(){
    installStyles();
    if(typeof setTitle === 'function') setTitle('Damage Detector','Safe root addon, batch preview, QA export');
    const content = byId('content');
    if(!content) return;
    const heroHtml = (typeof hero === 'function') ? hero('Damage Detector + QA Addon','Manual staff-controlled image review, batch pairing, evidence score, and export tools.','Root Addon Active') : '';
    content.innerHTML = heroHtml + `<div class="grid">
      <div class="card span7">
        <div class="cardHead"><div><h3>New Damage Detector Record</h3><p>Upload claim-stub/damage photos manually. The addon previews and scores completeness without changing the original baggage formula.</p></div><span class="badge info">${safe(ADDON_VERSION)}</span></div>
        <div class="formGrid">
          <label>Passenger / Claim Name<input id="detName" placeholder="Passenger name or claim label"></label>
          <label>Route<select id="detRoute">${routeOptions()}</select></label>
          <label>Trip<select id="detTrip">${tripOptions()}</select></label>
          <label>Damage Type<select id="detType"><option>Scratch / dent</option><option>Broken wheel / handle</option><option>Wet baggage</option><option>Torn baggage</option><option>Missing contents</option><option>Other</option></select></label>
        </div>
        <label style="margin-top:12px">Notes<textarea id="detNotes" placeholder="Describe visible damage, location, color, size, and staff observation"></textarea></label>
        <label style="margin-top:12px">Batch Photos<input id="detFiles" type="file" accept="image/*" multiple></label>
        <div id="detPreview" class="addonPreview"></div>
        <div class="addonPanel"><div class="row"><div><div class="tiny">Evidence Completeness Score</div><div id="detScore" class="addonScore">0%</div></div><span class="right badge info">Manual-only detector</span></div><div class="tiny">Score is based on metadata completeness and number of images. It is not an automatic legal finding.</div></div>
        <div class="addonTools"><button class="primary" onclick="OJDamageDetector.save()">Save Detector Record</button><button onclick="OJDamageDetector.clear()">Clear</button><button onclick="OJDamageDetector.runBaggageQA()">Run Baggage Formula QA</button></div>
      </div>
      <div class="card span5">
        <div class="cardHead"><div><h3>Detector Log</h3><p>Stored locally in this browser. Export before clearing cache.</p></div></div>
        <div id="detLog">${evidenceRecordRows()}</div>
        <div class="addonTools"><button onclick="OJDamageDetector.exportCSV()">Export CSV</button><button onclick="OJDamageDetector.exportJSON()">Export JSON</button><button class="addonDanger" onclick="OJDamageDetector.clearLog()">Clear Log</button></div>
      </div>
      <div class="card span12"><div class="cardHead"><div><h3>Safe Integration Status</h3><p>This addon is loaded from the root and does not replace app.js/data.js.</p></div><span class="badge ok">Non-destructive</span></div><div class="chips"><span class="chip">Original baggage calculator preserved</span><span class="chip">V91 source data preserved</span><span class="chip">Root addon active</span><span class="chip">GitHub Pages ready</span></div></div>
    </div>`;
    wireDetectorInputs();
  }
  function wireDetectorInputs(){
    const files = byId('detFiles');
    const type = byId('detType');
    const notes = byId('detNotes');
    [files,type,notes].forEach(el => el && el.addEventListener('input', updateDetectorPreview));
    if(files) files.addEventListener('change', updateDetectorPreview);
  }
  async function updateDetectorPreview(){
    const files = Array.from(byId('detFiles')?.files || []).slice(0,10);
    const type = byId('detType')?.value || '';
    const notes = byId('detNotes')?.value || '';
    const score = guessDamageScore(type, notes, files.length);
    const scoreEl = byId('detScore'); if(scoreEl) scoreEl.textContent = score + '%';
    const preview = byId('detPreview');
    if(!preview) return;
    preview.innerHTML = '';
    for(const file of files){
      const url = URL.createObjectURL(file);
      const fig = document.createElement('figure');
      fig.innerHTML = `<img src="${url}" alt="${safe(file.name)}"><figcaption>${safe(file.name)}<br>${Math.round(file.size/1024)} KB</figcaption>`;
      preview.appendChild(fig);
    }
  }
  async function saveDetectorRecord(){
    const files = Array.from(byId('detFiles')?.files || []).slice(0,10);
    if(!files.length){ addonToast('Upload at least one photo'); return; }
    const routeKey = byId('detRoute')?.value || '';
    let routeLabel = routeKey;
    try{ routeLabel = ROUTES[routeKey]?.label || routeKey; }catch{}
    const type = byId('detType')?.value || '';
    const notes = byId('detNotes')?.value || '';
    const imgs = [];
    for(const f of files){ imgs.push({name:f.name, size:f.size, type:f.type, data: await fileToDataURL(f)}); }
    const item = {id:uid(), time:nowText(), name:byId('detName')?.value.trim() || '', routeKey, routeLabel, tripId:byId('detTrip')?.value || '', type, notes, score:guessDamageScore(type, notes, files.length), images:imgs};
    const list = records(); list.unshift(item); saveRecords(list);
    addonToast('Damage detector record saved');
    renderDamageDetector();
  }
  function clearDetectorForm(){ renderDamageDetector(); }
  function exportCSV(){
    const rows = [['id','time','name','route','tripId','damageType','notes','imageCount','score']].concat(records().map(x=>[x.id,x.time,x.name,x.routeLabel,x.tripId,x.type,x.notes,(x.images||[]).length,x.score]));
    downloadFile('OceanJet_Damage_Detector_'+Date.now()+'.csv', rows.map(r=>r.map(c=>`"${String(c??'').replace(/"/g,'""')}"`).join(',')).join('\n'), 'text/csv');
  }
  function exportJSON(){ downloadFile('OceanJet_Damage_Detector_'+Date.now()+'.json', JSON.stringify({addon:ADDON_VERSION, exportedAt:new Date().toISOString(), records:records()}, null, 2), 'application/json'); }
  function clearLog(){ if(confirm('Clear Damage Detector local log?')){ saveRecords([]); addonToast('Detector log cleared'); renderDamageDetector(); } }
  function runBaggageQAAddon(){
    try{
      if(typeof runBaggageQA === 'function') runBaggageQA();
      else addonToast('Baggage QA function unavailable');
    }catch(e){ addonToast('Baggage QA error: ' + e.message); }
  }
  function installNavAndRouter(){
    try{
      if(typeof ROLE_NAVS !== 'undefined' && ROLE_NAVS.admin && !ROLE_NAVS.admin.some(x=>x[0]==='damage_detector')){
        const insertAt = Math.max(0, ROLE_NAVS.admin.findIndex(x=>x[0]==='queue'));
        ROLE_NAVS.admin.splice(insertAt, 0, ['damage_detector','🔬','Damage Detector']);
      }
    }catch(e){}
    try{
      const original = renderApp;
      if(!original.__ojV92Wrapped){
        const wrapped = function(view = (typeof state !== 'undefined' ? state.view : 'dashboard')){
          if(view === 'damage_detector'){
            try{ if(typeof state !== 'undefined'){ state.view = view; if(typeof save === 'function') save(); } }catch{}
            try{ if(typeof closeSidebar === 'function') closeSidebar(); }catch{}
            try{ if(typeof renderShell === 'function') renderShell(); }catch{}
            renderDamageDetector();
            return;
          }
          return original(view);
        };
        wrapped.__ojV92Wrapped = true;
        renderApp = wrapped;
      }
    }catch(e){}
  }
  window.OJDamageDetector = {open:renderDamageDetector, save:saveDetectorRecord, clear:clearDetectorForm, exportCSV, exportJSON, clearLog, runBaggageQA:runBaggageQAAddon, version:ADDON_VERSION};
  document.addEventListener('DOMContentLoaded', function(){
    installStyles();
    installNavAndRouter();
    try{ if(typeof renderShell === 'function') renderShell(); }catch{}
    console.info('OceanJet addon loaded:', ADDON_VERSION);
  });
})();
