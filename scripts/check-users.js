import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function check() {
  const snapshot = await getDocs(collection(db, 'users'));
  console.log(`נמצאו ${snapshot.size} משתמשים ב-Firestore:\n`);
  snapshot.forEach(doc => {
    console.log(`ID: ${doc.id}`, JSON.stringify(doc.data()));
  });
  process.exit(0);
}

check();
