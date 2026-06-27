/* ═══════════════════════════════════════════════════════════════
   Ocean Fast Ferries · Baggage Pro V300 — Utility Module
   ═══════════════════════════════════════════════════════════════ */

// ── DOM & Formatting ──
const $ = id => document.getElementById(id);
const fmtPHP = n => '₱' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const safeId = str => str.replace(/[^a-zA-Z0-9]/g, '_');
const titleCase = str => String(str || '').replace(/_/g,' ').replace(/\b\w/g, ch => ch.toUpperCase());
const routeName = key => CEBU_ROUTE_LABELS[key] || (DB.schedules?.[key]?.title || key).replace(/^Cebu to /i,'');

// ── Slab Cost Engine ──
function slabCost(E, rates) {
  const [r0, r1, r2] = rates;
  let t1 = Math.min(E, 10), rem = E - t1;
  let t2 = Math.min(Math.max(rem, 0), 30), rem2 = rem - t2;
  let t3 = Math.max(rem2, 0);
  return { t1, t2, t3, c1: t1*r0, c2: t2*r1, c3: t3*r2, total: t1*r0 + t2*r1 + t3*r2 };
}

// ── Connecting Fare Engine ──
function inferConnectingFareRule(route) {
  if (CONNECTING_FARE_RULES[route]) return CONNECTING_FARE_RULES[route];
  if (!route || !route.startsWith('cebu_')) return null;
  const dest = route.replace(/^cebu_/, '');
  const schedule = DB.schedules?.[route];
  const scheduleText = [
    schedule?.title || '',
    ...(schedule?.trips || []).flatMap(t => [t.remarks || '', t.vessel || ''])
  ].join(' ').toLowerCase();
  for (const via of KNOWN_CONNECTION_PORTS) {
    const firstLeg = `cebu_${via}`;
    const secondLeg = `${via}_${dest}`;
    const mentionsVia = scheduleText.includes(`via ${via}`) || scheduleText.includes(`through ${via}`) || scheduleText.includes(via);
    if (mentionsVia && DB.paxFares?.[firstLeg] && DB.paxFares?.[secondLeg]) {
      return { via: titleCase(via), legs: [firstLeg, secondLeg], inferred: true };
    }
  }
  return null;
}

function getPassengerFare(route) {
  const rule = inferConnectingFareRule(route);
  if (!rule) return DB.paxFares?.[route] || null;
  const combined = {};
  for (const cls of FARE_CLASSES) {
    let total = 0;
    for (const leg of rule.legs) {
      const amount = Number(DB.paxFares?.[leg]?.[cls]);
      if (!Number.isFinite(amount)) return DB.paxFares?.[route] || null;
      total += amount;
    }
    combined[cls] = total;
  }
  return combined;
}

function fareBreakdownHtml(route) {
  const rule = inferConnectingFareRule(route);
  if (!rule) return '';
  const rows = rule.legs.map(leg => {
    const fare = DB.paxFares?.[leg] || {};
    return `<tr><td>${DB.schedules?.[leg]?.title || titleCase(leg)}</td><td style="text-align:right">${fmtPHP(Number(fare['TC/OA']||0))}</td><td style="text-align:right">${fmtPHP(Number(fare['BC']||0))}</td></tr>`;
  }).join('');
  return `<div style="margin-top:10px;padding:10px;background:rgba(244,63,94,0.08);border:1px solid var(--border);border-radius:10px;font-size:0.78rem">
    <b>🔗 Connecting fare via ${rule.via}</b><br>
    <span style="color:var(--text2)">Passenger fare is auto-calculated by adding each leg.</span>
    <table style="margin-top:6px"><tr><th>Leg</th><th style="text-align:right">Tourist</th><th style="text-align:right">Business</th></tr>${rows}</table>
  </div>`;
}

function applyConnectingPassengerFares() {
  const keys = new Set([...Object.keys(CONNECTING_FARE_RULES), ...Object.keys(DB.schedules || {})]);
  keys.forEach(route => {
    const rule = inferConnectingFareRule(route);
    if (!rule) return;
    const combined = getPassengerFare(route);
    if (combined) DB.paxFares[route] = combined;
  });
}

