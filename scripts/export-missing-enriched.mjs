import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';

const app = initializeApp({ apiKey: "AIzaSyDEVZMA7R6FLZBdkPg1GPVhv5AajwjWVb8", authDomain: "argaman-f3921.firebaseapp.com", projectId: "argaman-f3921", storageBucket: "argaman-f3921.firebasestorage.app", messagingSenderId: "1089830122540", appId: "1:1089830122540:web:36a7ef49e3c90e8d8acd89" });
const db = getFirestore(app);

function readCSV(path) {
  return parse(readFileSync(path, 'utf8'), { columns: true, skip_empty_lines: true, bom: true });
}

// טען את כל ה-CSVs
const projects = readCSV('C:/Users/LENOVO/Downloads/Project_export.csv');
const leads = readCSV('C:/Users/LENOVO/Downloads/Lead_export.csv');
const quotes = readCSV('C:/Users/LENOVO/Downloads/Quote_export.csv');

// בנה מפות
const projectMap = {};
projects.forEach(p => { projectMap[p.id] = p.name || '—'; });

const leadMap = {};
leads.forEach(l => { leadMap[l.id] = l.name || '—'; });

const quoteMap = {};
quotes.forEach(q => { quoteMap[q.id] = { title: q.title || q.client_name || '—', lead_id: q.lead_id }; });

// Firebase IDs
const fbIds = {};
const collections = ['leads','quotes','quote_lines','projects','tasks','progress_entries','work_log_entries','purchase_records','sub_contractors','collection_tasks','change_logs','task_activities'];
for (const col of collections) {
  const snap = await getDocs(collection(db, col));
  fbIds[col] = new Set();
  snap.forEach(d => fbIds[col].add(d.id));
}

function getProjectName(record) {
  if (record.project_id && projectMap[record.project_id]) return projectMap[record.project_id];
  if (record.project_name) return record.project_name;
  return 'לא מקושר לפרויקט';
}

function getLeadName(record) {
  if (record.lead_id && leadMap[record.lead_id]) return leadMap[record.lead_id];
  return '';
}

const wb = new ExcelJS.Workbook();

// סיכום לפי פרויקט
const summarySheet = wb.addWorksheet('סיכום לפי פרויקט');
summarySheet.columns = [
  { header: 'פרויקט', key: 'project', width: 40 },
  { header: 'משימות', key: 'tasks', width: 12 },
  { header: 'יומני עבודה', key: 'logs', width: 14 },
  { header: 'רכש', key: 'purchase', width: 12 },
  { header: 'כתבי כמויות', key: 'progress', width: 14 },
  { header: 'קבלני משנה', key: 'subs', width: 14 },
  { header: 'גבייה', key: 'collection', width: 12 },
  { header: 'שינויים', key: 'changes', width: 12 },
  { header: 'סה"כ חסר', key: 'total', width: 12 },
];
summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3a7a' } };

const projectStats = {};

// פונקציה להוספת גיליון מפורט
function addSheet(name, csvPath, fbCol, displayCols) {
  const records = readCSV(csvPath);
  const missing = records.filter(r => r.id && !fbIds[fbCol].has(r.id));

  if (missing.length === 0) return;

  const sheet = wb.addWorksheet(name);
  const cols = [
    { header: 'פרויקט', key: '_project', width: 35 },
    ...displayCols.map(c => ({ header: c.header, key: c.key, width: c.width || 20 })),
  ];
  sheet.columns = cols;
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3a7a' } };

  // מיין לפי פרויקט
  missing.sort((a, b) => getProjectName(a).localeCompare(getProjectName(b)));

  for (const r of missing) {
    const projName = getProjectName(r);
    const row = { _project: projName };
    displayCols.forEach(c => { row[c.key] = r[c.key] || ''; });
    sheet.addRow(row);

    // סטטיסטיקה
    if (!projectStats[projName]) projectStats[projName] = { tasks: 0, logs: 0, purchase: 0, progress: 0, subs: 0, collection: 0, changes: 0 };
    if (fbCol === 'tasks') projectStats[projName].tasks++;
    if (fbCol === 'work_log_entries') projectStats[projName].logs++;
    if (fbCol === 'purchase_records') projectStats[projName].purchase++;
    if (fbCol === 'progress_entries') projectStats[projName].progress++;
    if (fbCol === 'sub_contractors') projectStats[projName].subs++;
    if (fbCol === 'collection_tasks') projectStats[projName].collection++;
    if (fbCol === 'change_logs') projectStats[projName].changes++;
  }

  return missing.length;
}

// הצעות — קישור ללקוח
const missingQuotes = readCSV('C:/Users/LENOVO/Downloads/Quote_export.csv').filter(r => r.id && !fbIds['quotes'].has(r.id));
if (missingQuotes.length > 0) {
  const sheet = wb.addWorksheet('הצעות מחיר');
  sheet.columns = [
    { header: 'לקוח', key: '_lead', width: 30 },
    { header: 'כותרת', key: 'title', width: 35 },
    { header: 'מספר הצעה', key: 'quote_number', width: 18 },
    { header: 'סטטוס', key: 'status', width: 15 },
    { header: 'סכום', key: 'total', width: 15 },
    { header: 'תאריך', key: 'created_date', width: 22 },
  ];
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3a7a' } };
  missingQuotes.forEach(q => {
    sheet.addRow({
      _lead: getLeadName(q) || q.client_name || '—',
      title: q.title || '',
      quote_number: q.quote_number || '',
      status: q.status || '',
      total: q.total || '',
      created_date: q.created_date || '',
    });
  });
}

