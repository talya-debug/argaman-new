// בדיקה קצה לקצה: יצירה → קריאה בפרויקט → קריאה במודול ספקים → עריכה → בדיקת סנכרון → מחיקה
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDEVZMA7R6FLZBdkPg1GPVhv5AajwjWVb8',
  authDomain: 'argaman-f3921.firebaseapp.com',
  projectId: 'argaman-f3921',
  storageBucket: 'argaman-f3921.firebasestorage.app',
  messagingSenderId: '1089830122540',
  appId: '1:1089830122540:web:36a7ef49e3c90e8d8acd89'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let passed = 0;
let failed = 0;
function assert(condition, msg) {
  if (condition) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.log(`  ✗ ${msg}`); failed++; }
}

async function test() {
  console.log('=== בדיקת רכש קצה לקצה ===\n');

  // מציאת פרויקט עם purchase_records
  const projSnap = await getDocs(collection(db, 'projects'));
  const projects = projSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const prSnap = await getDocs(collection(db, 'purchase_records'));
  const records = prSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // בוחרים פרויקט שיש לו רשומות רכש
  const projectWithRecords = projects.find(p => records.some(r => r.project_id === p.id));
  const testProject = projectWithRecords || projects[0];
  console.log(`פרויקט בדיקה: ${testProject.name} (${testProject.id})`);
  console.log(`רשומות רכש קיימות: ${records.filter(r => r.project_id === testProject.id).length}\n`);

  // === שלב 1: יצירה ===
  console.log('--- שלב 1: יצירת הזמנת רכש ---');
  const poData = {
    po_number: 88888,
    project_id: testProject.id,
    project_name: testProject.name,
    supplier_name: 'ספק בדיקה טליה',
    supplier_phone: '050-1234567',
    items: [
      { name_snapshot: 'מזגן 2 כ"ס', quantity_to_order: 10, unit_price: 1500 },
      { name_snapshot: 'שלט אלחוטי', quantity_to_order: 10, unit_price: 200 },
    ],
    record_ids: [],
    status: 'הוזמן',
    total_amount: 17000,
    date: '2026-05-07',
    createdAt: new Date().toISOString(),
    updated_date: new Date().toISOString(),
  };
  const poRef = await addDoc(collection(db, 'purchase_orders'), poData);
  const poId = poRef.id;
  assert(!!poId, `הזמנה נוצרה: ${poId}`);

  // === שלב 2: בדיקה מתוך הפרויקט (filter by project_id) ===
  console.log('\n--- שלב 2: בדיקה מתוך הפרויקט ---');
  const projFilter = await getDocs(query(collection(db, 'purchase_orders'), where('project_id', '==', testProject.id)));
  const projOrders = projFilter.docs.map(d => ({ id: d.id, ...d.data() }));
  const foundInProject = projOrders.find(o => o.po_number === 88888);
  assert(!!foundInProject, `הזמנה #88888 נמצאת בפרויקט`);
  assert(foundInProject?.supplier_name === 'ספק בדיקה טליה', `ספק: "${foundInProject?.supplier_name}"`);
  assert(foundInProject?.total_amount === 17000, `סכום: ₪${foundInProject?.total_amount}`);
  assert(foundInProject?.items?.length === 2, `פריטים: ${foundInProject?.items?.length}`);

  // === שלב 3: בדיקה מתוך מודול תשלומי ספקים (list all) ===
  console.log('\n--- שלב 3: בדיקה מתוך מודול תשלומי ספקים ---');
  const allOrders = await getDocs(collection(db, 'purchase_orders'));
  const allOrdersList = allOrders.docs.map(d => ({ id: d.id, ...d.data() }));
  const foundInAll = allOrdersList.find(o => o.po_number === 88888);
  assert(!!foundInAll, `הזמנה #88888 נמצאת ברשימה הכללית`);
  assert(foundInAll?.id === poId, `אותו ID בשני המקומות: ${foundInAll?.id}`);

  // === שלב 4: עריכה ===
  console.log('\n--- שלב 4: עריכת הזמנה ---');
  await updateDoc(doc(db, 'purchase_orders', poId), {
    supplier_name: 'ספק מעודכן',
    total_amount: 20000,
    status: 'סופק מלא',
    updated_date: new Date().toISOString(),
  });
  console.log('  עדכון בוצע');

  // === שלב 5: בדיקת סנכרון — האם העדכון נראה בשני המקומות? ===
  console.log('\n--- שלב 5: בדיקת סנכרון אחרי עריכה ---');

  // בדיקה מתוך הפרויקט
  const projFilter2 = await getDocs(query(collection(db, 'purchase_orders'), where('project_id', '==', testProject.id)));
  const updatedInProject = projFilter2.docs.map(d => ({ id: d.id, ...d.data() })).find(o => o.id === poId);
  assert(updatedInProject?.supplier_name === 'ספק מעודכן', `פרויקט: ספק="${updatedInProject?.supplier_name}"`);
  assert(updatedInProject?.total_amount === 20000, `פרויקט: סכום=₪${updatedInProject?.total_amount}`);
  assert(updatedInProject?.status === 'סופק מלא', `פרויקט: סטטוס="${updatedInProject?.status}"`);

  // בדיקה מתוך מודול ספקים
  const allOrders2 = await getDocs(collection(db, 'purchase_orders'));
  const updatedInAll = allOrders2.docs.map(d => ({ id: d.id, ...d.data() })).find(o => o.id === poId);
  assert(updatedInAll?.supplier_name === 'ספק מעודכן', `ספקים: ספק="${updatedInAll?.supplier_name}"`);
  assert(updatedInAll?.total_amount === 20000, `ספקים: סכום=₪${updatedInAll?.total_amount}`);
  assert(updatedInAll?.status === 'סופק מלא', `ספקים: סטטוס="${updatedInAll?.status}"`);

  // === שלב 6: ניקוי ===
  console.log('\n--- שלב 6: ניקוי ---');
  await deleteDoc(doc(db, 'purchase_orders', poId));
  assert(true, 'הזמנת בדיקה נמחקה');

  // === סיכום ===
  console.log(`\n=== סיכום: ${passed} עברו, ${failed} נכשלו ===`);
  if (failed === 0) console.log('הכל עובד!');
  else console.log('יש בעיות!');

  process.exit(failed > 0 ? 1 : 0);
}

test().catch(err => { console.error('שגיאה:', err); process.exit(1); });
