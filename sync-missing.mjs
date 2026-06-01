import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const app = initializeApp({ apiKey: "AIzaSyDEVZMA7R6FLZBdkPg1GPVhv5AajwjWVb8", authDomain: "argaman-f3921.firebaseapp.com", projectId: "argaman-f3921", storageBucket: "argaman-f3921.firebasestorage.app", messagingSenderId: "1089830122540", appId: "1:1089830122540:web:36a7ef49e3c90e8d8acd89" });
const db = getFirestore(app);

const base44 = JSON.parse(readFileSync('scripts/base44-export.json', 'utf8'));

const mapping = {
  Lead: 'leads', Quote: 'quotes', QuoteLine: 'quote_lines', Project: 'projects',
  Task: 'tasks', ProgressEntry: 'progress_entries', WorkLogEntry: 'work_log_entries',
  PurchaseRecord: 'purchase_records', SubContractor: 'sub_contractors',
  CollectionTask: 'collection_tasks', ChangeLog: 'change_logs', TaskActivity: 'task_activities',
};
// PriceItem לא מעבירים — Firebase כבר מעודכן עם 1,732 פריטים

console.log('=== השוואה: Base44 (3.5) מול Firebase — רק בדיקה, ללא שינויים ===\n');

const missing = {};
let totalMissing = 0;

for (const [entity, col] of Object.entries(mapping)) {
  const b44Records = base44[entity] || [];
  const fbSnap = await getDocs(collection(db, col));
  const fbIds = new Set();
  fbSnap.forEach(d => fbIds.add(d.id));

  const missingRecords = b44Records.filter(r => !fbIds.has(String(r.id)));
  missing[entity] = missingRecords;
  totalMissing += missingRecords.length;

  if (missingRecords.length > 0) {
    console.log(`⚠️  ${entity}: ${missingRecords.length} חסרים מתוך ${b44Records.length}`);
    missingRecords.slice(0, 3).forEach(r => {
      const name = r.name || r.title || r.client_name || r.contractor_name || r.manual_item_name || r.description || '';
      console.log(`    → [${r.id}] ${name}`);
    });
    if (missingRecords.length > 3) console.log(`    ... ועוד ${missingRecords.length - 3}`);
  } else {
    console.log(`✅ ${entity}: מסונכרן (${b44Records.length})`);
  }
}

console.log(`\nסה"כ חסרים: ${totalMissing}`);
console.log('\nזו רק בדיקה — לא בוצעו שינויים.');

process.exit(0);
