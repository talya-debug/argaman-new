import { db } from '@/lib/firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';

const defaultUsers = [
  { id: 'yanir', full_name: 'יניר', email: 'yanir@argaman.co.il', role: 'admin', phone: '' },
  { id: 'chaya', full_name: 'חיה', email: 'chaya@argaman.co.il', role: 'user', phone: '' },
  { id: 'dvora', full_name: 'דבורה', email: 'dvora@argaman.co.il', role: 'user', phone: '' },
  { id: 'rivka', full_name: 'רבקה', email: 'rivka@argaman.co.il', role: 'user', phone: '' },
  { id: 'shai', full_name: 'שי', email: 'shai@argaman.co.il', role: 'user', phone: '' },
  { id: 'yehuda', full_name: 'יהודה', email: 'yehuda@argaman.co.il', role: 'user', phone: '' },
];

// אתחול משתמשים — רק אם הקולקציה ריקה
export async function initializeUsers() {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    if (snapshot.empty) {
      console.log('אתחול משתמשי ברירת מחדל...');
      for (const user of defaultUsers) {
        const { id, ...userData } = user;
        await setDoc(doc(db, 'users', id), userData);
      }
      console.log('משתמשי ברירת מחדל נוצרו בהצלחה');
    }
  } catch (error) {
    console.error('שגיאה באתחול משתמשים:', error);
  }
}
