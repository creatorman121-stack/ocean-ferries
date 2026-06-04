/* OceanJet PortDesk V95 Online Fare + Modules Engine
   Safe online-ready layer loaded after data.js and before app.js.
   It applies scheduled fare changes immediately, then optionally refreshes from online-config.json or a staff-provided remote URL. */
(function(){
  'use strict';
  const STORE_KEY = 'ojpd:onlineConfigUrl';
  const LOCAL_CONFIG_URL = './online-config.json';
  const EFFECTIVE_JUNE_8 = '2026-06-08';
  const DEFAULT_CONFIG = {
    schema: 'oceanjet-portdesk-online-config/v1',
    version: '2026.06.08-fare-reduction',
    sourceName: 'Bundled V95 local schedule',
    status: 'active',
    lastUpdated: '2026-06-04T00:00:00+08:00',
    advisory: {
      id: 'fare-advisory-2026-06-08',
      title: 'Temporary Fuel Surcharge Reduction',
      effectiveDate: EFFECTIVE_JUNE_8,
      badge: 'Effective June 8, 2026',
      summary: 'Selected OceanJet routes will automatically use reduced Tourist/Open Air and Business Class fares starting June 8, 2026.',
      body: [
        'Following recent improvements in fuel prices, OceanJet will implement a reduction in the temporary fuel surcharge adjustment on selected routes.',
        'A portion of the surcharge remains temporary to sustain safe and reliable operations and will be removed once fuel prices return to normal levels.',
        'Routes not listed will remain unchanged at this time.'
      ]
    },
    fareSchedules: [
      {
        id: 'temporary-fuel-surcharge-reduction-2026-06-08',
        effectiveDate: EFFECTIVE_JUNE_8,
        timezone: 'Asia/Manila',
        mode: 'mergeFareFields',
        autoPassengerDiscounts: true,
        routes: {
          cebu_tagbilaran: {'TC/OA':920, BC:1550}, tagbilaran_cebu: {'TC/OA':920, BC:1550},
          cebu_ormoc: {'TC/OA':1400, BC:1950}, ormoc_cebu: {'TC/OA':1400, BC:1950},
          cebu_getafe: {'TC/OA':560, BC:1000}, getafe_cebu: {'TC/OA':560, BC:1000},
          tagbilaran_siquijor: {'TC/OA':950, BC:1550}, siquijor_tagbilaran: {'TC/OA':950, BC:1550},
          siquijor_dumaguete: {'TC/OA':450, BC:750}, dumaguete_siquijor: {'TC/OA':450, BC:750},
          tagbilaran_dumaguete: {'TC/OA':1100, BC:1750}, dumaguete_tagbilaran: {'TC/OA':1100, BC:1750},
          cebu_palompon: {'TC/OA':1400, BC:1950}, palompon_cebu: {'TC/OA':1400, BC:1950},
          cebu_maasin: {'TC/OA':1400, BC:1950}, maasin_cebu: {'TC/OA':1400, BC:1950},
          maasin_surigao: {'TC/OA':1000, BC:1550}, surigao_maasin: {'TC/OA':1000, BC:1550}
        }
      }
    ],
    features: {
      remoteConfig: true,
      onlineFareEngine: true,
      offlineFallback: true,
      autoFareSwitch: true,
      advisoryBanner: true,
      damageDetectorAddon: true,
      v95ModuleHub: true,
      smartAlerts: true,
      passengerHub: true,
      cloudBridge: true,
      cashierCounterPlus: true
    }
  };

  function todayManila(){
    try{
      const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Manila', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(new Date());
      const map = Object.fromEntries(parts.map(p=>[p.type,p.value]));
      return `${map.year}-${map.month}-${map.day}`;
    }catch{ return new Date().toISOString().slice(0,10); }
  }
  function isEffective(dateText, today=todayManila()){
    return String(today) >= String(dateText || '9999-12-31');
  }
  function copy(obj){ return JSON.parse(JSON.stringify(obj)); }
  function normalizeFare(fare, autoDiscounts){
    const out = Object.assign({}, fare || {});
    const tourist = Number(out['TC/OA']);
    if(autoDiscounts && Number.isFinite(tourist)){
      out.ST = Math.round(tourist * 0.80 * 100) / 100;
      out.MI = Math.round(tourist * 0.50 * 100) / 100;
    }
    return out;
  }
  function applySchedule(schedule, sourceName){
    if(!schedule || !isEffective(schedule.effectiveDate)) return {applied:false, routeCount:0};
    if(typeof ROUTES === 'undefined') return {applied:false, routeCount:0, error:'ROUTES unavailable'};
    let count = 0;
    Object.entries(schedule.routes || {}).forEach(([routeKey, fare]) => {
      if(!ROUTES[routeKey]) return;
      ROUTES[routeKey].fare = Object.assign({}, ROUTES[routeKey].fare || {}, normalizeFare(fare, schedule.autoPassengerDiscounts !== false));
      ROUTES[routeKey].fareEffectiveDate = schedule.effectiveDate;
      ROUTES[routeKey].fareSource = sourceName || schedule.id || 'online-config';
      count++;
    });
    return {applied:count>0, routeCount:count, scheduleId:schedule.id || '', effectiveDate:schedule.effectiveDate};
  }
  function applyConfig(config, sourceName){
    const cfg = Object.assign({}, DEFAULT_CONFIG, config || {});
    const results = (cfg.fareSchedules || []).map(s => applySchedule(s, sourceName || cfg.sourceName || cfg.version));
    window.OJ_ONLINE_CONFIG = cfg;
    window.OJ_ONLINE_STATUS = {
      ok: true,
      mode: sourceName || cfg.sourceName || 'local',
      configVersion: cfg.version || '',
      checkedAt: new Date().toISOString(),
      today: todayManila(),
      appliedRoutes: results.reduce((a,r)=>a+(r.routeCount||0),0),
      schedules: results
    };
    document.dispatchEvent(new CustomEvent('oj-online-config-applied', {detail: window.OJ_ONLINE_STATUS}));
    return window.OJ_ONLINE_STATUS;
  }
  function getRemoteUrl(){
    try{ return localStorage.getItem(STORE_KEY) || LOCAL_CONFIG_URL; }catch{ return LOCAL_CONFIG_URL; }
  }
  function setRemoteUrl(url){
    try{ localStorage.setItem(STORE_KEY, String(url || LOCAL_CONFIG_URL).trim() || LOCAL_CONFIG_URL); }catch{}
  }
  async function refresh(url=getRemoteUrl()){
    const chosen = String(url || LOCAL_CONFIG_URL).trim() || LOCAL_CONFIG_URL;
    try{
      const res = await fetch(chosen, {cache:'no-store'});
      if(!res.ok) throw new Error('HTTP ' + res.status);
      const cfg = await res.json();
      const status = applyConfig(cfg, chosen === LOCAL_CONFIG_URL ? 'Root online-config.json' : chosen);
      status.remoteOk = true;
      return status;
    }catch(err){
      window.OJ_ONLINE_STATUS = Object.assign({}, window.OJ_ONLINE_STATUS || {}, {remoteOk:false, remoteError:err.message, checkedAt:new Date().toISOString()});
      document.dispatchEvent(new CustomEvent('oj-online-config-error', {detail: window.OJ_ONLINE_STATUS}));
      return window.OJ_ONLINE_STATUS;
    }
  }
  function fareRows(){
    try{
      return Object.entries(ROUTES || {}).filter(([,r]) => r.fareEffectiveDate).map(([key,r]) => ({key, label:r.label, effectiveDate:r.fareEffectiveDate, fare:r.fare, source:r.fareSource}));
    }catch{return [];}
  }
  function publicStatus(){
    const cfg = window.OJ_ONLINE_CONFIG || DEFAULT_CONFIG;
    const status = window.OJ_ONLINE_STATUS || {};
    return {today:todayManila(), advisory:cfg.advisory, status, fareRows:fareRows(), remoteUrl:getRemoteUrl()};
  }
  function downloadTemplate(){
    const blob = new Blob([JSON.stringify(window.OJ_ONLINE_CONFIG || DEFAULT_CONFIG, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'online-config-template.json';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1200);
  }

  window.OJOnlineConfigEngine = {version:'V95 Online Fare + Modules Engine', DEFAULT_CONFIG, applyConfig, refresh, getRemoteUrl, setRemoteUrl, publicStatus, fareRows, downloadTemplate, todayManila, isEffective};
  applyConfig(DEFAULT_CONFIG, 'Bundled V95 local schedule');
  document.addEventListener('DOMContentLoaded', () => {
    refresh(getRemoteUrl()).then(() => {
      try{ if(typeof renderApp === 'function' && typeof state !== 'undefined') renderApp(state.view); }catch{}
    });
  });
})();
