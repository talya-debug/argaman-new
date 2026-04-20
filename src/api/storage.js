import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';
import { storage } from '../lib/firebase';

/**
 * העלאת קובץ ל-Firebase Storage
 * מחליף את base44.integrations.Core.UploadFile
 * @param {File} file - קובץ להעלאה
 * @param {string} [path] - נתיב בתוך Storage (ברירת מחדל: uploads/)
 * @returns {{ url: string, name: string, path: string }}
 */
export async function uploadFile(file, path = 'uploads') {
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `${path}/${fileName}`;
  const storageRef = ref(storage, filePath);

  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);

  return {
    url,
    name: file.name,
    path: filePath,
    size: file.size,
    type: file.type
  };
}

/**
 * קבלת URL להורדת קובץ
 * @param {string} filePath - נתיב הקובץ ב-Storage
 */
export async function getFileURL(filePath) {
  const storageRef = ref(storage, filePath);
  return await getDownloadURL(storageRef);
}

/**
 * מחיקת קובץ מ-Storage
 * @param {string} filePath - נתיב הקובץ ב-Storage
 */
export async function deleteFile(filePath) {
  const storageRef = ref(storage, filePath);
  await deleteObject(storageRef);
}

/**
 * רשימת כל הקבצים בתיקייה
 * @param {string} folderPath - נתיב התיקייה
 */
export async function listFiles(folderPath) {
  const folderRef = ref(storage, folderPath);
  const result = await listAll(folderRef);

  const files = await Promise.all(
    result.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        name: itemRef.name,
        path: itemRef.fullPath,
        url
      };
    })
  );

  return files;
}
