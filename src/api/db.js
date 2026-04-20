import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// מפה אופרטורים מקוצרים לאופרטורים של Firestore
const operatorMap = {
  $eq: '==',
  $ne: '!=',
  $gt: '>',
  $gte: '>=',
  $lt: '<',
  $lte: '<=',
  $in: 'in',
  $contains: 'array-contains',
  $containsAny: 'array-contains-any'
};

// המרת מסמך Firestore לאובייקט רגיל עם id
function docToObject(docSnap) {
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  // המרת Timestamp לתאריך רגיל
  const converted = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      converted[key] = value.toDate().toISOString();
    } else {
      converted[key] = value;
    }
  }
  return { id: docSnap.id, ...converted };
}

/**
 * יוצר שכבת CRUD לקולקציה ב-Firestore
 * מחליף את ה-SDK של Base44 באופן שקוף
 * @param {string} collectionName - שם הקולקציה ב-Firestore
 */
export function createEntity(collectionName) {
  const colRef = collection(db, collectionName);

  return {
    /**
     * שליפת כל המסמכים מהקולקציה
     * @param {string} [orderField] - שדה למיון (עם - לסדר יורד, למשל '-created_date')
     * @param {number} [limitCount] - מספר מקסימלי של תוצאות
     * @param {number} [skip] - מספר תוצאות לדלג עליהן (לא נתמך ישירות, משתמש ב-startAfter)
     */
    async list(orderField, limitCount, skip) {
      const constraints = [];

      // מיון
      if (orderField) {
        const desc = orderField.startsWith('-');
        const field = desc ? orderField.slice(1) : orderField;
        constraints.push(orderBy(field, desc ? 'desc' : 'asc'));
      }

      // הגבלת כמות
      if (limitCount) {
        constraints.push(limit(limitCount));
      }

      const q = query(colRef, ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docToObject);
    },

    /**
     * שליפת מסמך בודד לפי ID
     * @param {string} id
     */
    async get(id) {
      const docRef = doc(db, collectionName, String(id));
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error(`מסמך ${id} לא נמצא ב-${collectionName}`);
      }
      return docToObject(docSnap);
    },

    /**
     * יצירת מסמך חדש
     * @param {object} data - הנתונים לשמירה
     */
    async create(data) {
      const now = new Date().toISOString();
      const docData = {
        ...data,
        createdAt: now,
        updatedAt: now
      };
      const docRef = await addDoc(colRef, docData);
      return { id: docRef.id, ...docData };
    },

    /**
     * עדכון מסמך קיים
     * @param {string} id
     * @param {object} data - השדות לעדכון
     */
    async update(id, data) {
      const docRef = doc(db, collectionName, String(id));
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(docRef, updateData);
      return { id, ...updateData };
    },

    /**
     * מחיקת מסמך
     * @param {string} id
     */
    async delete(id) {
      const docRef = doc(db, collectionName, String(id));
      await deleteDoc(docRef);
      return { id };
    },

    /**
     * סינון מסמכים לפי תנאים
     * תומך בפורמט פשוט: { field: value } לשוויון
     * או מתקדם: { field: { $gt: value } } לאופרטורים
     * @param {object} filters - תנאי סינון
     * @param {string} [orderField] - שדה למיון
     * @param {number} [limitCount] - הגבלת כמות
     * @param {number} [skip] - דילוג (לעמודים)
     */
    async filter(filters, orderField, limitCount, skip) {
      const constraints = [];

      // בניית תנאי where
      if (filters && typeof filters === 'object') {
        for (const [field, condition] of Object.entries(filters)) {
          if (condition !== null && typeof condition === 'object' && !Array.isArray(condition)) {
            // פורמט מתקדם: { $gt: 100 }
            for (const [op, value] of Object.entries(condition)) {
              const firestoreOp = operatorMap[op];
              if (firestoreOp) {
                constraints.push(where(field, firestoreOp, value));
              }
            }
          } else {
            // פורמט פשוט: שוויון
            constraints.push(where(field, '==', condition));
          }
        }
      }

      // מיון
      if (orderField) {
        const desc = orderField.startsWith('-');
        const field = desc ? orderField.slice(1) : orderField;
        constraints.push(orderBy(field, desc ? 'desc' : 'asc'));
      }

      // הגבלת כמות (כולל דילוג - מביאים יותר ואז חותכים)
      if (limitCount && skip) {
        constraints.push(limit(limitCount + skip));
      } else if (limitCount) {
        constraints.push(limit(limitCount));
      }

      const q = query(colRef, ...constraints);
      const snapshot = await getDocs(q);
      let results = snapshot.docs.map(docToObject);

      // דילוג ידני (Firestore לא תומך ב-offset ישירות)
      if (skip) {
        results = results.slice(skip);
      }

      return results;
    }
  };
}