// משימות
addSheet('משימות', 'C:/Users/LENOVO/Downloads/Task_export.csv', 'tasks', [
  { header: 'כותרת', key: 'title', width: 40 },
  { header: 'אחראי', key: 'assigned_to', width: 15 },
  { header: 'סטטוס', key: 'status', width: 15 },
  { header: 'עדיפות', key: 'priority', width: 12 },
  { header: 'תאריך', key: 'created_date', width: 22 },
]);

// כתבי כמויות
addSheet('כתבי כמויות', 'C:/Users/LENOVO/Downloads/ProgressEntry_export (1).csv', 'progress_entries', [
  { header: 'מספר חשבון', key: 'invoice_number', width: 15 },
  { header: 'סכום', key: 'amount_to_invoice', width: 15 },
  { header: 'סטטוס', key: 'status', width: 20 },
  { header: 'תאריך', key: 'created_date', width: 22 },
]);

// יומני עבודה
addSheet('יומני עבודה', 'C:/Users/LENOVO/Downloads/WorkLogEntry_export.csv', 'work_log_entries', [
  { header: 'תיאור', key: 'work_description', width: 40 },
  { header: 'שעות', key: 'total_hours', width: 10 },
  { header: 'עובדים', key: 'number_of_workers', width: 10 },
  { header: 'תאריך', key: 'date', width: 22 },
]);

// רכש
addSheet('רכש', 'C:/Users/LENOVO/Downloads/PurchaseRecord_export.csv', 'purchase_records', [
  { header: 'פריט', key: 'name_snapshot', width: 30 },
  { header: 'ספק', key: 'supplier_name', width: 20 },
  { header: 'כמות', key: 'quantity_to_order', width: 10 },
  { header: 'סכום', key: 'actual_total_cost', width: 15 },
  { header: 'סטטוס', key: 'status', width: 15 },
  { header: 'תאריך', key: 'created_date', width: 22 },
]);

// קבלני משנה
addSheet('קבלני משנה', 'C:/Users/LENOVO/Downloads/SubContractor_export.csv', 'sub_contractors', [
  { header: 'שם קבלן', key: 'contractor_name', width: 25 },
  { header: 'תחום', key: 'work_field', width: 20 },
  { header: 'סכום', key: 'amount', width: 15 },
  { header: 'סטטוס', key: 'payment_status', width: 18 },
]);

// גבייה
addSheet('גבייה', 'C:/Users/LENOVO/Downloads/CollectionTask_export.csv', 'collection_tasks', [
  { header: 'סכום', key: 'amount_to_collect', width: 15 },
  { header: 'סטטוס', key: 'collection_status', width: 25 },
  { header: 'חשבונית', key: 'invoice_number', width: 18 },
  { header: 'תאריך', key: 'created_date', width: 22 },
]);

// יומן שינויים
addSheet('יומן שינויים', 'C:/Users/LENOVO/Downloads/ChangeLog_export.csv', 'change_logs', [
  { header: 'סוג שינוי', key: 'change_type', width: 20 },
  { header: 'ערך', key: 'new_value', width: 30 },
  { header: 'סיבה', key: 'change_reason', width: 25 },
  { header: 'שינה', key: 'changed_by', width: 20 },
  { header: 'תאריך', key: 'change_date', width: 22 },
]);

// מלא סיכום לפי פרויקט
for (const [proj, stats] of Object.entries(projectStats).sort((a, b) => {
  const totalA = Object.values(a[1]).reduce((s, v) => s + v, 0);
  const totalB = Object.values(b[1]).reduce((s, v) => s + v, 0);
  return totalB - totalA;
})) {
  const total = Object.values(stats).reduce((s, v) => s + v, 0);
  summarySheet.addRow({ project: proj, ...stats, total });
}

// סיכום כולל
const totals = { project: 'סה"כ', tasks: 0, logs: 0, purchase: 0, progress: 0, subs: 0, collection: 0, changes: 0, total: 0 };
for (const stats of Object.values(projectStats)) {
  totals.tasks += stats.tasks; totals.logs += stats.logs; totals.purchase += stats.purchase;
  totals.progress += stats.progress; totals.subs += stats.subs; totals.collection += stats.collection; totals.changes += stats.changes;
}
totals.total = totals.tasks + totals.logs + totals.purchase + totals.progress + totals.subs + totals.collection + totals.changes;
const totalRow = summarySheet.addRow(totals);
totalRow.font = { bold: true };
totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFe8f0fe' } };

const outPath = 'C:/Users/LENOVO/Desktop/השוואת-נתונים-ארגמן.xlsx';
await wb.xlsx.writeFile(outPath);
console.log('נשמר: ' + outPath);

process.exit(0);
