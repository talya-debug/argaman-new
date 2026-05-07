import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDEVZMA7R6FLZBdkPg1GPVhv5AajwjWVb8',
  authDomain: 'argaman-f3921.firebaseapp.com',
  projectId: 'argaman-f3921',
  storageBucket: 'argaman-f3921.firebasestorage.app',
  messagingSenderId: '1089830122540',
  appId: '1:1089830122540:web:36a7ef49e3c90e8d8acd89'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const users = [
  { email: 'yanir@argaman.co.il', password: 'yanir123' },
  { email: 'chaya@argaman.co.il', password: 'chaya123' },
  { email: 'dvora@argaman.co.il', password: 'dvora123' },
  { email: 'rivka@argaman.co.il', password: 'rivka123' },
  { email: 'shai@argaman.co.il', password: 'shai1234' },
  { email: 'yehuda@argaman.co.il', password: 'yehuda123' },
];

async function createUsers() {
  for (const user of users) {
    try {
      await createUserWithEmailAndPassword(auth, user.email, user.password);
      console.log(`✓ נוצר: ${user.email} -> ${user.password}`);
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`⚠ ${user.email} כבר קיים - צריך Firebase Console לאיפוס`);
      } else {
        console.error(`✗ ${user.email} - ${err.code}: ${err.message}`);
      }
    }
  }
  console.log('\nסיום!');
  process.exit(0);
}

createUsers();
