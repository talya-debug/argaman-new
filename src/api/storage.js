const CLOUD_NAME = 'dcfu82qln';
const UPLOAD_PRESET = 'argaman_unsigned';

/**
 * העלאת קובץ ל-Cloudinary
 * מחליף את base44.integrations.Core.UploadFile
 * @param {File} file - קובץ להעלאה
 * @returns {{ url: string, name: string }}
 */
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) throw new Error('שגיאה בהעלאת קובץ');

  const data = await res.json();
  return {
    url: data.secure_url,
    name: file.name,
    size: file.size,
    type: file.type
  };
}

/**
 * מחיקת קובץ (לא נתמך בצד לקוח ב-Cloudinary, אפשר להתעלם)
 */
export async function deleteFile(filePath) {
  console.warn('מחיקת קבצים דורשת צד שרת');
}

/**
 * קבלת URL - ב-Cloudinary ה-URL כבר נשמר ישירות
 */
export async function getFileURL(filePath) {
  return filePath;
}
