import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const app = initializeApp({ apiKey: "AIzaSyDEVZMA7R6FLZBdkPg1GPVhv5AajwjWVb8", authDomain: "argaman-f3921.firebaseapp.com", projectId: "argaman-f3921", storageBucket: "argaman-f3921.firebasestorage.app", messagingSenderId: "1089830122540", appId: "1:1089830122540:web:36a7ef49e3c90e8d8acd89" });
const db = getFirestore(app);

function readCSV(path) {
  try {
    const content = readFileSync(path, 'utf8');
    return parse(content, { columns: true, skip_empty_lines: true, bom: true });
  } catch(e) { console.error('שגיאה בקריאת ' + path + ': ' + e.message); return []; }
}

const files = [
  { file: 'C:/Users/LENOVO/Downloads/Lead_export.csv', col: 'leads', name: 'לידים' },
  { file: 'C:/Users/LENOVO/Downloads/Quote_export.csv', col: 'quotes', name: 'הצעות מחיר' },
  { file: 'C:/Users/LENOVO/Downloads/QuoteLine_export.csv', col: 'quote_lines', name: 'שורות הצעה' },
  { file: 'C:/Users/LENOVO/Downloads/Project_export.csv', col: 'projects', name: 'פרויקטים' },
  { file: 'C:/Users/LENOVO/Downloads/Task_export.csv', col: 'tasks', name: 'משימות' },
  { file: 'C:/Users/LENOVO/Downloads/ProgressEntry_export (1).csv', col: 'progress_entries', name: 'התקדמות/כתבי כמויות' },
  { file: 'C:/Users/LENOVO/Downloads/WorkLogEntry_export.csv', col: 'work_log_entries', name: 'יומני עבודה' },
  { file: 'C:/Users/LENOVO/Downloads/PurchaseRecord_export.csv', col: 'purchase_records', name: 'רכש' },
  { file: 'C:/Users/LENOVO/Downloads/SubContractor_export.csv', col: 'sub_contractors', name: 'קבלני משנה' },
  { file: 'C:/Users/LENOVO/Downloads/CollectionTask_export.csv', col: 'collection_tasks', name: 'גבייה' },
  { file: 'C:/Users/LENOVO/Downloads/ChangeLog_export.csv', col: 'change_logs', name: 'יומן שינויים' },
  { file: 'C:/Users/LENOVO/Downloads/TaskActivity_export.csv', col: 'task_activities', name: 'פעילות משימות' },
];

console.log('=== השוואת Base44 (ייצוא היום) מול Firebase ===\n');

let totalB44 = 0, totalFB = 0, totalMissing = 0, totalNew = 0;
const allMissing = [];

for (const f of files) {
  const csvRecords = readCSV(f.file);
  const fbSnap = await getDocs(collection(db, f.col));

  const csvIds = new Set(csvRecords.map(r => r.id).filter(Boolean));
  const fbIds = new Set();
  fbSnap.forEach(d => fbIds.add(d.id));

  const missingInFB = [...csvIds].filter(id => !fbIds.has(id));
  const newInFB = [...fbIds].filter(id => !csvIds.has(id));

  totalB44 += csvIds.size;
  totalFB += fbIds.size;
  totalMissing += missingInFB.length;
  totalNew += newInFB.length;

  let status;
  if (missingInFB.length === 0 && newInFB.length === 0) status = '✅ מסונכרן';
  else if (missingInFB.length === 0) status = `✅ (+${newInFB.length} חדשים ב-Firebase)`;
  else status = `⚠️ ${missingInFB.length} חסרים ב-Firebase`;

  console.log(`${f.name.padEnd(25)} Base44: ${String(csvIds.size).padEnd(6)} Firebase: ${String(fbIds.size).padEnd(6)} ${status}`);

  if (missingInFB.length > 0) {
    // הצג פרטים על החסרים
    const missingRecords = csvRecords.filter(r => missingInFB.includes(r.id));
    missingRecords.forEach(r => {
      const name = r.name || r.title || r.client_name || r.contractor_name || r.manual_item_name || r.work_description || r.invoice_number || '';
      const date = r.created_date || r.date || r.created_at || '';
      const projName = r.project_name || '';
      allMissing.push({ entity: f.name, id: r.id, name: name.substring(0, 50), date, project: projName.substring(0, 30) });
    });
  }
}

console.log('\n' + '='.repeat(70));
console.log(`סה"כ: Base44=${totalB44} | Firebase=${totalFB} | חסרים=${totalMissing} | חדשים ב-Firebase=${totalNew}`);

if (allMissing.length > 0) {
  console.log('\n=== פירוט רשומות חסרות ===\n');

  // קבץ לפי entity
  const grouped = {};
  allMissing.forEach(m => {
    if (!grouped[m.entity]) grouped[m.entity] = [];
    grouped[m.entity].push(m);
  });

  for (const [entity, records] of Object.entries(grouped)) {
    console.log(`--- ${entity} (${records.length} חסרים) ---`);
    records.forEach(r => {
      console.log(`  [${r.id}] ${r.name || '—'} | ${r.date || '—'} | ${r.project || ''}`);
    });
    console.log('');
  }

  // בדוק כמה מהחסרים נוצרו אחרי 3 במאי
  const may3 = new Date('2026-05-03');
  const afterMay3 = allMissing.filter(m => {
    if (!m.date) return false;
    return new Date(m.date) > may3;
  });
  console.log(`\nמתוכם, נוצרו אחרי 3 במאי: ${afterMay3.length}`);
  if (afterMay3.length > 0) {
    afterMay3.forEach(r => {
      console.log(`  [${r.entity}] ${r.name || '—'} | ${r.date}`);
    });
  }
}

process.exit(0);
