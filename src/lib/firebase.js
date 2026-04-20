import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// הגדרות Firebase - יש למלא את הפרטים מהקונסולה של Firebase
// https://console.firebase.google.com -> הגדרות הפרויקט -> General -> Your apps
const firebaseConfig = {
  apiKey: "AIzaSyDEVZMA7R6FLZBdkPg1GPVhv5AajwjWVb8",
  authDomain: "argaman-f3921.firebaseapp.com",
  projectId: "argaman-f3921",
  storageBucket: "argaman-f3921.firebasestorage.app",
  messagingSenderId: "1089830122540",
  appId: "1:1089830122540:web:36a7ef49e3c90e8d8acd89"
};

// אתחול Firebase
const app = initializeApp(firebaseConfig);

// שירותים
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
