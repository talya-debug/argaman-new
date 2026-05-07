// יצירת משתמשים פשוטים ב-Firestore (שם + סיסמה)
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

const users = [
  { id: 'yanir', username: 'yanir', password: 'yanir123', full_name: 'יניר', role: 'admin', email: 'yanir@arg-ac.co.il', phone: '054-9734747' },
  { id: 'chaya', username: 'chaya', password: 'chaya123', full_name: 'חיה', role: 'user', email: 'chaya@arg-ac.co.il', phone: '' },
  { id: 'dvora', username: 'dvora', password: 'dvora123', full_name: 'דבורה', role: 'user', email: 'dvora@arg-ac.co.il', phone: '' },
  { id: 'rivka', username: 'rivka', password: 'rivka123', full_name: 'רבקה', role: 'user', email: 'rivka@arg-ac.co.il', phone: '' },
  { id: 'shai', username: 'shai', password: 'shai123', full_name: 'שי', role: 'admin', email: 'shai@arg-ac.co.il', phone: '050-9281254' },
  { id: 'yehuda', username: 'yehuda', password: 'yehuda123', full_name: 'יהודה', role: 'user', email: 'yhoda@arg-ac.co.il', phone: '' },
];

async function createUsers() {
  for (const user of users) {
    const { id, ...data } = user;
    await setDoc(doc(db, 'users', id), data, { merge: true });
    console.log(`${user.full_name} (${user.username} / ${user.password})`);
  }
  console.log('\nכל המשתמשים נוצרו!');
  process.exit(0);
}

createUsers();
