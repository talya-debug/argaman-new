import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';

const app = initializeApp({ apiKey: "AIzaSyDEVZMA7R6FLZBdkPg1GPVhv5AajwjWVb8", authDomain: "argaman-f3921.firebaseapp.com", projectId: "argaman-f3921", storageBucket: "argaman-f3921.firebasestorage.app", messagingSenderId: "1089830122540", appId: "1:1089830122540:web:36a7ef49e3c90e8d8acd89" });
const db = getFirestore(app);

function readCSV(path) {
  return parse(readFileSync(path, 'utf8'), { columns: true, skip_empty_lines: true, bom: true });
}

const files = [
  { file: 'C:/Users/LENOVO/Downloads/Lead_export.csv', col: 'leads', name: 'לידים' },
  { file: 'C:/Users/LENOVO/Downloads/Quote_export.csv', col: 'quotes', name: 'הצעות מחיר' },
  { file: 'C:/Users/LENOVO/Downloads/QuoteLine_export.csv', col: 'quote_lines', name: 'שורות הצעה' },
  { file: 'C:/Users/LENOVO/Downloads/Project_export.csv', col: 'projects', name: 'פרויקטים' },
  { file: 'C:/Users/LENOVO/Downloads/Task_export.csv', col: 'tasks', name: 'משימות' },
  { file: 'C:/Users/LENOVO/Downloads/ProgressEntry_export (1).csv', col: 'progress_entries', name: 'כתבי כמויות' },
  { file: 'C:/Users/LENOVO/Downloads/WorkLogEntry_export.csv', col: 'work_log_entries', name: 'יומני עבודה' },
  { file: 'C:/Users/LENOVO/Downloads/PurchaseRecord_export.csv', col: 'purchase_records', name: 'רכש' },
  { file: 'C:/Users/LENOVO/Downloads/SubContractor_export.csv', col: 'sub_contractors', name: 'קבלני משנה' },
  { file: 'C:/Users/LENOVO/Downloads/CollectionTask_export.csv', col: 'collection_tasks', name: 'גבייה' },
  { file: 'C:/Users/LENOVO/Downloads/ChangeLog_export.csv', col: 'change_logs', name: 'יומן שינויים' },
  { file: 'C:/Users/LENOVO/Downloads/TaskActivity_export.csv', col: 'task_activities', name: 'פעילות משימות' },
];

const wb = new ExcelJS.Workbook();

// גיליון סיכום
const summarySheet = wb.addWorksheet('סיכום');
summarySheet.columns = [
  { header: 'מודול', key: 'module', width: 25 },
  { header: 'Base44', key: 'b44', width: 12 },
  { header: 'Firebase', key: 'fb', width: 12 },
  { header: 'חסרים', key: 'missing', width: 12 },
  { header: 'סיבת מחיקה', key: 'reason', width: 40 },
];
summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3a7a' } };

for (const f of files) {
  const csvRecords = readCSV(f.file);
  const fbSnap = await getDocs(collection(db, f.col));
  const fbIds = new Set();
  fbSnap.forEach(d => fbIds.add(d.id));

  const csvIds = new Set(csvRecords.map(r => r.id).filter(Boolean));
  const missingIds = [...csvIds].filter(id => !fbIds.has(id));
  const missingRecords = csvRecords.filter(r => missingIds.includes(r.id));

  // סיכום
  const reason = missingRecords.length > 0
    ? (missingRecords.some(r => r.created_date && new Date(r.created_date) > new Date('2026-05-03'))
      ? 'חלק חדשים (אחרי 3.5) + חלק נמחקו בניקוי'
      : 'נמחקו בניקוי נתוני בדיקה (14.5)')
    : '';

  summarySheet.addRow({
    module: f.name,
    b44: csvIds.size,
    fb: fbIds.size,
    missing: missingRecords.length,
    reason,
  });

  // גיליון פירוט לכל מודול עם חסרים
  if (missingRecords.length > 0) {
    const sheet = wb.addWorksheet(f.name);

    // כותרות — מתוך שדות הרשומה הראשונה
    const keys = Object.keys(missingRecords[0]).filter(k => {
      // סנן שדות לא רלוונטיים
      return !['__v', '_id'].includes(k);
    });

    // בחר שדות חשובים ראשונים
    const importantKeys = ['id', 'name', 'title', 'client_name', 'contractor_name', 'manual_item_name',
      'project_name', 'project_id', 'lead_id', 'quote_id', 'status', 'created_date', 'date',
      'amount', 'total', 'actual_total_cost', 'amount_to_collect', 'quantity', 'work_description',
      'supplier_name', 'payment_status', 'collection_status'];
    const displayKeys = importantKeys.filter(k => keys.includes(k));
    // הוסף שאר השדות שלא בחשובים
    keys.forEach(k => { if (!displayKeys.includes(k)) displayKeys.push(k); });

    sheet.columns = displayKeys.map(k => ({ header: k, key: k, width: Math.min(30, Math.max(12, k.length * 2)) }));
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3a7a' } };

    for (const record of missingRecords) {
      const row = {};
      displayKeys.forEach(k => { row[k] = record[k] || ''; });
      sheet.addRow(row);
    }
  }
}

// צביעת שורות סיכום
summarySheet.eachRow((row, num) => {
  if (num > 1) {
    const missing = row.getCell('missing').value;
    if (missing > 0) {
      row.getCell('missing').font = { bold: true, color: { argb: 'FFdc2626' } };
    } else {
      row.getCell('missing').font = { color: { argb: 'FF22c55e' } };
    }
  }
});

const outPath = 'C:/Users/LENOVO/Desktop/השוואת-נתונים-ארגמן.xlsx';
await wb.xlsx.writeFile(outPath);
console.log('נשמר: ' + outPath);

process.exit(0);
