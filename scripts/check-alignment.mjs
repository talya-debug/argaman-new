import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const app = initializeApp({ apiKey: "AIzaSyDEVZMA7R6FLZBdkPg1GPVhv5AajwjWVb8", authDomain: "argaman-f3921.firebaseapp.com", projectId: "argaman-f3921", storageBucket: "argaman-f3921.firebasestorage.app", messagingSenderId: "1089830122540", appId: "1:1089830122540:web:36a7ef49e3c90e8d8acd89" });
const db = getFirestore(app);

function csv(path) { return parse(readFileSync(path, 'utf8'), { columns: true, skip_empty_lines: true, bom: true }); }

const projects = csv('C:/Users/LENOVO/Downloads/Project_export.csv');
const b44QL = csv('C:/Users/LENOVO/Downloads/QuoteLine_export.csv');
const b44PR = csv('C:/Users/LENOVO/Downloads/PurchaseRecord_export.csv');
const b44PE = csv('C:/Users/LENOVO/Downloads/ProgressEntry_export (1).csv');
const b44CT = csv('C:/Users/LENOVO/Downloads/CollectionTask_export.csv');

const fbData = {};
for (const col of ['quote_lines', 'purchase_records', 'progress_entries', 'collection_tasks']) {
  const snap = await getDocs(collection(db, col));
  fbData[col] = new Set();
  snap.forEach(d => fbData[col].add(d.id));
}

console.log('=== בדיקת הלימה לכל פרויקט ===\n');

for (const p of projects) {
  console.log('━━━ ' + p.name + ' ━━━');

  // שורות הצעה (ללא כותרות)
  const ql = b44QL.filter(q => q.quote_id === p.quote_id && q.is_header !== 'true');
  const qlFB = ql.filter(q => fbData['quote_lines'].has(q.id)).length;

  // רכש פעיל (לא "טרם הוזמן")
  const prActive = b44PR.filter(r => r.project_id === p.id && r.status !== 'טרם הוזמן');
  const prFB = prActive.filter(r => fbData['purchase_records'].has(r.id)).length;

  // חשבונות
  const pe = b44PE.filter(e => e.project_id === p.id);
  const peFB = pe.filter(e => fbData['progress_entries'].has(e.id)).length;

  // גבייה
  const ct = b44CT.filter(c => c.project_id === p.id);
  const ctFB = ct.filter(c => fbData['collection_tasks'].has(c.id)).length;

  const check = (label, total, inFB) => {
    if (total === 0) return '  ' + label.padEnd(16) + 'אין';
    return '  ' + label.padEnd(16) + 'Base44=' + String(total).padEnd(4) + 'Firebase=' + String(inFB).padEnd(4) + (total === inFB ? '✅' : '⚠️ חסרות ' + (total - inFB));
  };

  console.log(check('שורות הצעה:', ql.length, qlFB));
  console.log(check('רכש פעיל:', prActive.length, prFB));
  console.log(check('חשבונות:', pe.length, peFB));
  console.log(check('גבייה:', ct.length, ctFB));

  // פירוט רכש פעיל חסר
  if (prActive.length !== prFB) {
    const missing = prActive.filter(r => !fbData['purchase_records'].has(r.id));
    missing.forEach(r => {
      console.log('    → רכש חסר: ' + (r.name_snapshot || r.manual_item_name || '—').substring(0, 35) + ' | סטטוס=' + r.status + ' | ₪' + (r.actual_total_cost || '0'));
    });
  }

  // פירוט חשבונות חסרים
  if (pe.length !== peFB) {
    const missing = pe.filter(e => !fbData['progress_entries'].has(e.id));
    missing.forEach(e => {
      console.log('    → חשבון חסר: סכום=₪' + (e.amount_to_invoice || '—') + ' | תאריך=' + (e.created_date || '—').substring(0, 10));
    });
  }

  // פירוט גבייה חסרה
  if (ct.length !== ctFB) {
    const missing = ct.filter(c => !fbData['collection_tasks'].has(c.id));
    missing.forEach(c => {
      console.log('    → גבייה חסרה: סכום=₪' + (c.amount_to_collect || '—') + ' | סטטוס=' + (c.collection_status || '—'));
    });
  }

  console.log('');
}

process.exit(0);
