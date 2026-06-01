import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const app = initializeApp({ apiKey: "AIzaSyDEVZMA7R6FLZBdkPg1GPVhv5AajwjWVb8", authDomain: "argaman-f3921.firebaseapp.com", projectId: "argaman-f3921", storageBucket: "argaman-f3921.firebasestorage.app", messagingSenderId: "1089830122540", appId: "1:1089830122540:web:36a7ef49e3c90e8d8acd89" });
const db = getFirestore(app);

function readCSV(path) {
  return parse(readFileSync(path, 'utf8'), { columns: true, skip_empty_lines: true, bom: true });
}

const leads = readCSV('C:/Users/LENOVO/Downloads/Lead_export.csv');
const quotes = readCSV('C:/Users/LENOVO/Downloads/Quote_export.csv');
const quoteLines = readCSV('C:/Users/LENOVO/Downloads/QuoteLine_export.csv');

// 7 לידים חדשים (אחרי 3 במאי)
const newLeadIds = [
  '6a16ce7704f95b69a5c7ee0e', // לוי נגר
  '6a16c72c6aa7a2669ad8c55c', // מיכאל שיש
  '6a16b238587e566bd45e8c05', // שלמה פינס
  '6a0c4ce745e080af0e6cc726', // אלדד נהרי
  '6a0c2e1be1c19cfdfe21c563', // ישיבת באר יצחק
  '6a0984323c40ead1a4536cf0', // מנחם קפלן
  '6a0978af26ab4097384f8ee9', // גליר פיטום טכני
];

// העברת לידים
console.log('=== מעביר 7 לידים חדשים ===');
for (const id of newLeadIds) {
  const lead = leads.find(l => l.id === id);
  if (lead) {
    const data = { ...lead };
    delete data.id;
    // המרת שדות ריקים
    for (const [k, v] of Object.entries(data)) {
      if (v === '') data[k] = null;
      if (v === 'true') data[k] = true;
      if (v === 'false') data[k] = false;
    }
    await setDoc(doc(db, 'leads', id), data);
    console.log(`✅ ליד: ${lead.name}`);
  }
}

// מצא הצעות מקושרות ללידים
console.log('\n=== מעביר הצעות מחיר מקושרות ===');
const newQuotes = quotes.filter(q => newLeadIds.includes(q.lead_id));
const newQuoteIds = [];
for (const q of newQuotes) {
  const id = q.id;
  newQuoteIds.push(id);
  const data = { ...q };
  delete data.id;
  for (const [k, v] of Object.entries(data)) {
    if (v === '') data[k] = null;
    if (v === 'true') data[k] = true;
    if (v === 'false') data[k] = false;
    // המרת מספרים
    if (['total', 'subtotal', 'vat_percentage', 'discount_percentage', 'discount_amount'].includes(k) && v) {
      data[k] = Number(v);
    }
  }
  await setDoc(doc(db, 'quotes', id), data);
  console.log(`✅ הצעה: ${q.title || q.client_name}`);
}

// מצא שורות הצעה מקושרות
console.log('\n=== מעביר שורות הצעה ===');
const newLines = quoteLines.filter(ql => newQuoteIds.includes(ql.quote_id));
let lineCount = 0;
for (const line of newLines) {
  const id = line.id;
  const data = { ...line };
  delete data.id;
  for (const [k, v] of Object.entries(data)) {
    if (v === '') data[k] = null;
    if (v === 'true') data[k] = true;
    if (v === 'false') data[k] = false;
    if (['quantity', 'line_total', 'price_no_vat_snapshot', 'btu_snapshot', 'order_index', 'list_price_snapshot'].includes(k) && v) {
      data[k] = Number(v);
    }
  }
  await setDoc(doc(db, 'quote_lines', id), data);
  lineCount++;
}
console.log(`✅ ${lineCount} שורות הצעה`);

console.log('\n=== סיכום ===');
console.log(`לידים: ${newLeadIds.length}`);
console.log(`הצעות: ${newQuotes.length}`);
console.log(`שורות: ${lineCount}`);

process.exit(0);
