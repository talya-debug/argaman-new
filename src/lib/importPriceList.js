import { db } from './firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

// ייבוא מחירון מ-CSV
export async function importPriceList(csvText) {
  // בדוק אם כבר יש מחירון
  const snap = await getDocs(collection(db, 'price_items'));
  if (snap.size > 0) {
    console.log(`מחירון כבר קיים (${snap.size} פריטים)`);
    return { imported: 0, existing: snap.size };
  }

  const lines = csvText.split('\n');
  const headers = parseCSVLine(lines[0]);

  let imported = 0;
  let batch = writeBatch(db);
  let batchCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length < 5) continue;

    const item = {};
    headers.forEach((header, idx) => {
      item[header.trim()] = (values[idx] || '').trim();
    });

    // המר מחיר למספר
    const price = parseFloat(item.price_no_vat) || 0;
    const btu = parseFloat(item.btu) || 0;

    const ref = doc(collection(db, 'price_items'));
    batch.set(ref, {
      supplier_name: item.supplier_name || '',
      model: item.model || '',
      item_description: item.name || '',
      description: item.description || '',
      category: item.category || '',
      sub_category: item.sub_category || '',
      btu: btu,
      unit_price: price,
      image_url: item.image_url || '',
      tipe_item: item.tipe_item || '',
      original_id: item.id || '',
    });

    batchCount++;
    imported++;

    // Firestore מגביל ל-500 כתיבות בבאצ'
    if (batchCount >= 450) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
      console.log(`יובאו ${imported} פריטים...`);
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`✅ ייבוא מחירון הושלם: ${imported} פריטים`);
  return { imported, existing: 0 };
}

// פרסור שורת CSV עם תמיכה במירכאות
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