// ── Toast Notification ──
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// ── Haptic Feedback ──
function haptic(pattern) {
  if (!navigator.vibrate) return;
  navigator.vibrate(pattern || [12]);
}

// ── PDF Helpers ──
function pdfSafeText(t) {
  return String(t||'').replace(/₱/g,'PHP ').replace(/×/g,'x').replace(/→/g,'->')
    .replace(/[–—]/g,'-').replace(/[""\u201c\u201d]/g,'"').replace(/[''\u2018\u2019]/g,"'")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g,'');
}
function pdfEscape(t) {
  return pdfSafeText(t).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
}
function wrapPdfLine(line, maxLen=78) {
  const words = pdfSafeText(line).split(/\s+/);
  const out = []; let current = '';
  words.forEach(word => {
    if (!word) return;
    if ((current + ' ' + word).trim().length > maxLen) {
      if (current) out.push(current);
      current = word;
    } else current = (current + ' ' + word).trim();
  });
  if (current) out.push(current);
  return out.length ? out : [''];
}
function buildReceiptPDF(text) {
  const sourceLines = pdfSafeText(text).split(/\r?\n/);
  const lines = [];
  sourceLines.forEach((line, idx) => {
    if (idx === 0) return;
    wrapPdfLine(line, 74).forEach(w => lines.push(w));
  });
  let y = 790; const content = [];
  content.push('BT');
  content.push('/F1 18 Tf');
  content.push(`1 0 0 1 72 ${y} Tm (${pdfEscape('Ocean Fast Ferries')}) Tj`); y -= 26;
  content.push('/F1 11 Tf');
  content.push(`1 0 0 1 72 ${y} Tm (${pdfEscape('Baggage Fee Receipt')}) Tj`); y -= 22;
  content.push('/F1 10 Tf');
  content.push(`1 0 0 1 72 ${y} Tm (${pdfEscape('Generated: '+new Date().toLocaleString())}) Tj`); y -= 24;
  content.push('/F1 10 Tf');
  lines.forEach(line => {
    if (y < 70) return;
    content.push(`1 0 0 1 72 ${y} Tm (${pdfEscape(line)}) Tj`); y -= 15;
  });
  content.push('ET');
  const stream = content.join('\n');
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach(obj => { offsets.push(pdf.length); pdf += obj; });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length+1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach(offset => { pdf += String(offset).padStart(10,'0') + ' 00000 n \n'; });
  pdf += `trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}
function receiptFileStamp() { return new Date().toISOString().slice(0,19).replace(/:/g,'-'); }

// ── CSV Export Helper ──
function exportCSV(rows, filename) {
  const csvContent = rows.map(r =>
    r.map(v => {
      v = String(v == null ? '' : v);
      return /[",\n]/.test(v) ? '"' + v.replace(/"/g,'""') + '"' : v;
    }).join(',')
  ).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1200);
}

// ── Weight Category Suggest ──
function suggestWeightCategory(weight, mode) {
  if (!weight || weight <= 0) return null;
  const w = Number(weight);
  if (mode === 'fragile') {
    if (w <= 5)  return { label:'Delicate Electronics', icon:'💻', tip:'Cameras, laptops, instruments — highest fragility tier' };
    if (w <= 15) return { label:'Glassware / Ceramics', icon:'🏺', tip:'Fragile containers, decor, bottled goods' };
    if (w <= 30) return { label:'Heavy Fragile Equipment', icon:'🔬', tip:'Lab equipment, medical devices, precision tools' };
    return { label:'Oversize Fragile Cargo', icon:'📦', tip:'Large fragile items — may need special handling approval' };
  }
  if (w <= 10) return { label:'Personal Baggage', icon:'🧳', tip:'Within standard free allowance for tourist class' };
  if (w <= 20) return { label:'Extra Luggage', icon:'👜', tip:'Typical extra bag or checked suitcase — Tier 1 rate' };
  if (w <= 40) return { label:'Heavy Cargo', icon:'🏋️', tip:'Heavy shipment or multiple bags — Tier 2 rate applies' };
  return { label:'Bulk Freight', icon:'🚛', tip:'Very heavy cargo — Tier 3 highest rate, consider freight service' };
}
