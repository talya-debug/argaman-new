import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const app = initializeApp({ apiKey: "AIzaSyDEVZMA7R6FLZBdkPg1GPVhv5AajwjWVb8", authDomain: "argaman-f3921.firebaseapp.com", projectId: "argaman-f3921", storageBucket: "argaman-f3921.firebasestorage.app", messagingSenderId: "1089830122540", appId: "1:1089830122540:web:36a7ef49e3c90e8d8acd89" });
const db = getFirestore(app);

const records = parse(readFileSync('C:/Users/LENOVO/Downloads/ProgressEntry_export (1).csv', 'utf8'), { columns: true, skip_empty_lines: true, bom: true });

const ids = ['692d669db161ed19cfeea6a8', '692d66aa3eb49ffaa40753a9'];

for (const id of ids) {
  const r = records.find(x => x.id === id);
  if (!r) { console.log('לא נמצא: ' + id); continue; }
  const data = { ...r };
  delete data.id;
  for (const [k, v] of Object.entries(data)) {
    if (v === '') data[k] = null;
    if (v === 'true') data[k] = true;
    if (v === 'false') data[k] = false;
    if (['amount_to_invoice', 'quantity', 'cumulative_quantity', 'percentage'].includes(k) && v) data[k] = Number(v);
  }
  await setDoc(doc(db, 'progress_entries', id), data);
  console.log('✅ חשבון הועבר: ₪' + (r.amount_to_invoice || '—'));
}

process.exit(0);
