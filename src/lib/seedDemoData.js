import { db } from './firebase';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';

export async function seedDemoData() {
  // בדיקה אם כבר יש נתונים
  const leadsSnap = await getDocs(collection(db, 'leads'));
  if (leadsSnap.size > 0) return; // כבר נטען

  // יצירת ליד
  const leadRef = await addDoc(collection(db, 'leads'), {
    name: 'דוד כהן - בית פרטי רמת גן',
    phone: '054-1234567',
    email: 'david@example.com',
    address: 'רחוב הרצל 15, רמת גן',
    status: 'אושר',
    responsible: 'יניר',
    estimated_value: 85000,
    created_date: Timestamp.fromDate(new Date('2026-03-15')),
    last_interaction_date: Timestamp.fromDate(new Date('2026-04-10')),
    notes: 'התקנת מערכת מיזוג מרכזית - 5 יחידות',
  });

  // יצירת הצעת מחיר
  const quoteRef = await addDoc(collection(db, 'quotes'), {
    quote_number: 'Q-2026-001',
    client_name: 'דוד כהן',
    client_phone: '054-1234567',
    client_email: 'david@example.com',
    client_address: 'רחוב הרצל 15, רמת גן',
    title: 'התקנת מיזוג מרכזי - בית פרטי',
    status: 'אושרה',
    lead_id: leadRef.id,
    subtotal: 72000,
    discount_percentage: 0,
    vat_percentage: 18,
    total: 84960,
    responsible: 'יניר',
    created_date: Timestamp.fromDate(new Date('2026-03-18')),
  });

  // יצירת שורות הצעת מחיר
  const quoteLines = [
    { quote_id: quoteRef.id, item_description: 'מזגן עילי 1.5 כ"ס Tadiran', quantity: 3, unit_price: 4500, line_total: 13500, order_index: 1, supplier_name: 'תדיראן' },
    { quote_id: quoteRef.id, item_description: 'מזגן נסתר מיני מרכזי 3 כ"ס', quantity: 1, unit_price: 18000, line_total: 18000, order_index: 2, supplier_name: 'אלקטרה' },
    { quote_id: quoteRef.id, item_description: 'עבודות צנרת נחושת', quantity: 1, unit_price: 12000, line_total: 12000, order_index: 3, supplier_name: '' },
    { quote_id: quoteRef.id, item_description: 'עבודות חשמל', quantity: 1, unit_price: 8500, line_total: 8500, order_index: 4, supplier_name: '' },
    { quote_id: quoteRef.id, item_description: 'התקנה ואביזרים', quantity: 1, unit_price: 20000, line_total: 20000, order_index: 5, supplier_name: '' },
  ];
  for (const line of quoteLines) {
    await addDoc(collection(db, 'quote_lines'), { ...line, created_at: Timestamp.now() });
  }

  // יצירת פרויקט
  const projectRef = await addDoc(collection(db, 'projects'), {
    name: 'פרויקט - דוד כהן בית פרטי',
    client_name: 'דוד כהן',
    lead_id: leadRef.id,
    quote_id: quoteRef.id,
    status: 'בביצוע',
    start_date: '2026-04-01',
    responsible: 'יניר',
    deduction_insurance_percentage: 5,
    deduction_retention_percentage: 5,
    deduction_lab_tests_percentage: 0,
    is_archived: false,
    created_at: Timestamp.fromDate(new Date('2026-04-01')),
  });

  // יצירת משימות
  const tasks = [
    { title: 'פגישת התנעה עם הלקוח', assigned_to: 'יניר', status: 'הושלם', priority: 'גבוהה', due_date: '2026-04-02', project_id: projectRef.id, client_name: 'דוד כהן', source_type: 'auto', created_at: Timestamp.now() },
    { title: 'הזמנת ציוד מתדיראן', assigned_to: 'שי', status: 'הושלם', priority: 'גבוהה', due_date: '2026-04-05', project_id: projectRef.id, client_name: 'דוד כהן', source_type: 'auto', created_at: Timestamp.now() },
    { title: 'ביצוע עבודות צנרת', assigned_to: 'יהודה', status: 'בתהליך', priority: 'גבוהה', due_date: '2026-04-15', project_id: projectRef.id, client_name: 'דוד כהן', source_type: 'manual', created_at: Timestamp.now() },
    { title: 'התקנת יחידות מיזוג', assigned_to: 'יהודה', status: 'חדש', priority: 'בינונית', due_date: '2026-04-20', project_id: projectRef.id, client_name: 'דוד כהן', source_type: 'manual', created_at: Timestamp.now() },
    { title: 'בדיקות ומסירה ללקוח', assigned_to: 'יניר', status: 'חדש', priority: 'בינונית', due_date: '2026-04-25', project_id: projectRef.id, client_name: 'דוד כהן', source_type: 'manual', created_at: Timestamp.now() },
  ];
  for (const task of tasks) {
    await addDoc(collection(db, 'tasks'), task);
  }

  // יצירת רשומות רכש
  await addDoc(collection(db, 'purchase_records'), {
    project_id: projectRef.id, supplier_name: 'תדיראן', item_description: 'מזגן עילי 1.5 כ"ס',
    quantity_to_order: 3, unit_price: 3200, actual_total_cost: 9600, status: 'הגיע', created_at: Timestamp.now()
  });
  await addDoc(collection(db, 'purchase_records'), {
    project_id: projectRef.id, supplier_name: 'אלקטרה', item_description: 'מזגן מיני מרכזי 3 כ"ס',
    quantity_to_order: 1, unit_price: 12000, actual_total_cost: 12000, status: 'הוזמן', created_at: Timestamp.now()
  });

  // יצירת רשומות יומן עבודה
  await addDoc(collection(db, 'work_log_entries'), {
    project_id: projectRef.id, work_date: '2026-04-08', total_hours: 8, personnel: 'יהודה, שי', description: 'פריסת צנרת נחושת קומה א', created_at: Timestamp.now()
  });
  await addDoc(collection(db, 'work_log_entries'), {
    project_id: projectRef.id, work_date: '2026-04-09', total_hours: 6, personnel: 'יהודה', description: 'המשך צנרת + חיבורי חשמל', created_at: Timestamp.now()
  });

  // יצירת משימת גבייה
  await addDoc(collection(db, 'collection_tasks'), {
    project_id: projectRef.id, project_name: 'פרויקט - דוד כהן בית פרטי',
    client_name: 'דוד כהן', amount_to_collect: 42480, invoice_number: 'INV-001',
    invoice_date: '2026-04-10', payment_due_date: '2026-05-10',
    collection_status: 'נשלחה חשבונית', responsible: 'חיה',
    notes: 'חשבון ראשון - 50% מהסכום', created_at: Timestamp.now()
  });

  // יצירת ליד שני (פתוח/ממתין)
  await addDoc(collection(db, 'leads'), {
    name: 'משרדי הייטק - תל אביב',
    phone: '03-9876543',
    email: 'office@hitech.co.il',
    address: 'רוטשילד 45, תל אביב',
    status: 'המתנה לאישור',
    responsible: 'יניר',
    estimated_value: 250000,
    created_date: Timestamp.fromDate(new Date('2026-04-18')),
    notes: 'מיזוג מרכזי ל-3 קומות משרדים',
  });

  // יצירת הצעת מחיר שנייה (ממתינה)
  await addDoc(collection(db, 'quotes'), {
    quote_number: 'Q-2026-002',
    client_name: 'משרדי הייטק',
    title: 'מיזוג מרכזי - משרדי הייטק',
    status: 'נשלחה',
    subtotal: 210000,
    vat_percentage: 18,
    total: 247800,
    responsible: 'יניר',
    created_date: Timestamp.fromDate(new Date('2026-04-19')),
  });

  console.log('נתוני דוגמה נוצרו בהצלחה');
}
