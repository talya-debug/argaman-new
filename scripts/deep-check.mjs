import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const app = initializeApp({ apiKey: "AIzaSyDEVZMA7R6FLZBdkPg1GPVhv5AajwjWVb8", authDomain: "argaman-f3921.firebaseapp.com", projectId: "argaman-f3921", storageBucket: "argaman-f3921.firebasestorage.app", messagingSenderId: "1089830122540", appId: "1:1089830122540:web:36a7ef49e3c90e8d8acd89" });
const db = getFirestore(app);

function csv(path) { return parse(readFileSync(path, 'utf8'), { columns: true, skip_empty_lines: true, bom: true }); }

async function getFBdata(col) {
  const snap = await getDocs(collection(db, col));
  const map = {};
  snap.forEach(d => { map[d.id] = d.data(); });
  return map;
}

const b44Leads = csv('C:/Users/LENOVO/Downloads/Lead_export.csv');
const b44Quotes = csv('C:/Users/LENOVO/Downloads/Quote_export.csv');
const b44QL = csv('C:/Users/LENOVO/Downloads/QuoteLine_export.csv');
const b44Projects = csv('C:/Users/LENOVO/Downloads/Project_export.csv');
const b44Tasks = csv('C:/Users/LENOVO/Downloads/Task_export.csv');
const b44PE = csv('C:/Users/LENOVO/Downloads/ProgressEntry_export (1).csv');
const b44WL = csv('C:/Users/LENOVO/Downloads/WorkLogEntry_export.csv');
const b44PR = csv('C:/Users/LENOVO/Downloads/PurchaseRecord_export.csv');
const b44SC = csv('C:/Users/LENOVO/Downloads/SubContractor_export.csv');
const b44CT = csv('C:/Users/LENOVO/Downloads/CollectionTask_export.csv');

const fbLeads = await getFBdata('leads');
const fbQuotes = await getFBdata('quotes');
const fbQL = await getFBdata('quote_lines');
const fbProjects = await getFBdata('projects');
const fbTasks = await getFBdata('tasks');
const fbPE = await getFBdata('progress_entries');
const fbWL = await getFBdata('work_log_entries');
const fbPR = await getFBdata('purchase_records');
const fbSC = await getFBdata('sub_contractors');
const fbCT = await getFBdata('collection_tasks');

const projMap = {};
b44Projects.forEach(p => { projMap[p.id] = p.name; });

console.log('=== בדיקה מעמיקה — כל מודול ===\n');

// 1. לידים
console.log('━━━ לידים ━━━');
let leadOK = 0, leadMissing = 0;
b44Leads.forEach(l => {
  if (fbLeads[l.id]) leadOK++;
  else { leadMissing++; console.log('  חסר: ' + l.name); }
});
console.log('  סה"כ: ' + b44Leads.length + ' | ב-Firebase: ' + leadOK + ' | חסרים: ' + leadMissing);
console.log('');

// 2. הצעות מחיר — בדיקת מספר + סכום
console.log('━━━ הצעות מחיר ━━━');
let qOK = 0, qMissing = 0, qMismatch = 0;
b44Quotes.forEach(q => {
  const fb = fbQuotes[q.id];
  if (!fb) {
    qMissing++;
    // בדוק אם זו הצעה ישנה או חדשה
    const isNew = q.created_date && new Date(q.created_date) > new Date('2026-05-03');
    if (!isNew) return; // ישנות שנמחקו — כבר ידוע
    console.log('  חסרה: ' + (q.title || q.client_name) + ' | ' + q.quote_number + ' | ₪' + (q.total || 0));
  } else {
    const b44Total = Number(q.total) || 0;
    const fbTotal = Number(fb.total) || 0;
    if (Math.abs(b44Total - fbTotal) > 1) {
      qMismatch++;
      console.log('  פער סכום: ' + q.quote_number + ' | Base44=₪' + b44Total + ' Firebase=₪' + fbTotal);
    } else {
      qOK++;
    }
  }
});
console.log('  סה"כ: ' + b44Quotes.length + ' | תואמים: ' + qOK + ' | חסרים: ' + qMissing + ' | פער סכום: ' + qMismatch);
console.log('');

// 3. גבייה — סכום + סטטוס
console.log('━━━ גבייה ━━━');
let ctOK = 0, ctMissing = 0, ctMismatch = 0;
b44CT.forEach(c => {
  const fb = fbCT[c.id];
  if (!fb) { ctMissing++; console.log('  חסר: פרויקט=' + (projMap[c.project_id]||'—') + ' | ₪' + (c.amount_to_collect||'—') + ' | ' + (c.collection_status||'—')); }
  else {
    const b44Amt = Number(c.amount_to_collect) || 0;
    const fbAmt = Number(fb.amount_to_collect) || 0;
    const statusMatch = (fb.collection_status || '') === (c.collection_status || '');
    if (Math.abs(b44Amt - fbAmt) > 1 || !statusMatch) {
      ctMismatch++;
      if (Math.abs(b44Amt - fbAmt) > 1) console.log('  פער סכום: ' + (projMap[c.project_id]||'—') + ' | Base44=₪' + b44Amt + ' Firebase=₪' + fbAmt);
      if (!statusMatch) console.log('  פער סטטוס: ' + (projMap[c.project_id]||'—') + ' | Base44=' + c.collection_status + ' Firebase=' + fb.collection_status);
    } else { ctOK++; }
  }
});
console.log('  סה"כ: ' + b44CT.length + ' | תואמים: ' + ctOK + ' | חסרים: ' + ctMissing + ' | פערים: ' + ctMismatch);
console.log('');

