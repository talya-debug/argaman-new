import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const app = initializeApp({ apiKey: "AIzaSyDEVZMA7R6FLZBdkPg1GPVhv5AajwjWVb8", authDomain: "argaman-f3921.firebaseapp.com", projectId: "argaman-f3921", storageBucket: "argaman-f3921.firebasestorage.app", messagingSenderId: "1089830122540", appId: "1:1089830122540:web:36a7ef49e3c90e8d8acd89" });
const db = getFirestore(app);

const quotes = parse(readFileSync('C:/Users/LENOVO/Downloads/Quote_export.csv', 'utf8'), { columns: true, skip_empty_lines: true, bom: true });

const ids = ['6909d5cafaec7e8fdd308ccc', '6911ce154c61aa855dd0f0d7'];
for (const id of ids) {
  const q = quotes.find(r => r.id === id);
  if (q) {
    const data = { ...q };
    delete data.id;
    for (const [k, v] of Object.entries(data)) {
      if (v === '') data[k] = null;
      if (v === 'true') data[k] = true;
      if (v === 'false') data[k] = false;
      if (['total', 'subtotal', 'vat_percentage', 'discount_percentage'].includes(k) && v) data[k] = Number(v);
    }
    await setDoc(doc(db, 'quotes', id), data);
    console.log('שוחזרה: ' + q.title + ' | ₪' + q.total);
  }
}
process.exit(0);
