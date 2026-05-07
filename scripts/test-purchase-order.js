// בדיקה קצה לקצה של תהליך הרכש
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, where, deleteDoc, doc } from 'firebase/firestore';

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

async function test() {
  console.log('=== בדיקת תהליך רכש ===\n');

  // 1. בדיקת collection purchase_orders
  console.log('1. בודק purchase_orders collection...');
  const poSnap = await getDocs(collection(db, 'purchase_orders'));
  console.log(`   נמצאו ${poSnap.size} הזמנות רכש קיימות`);
  poSnap.forEach(d => {
    const data = d.data();
    console.log(`   - #${data.po_number} | ספק: ${data.supplier_name} | סכום: ${data.total_amount} | פרויקט: ${data.project_name}`);
  });

  // 2. בדיקת collection purchase_records
  console.log('\n2. בודק purchase_records collection...');
  const prSnap = await getDocs(collection(db, 'purchase_records'));
  console.log(`   נמצאו ${prSnap.size} רשומות רכש`);

  // 3. בדיקת projects
  console.log('\n3. בודק projects...');
  const projSnap = await getDocs(collection(db, 'projects'));
  console.log(`   נמצאו ${projSnap.size} פרויקטים`);
  const firstProject = projSnap.docs[0];
  if (firstProject) {
    const projData = firstProject.data();
    console.log(`   פרויקט ראשון: ${projData.name} (${firstProject.id})`);

    // 4. יצירת הזמנת רכש לבדיקה
    console.log('\n4. יוצר הזמנת רכש לבדיקה...');
    const testPO = await addDoc(collection(db, 'purchase_orders'), {
      po_number: 99999,
      project_id: firstProject.id,
      project_name: projData.name || 'test',
      supplier_name: 'ספק בדיקה',
      supplier_phone: '050-0000000',
      items: [
        { name_snapshot: 'פריט בדיקה 1', quantity_to_order: 5, unit_price: 100 },
        { name_snapshot: 'פריט בדיקה 2', quantity_to_order: 3, unit_price: 200 },
      ],
      record_ids: [],
      status: 'הוזמן',
      total_amount: 1100,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    });
    console.log(`   נוצרה הזמנה: ${testPO.id}`);

    // 5. בדיקת filter לפי project_id
    console.log('\n5. בודק filter לפי project_id...');
    const filterSnap = await getDocs(query(collection(db, 'purchase_orders'), where('project_id', '==', firstProject.id)));
    console.log(`   נמצאו ${filterSnap.size} הזמנות לפרויקט ${projData.name}`);
    filterSnap.forEach(d => {
      const data = d.data();
      console.log(`   - #${data.po_number} | ${data.supplier_name} | ₪${data.total_amount}`);
    });

    // 6. בדיקת list של כל ההזמנות
    console.log('\n6. בודק list של כל ההזמנות...');
    const allSnap = await getDocs(collection(db, 'purchase_orders'));
    console.log(`   סה"כ: ${allSnap.size} הזמנות`);

    // 7. מחיקת הזמנת הבדיקה
    console.log('\n7. מוחק הזמנת בדיקה...');
    await deleteDoc(doc(db, 'purchase_orders', testPO.id));
    console.log('   נמחקה בהצלחה');
  }

  console.log('\n=== בדיקה הושלמה בהצלחה! ===');
  process.exit(0);
}

test().catch(err => { console.error('שגיאה:', err); process.exit(1); });