// 4. רכש פעיל
console.log('━━━ רכש (פעיל — לא "טרם הוזמן") ━━━');
const activePR = b44PR.filter(r => r.status !== 'טרם הוזמן');
let prOK = 0, prMissing = 0, prMismatch = 0;
activePR.forEach(r => {
  const fb = fbPR[r.id];
  if (!fb) { prMissing++; console.log('  חסר: ' + (r.name_snapshot||r.manual_item_name||'—') + ' | ' + r.status + ' | ₪' + (r.actual_total_cost||'—') + ' | ' + (projMap[r.project_id]||'—')); }
  else {
    const b44Amt = Number(r.actual_total_cost) || 0;
    const fbAmt = Number(fb.actual_total_cost) || 0;
    if (Math.abs(b44Amt - fbAmt) > 1) {
      prMismatch++;
      console.log('  פער: ' + (r.name_snapshot||'—') + ' | Base44=₪' + b44Amt + ' Firebase=₪' + fbAmt);
    } else { prOK++; }
  }
});
console.log('  סה"כ פעיל: ' + activePR.length + ' | תואמים: ' + prOK + ' | חסרים: ' + prMissing + ' | פערים: ' + prMismatch);
console.log('');

// 5. חשבונות (progress entries)
console.log('━━━ חשבונות ━━━');
let peOK = 0, peMissing = 0, peMismatch = 0;
b44PE.forEach(e => {
  const fb = fbPE[e.id];
  if (!fb) { peMissing++; }
  else {
    const b44Amt = Number(e.amount_to_invoice) || 0;
    const fbAmt = Number(fb.amount_to_invoice) || 0;
    if (Math.abs(b44Amt - fbAmt) > 1) {
      peMismatch++;
      console.log('  פער: ' + (projMap[e.project_id]||'—') + ' | Base44=₪' + b44Amt + ' Firebase=₪' + fbAmt);
    } else { peOK++; }
  }
});
console.log('  סה"כ: ' + b44PE.length + ' | תואמים: ' + peOK + ' | חסרים: ' + peMissing + ' | פערים: ' + peMismatch);
console.log('');

// 6. יומני עבודה
console.log('━━━ יומני עבודה ━━━');
let wlOK = 0, wlMissing = 0;
b44WL.forEach(w => {
  const fb = fbWL[w.id];
  if (!fb) { wlMissing++; console.log('  חסר: ' + (projMap[w.project_id]||'—') + ' | ' + (w.date||'—').substring(0,10) + ' | ' + (w.total_hours||'—') + ' שעות'); }
  else { wlOK++; }
});
console.log('  סה"כ: ' + b44WL.length + ' | ב-Firebase: ' + wlOK + ' | חסרים: ' + wlMissing);
console.log('');

// 7. משימות
console.log('━━━ משימות ━━━');
let tOK = 0, tMissing = 0;
b44Tasks.forEach(t => {
  if (fbTasks[t.id]) tOK++;
  else tMissing++;
});
console.log('  סה"כ: ' + b44Tasks.length + ' | ב-Firebase: ' + tOK + ' | חסרים: ' + tMissing);
console.log('');

// 8. קבלני משנה
console.log('━━━ קבלני משנה ━━━');
b44SC.forEach(s => {
  const fb = fbSC[s.id];
  if (!fb) console.log('  חסר: ' + s.contractor_name + ' | ' + (projMap[s.project_id]||'—') + ' | ₪' + (s.amount||'—'));
  else console.log('  ✅ ' + s.contractor_name);
});
console.log('');

// 9. פרויקטים
console.log('━━━ פרויקטים ━━━');
b44Projects.forEach(p => {
  const fb = fbProjects[p.id];
  if (!fb) console.log('  חסר: ' + p.name);
  else console.log('  ✅ ' + p.name + ' | סטטוס Base44=' + (p.status||'—') + ' Firebase=' + (fb.status||'—'));
});

console.log('\n=== סיכום סופי ===');
console.log('לידים:      ' + leadOK + '/' + b44Leads.length + (leadMissing > 0 ? ' ⚠️' : ' ✅'));
console.log('הצעות:      ' + qOK + '/' + b44Quotes.length + ' (פערי סכום: ' + qMismatch + ')' + (qMismatch > 0 ? ' ⚠️' : ' ✅'));
console.log('גבייה:      ' + ctOK + '/' + b44CT.length + (ctMismatch > 0 ? ' ⚠️' : ' ✅'));
console.log('רכש פעיל:   ' + prOK + '/' + activePR.length + (prMissing > 0 ? ' ⚠️' : ' ✅'));
console.log('חשבונות:    ' + peOK + '/' + b44PE.length + (peMissing > 0 ? ' ⚠️' : ' ✅'));
console.log('יומני עבודה: ' + wlOK + '/' + b44WL.length + (wlMissing > 0 ? ' ⚠️' : ' ✅'));
console.log('משימות:     ' + tOK + '/' + b44Tasks.length + (tMissing > 0 ? ' ⚠️' : ' ✅'));
console.log('פרויקטים:   ' + Object.keys(fbProjects).length + '/' + b44Projects.length + ' ✅');

process.exit(0);
