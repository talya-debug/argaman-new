/**
 * סקריפט מיגרציה: Base44 → Firebase
 *
 * שימוש:
 * 1. היכנסי ל-app.base44.com → פתחי את אפליקציית ארגמן
 * 2. בדפדפן, פתחי DevTools (F12) → Console
 * 3. הריצי: localStorage.getItem('base44_access_token')
 * 4. העתיקי את ה-token
 * 5. מצאי את ה-APP_ID בכתובת (בד"כ מופיע ב-URL)
 * 6. הריצי: node scripts/migrate-from-base44.js APP_ID TOKEN
 */

const { createClient } = require('@base44/sdk');
const admin = require('firebase-admin');

// פרטי Firebase
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'argaman-f3921'
});
const db = admin.firestore();

// קבלת פרמטרים
const APP_ID = process.argv[2];
const TOKEN = process.argv[3];

if (!APP_ID || !TOKEN) {
  console.error('שימוש: node scripts/migrate-from-base44.js APP_ID TOKEN');
  console.error('');
  console.error('איך למצוא:');
  console.error('1. היכנסי ל-app.base44.com ופתחי את ארגמן');
  console.error('2. DevTools → Console → localStorage.getItem("base44_access_token")');
  console.error('3. APP_ID מופיע ב-URL של האפליקציה');
  process.exit(1);
}

// ישויות להעברה + שמות הקולקציות ב-Firebase
const ENTITIES = [
  { name: 'Lead', collection: 'leads' },
  { name: 'Quote', collection: 'quotes' },
  { name: 'QuoteLine', collection: 'quote_lines' },
  { name: 'Project', collection: 'projects' },
  { name: 'Task', collection: 'tasks' },
  { name: 'ProgressEntry', collection: 'progress_entries' },
  { name: 'WorkLogEntry', collection: 'work_log_entries' },
  { name: 'PurchaseRecord', collection: 'purchase_records' },
  { name: 'SubContractor', collection: 'sub_contractors' },
  { name: 'CollectionTask', collection: 'collection_tasks' },
  { name: 'ChangeLog', collection: 'change_logs' },
  { name: 'TaskActivity', collection: 'task_activities' },
  { name: 'PriceItem', collection: 'price_items' },
];

async function migrate() {
  console.log('מתחבר ל-Base44...');
  const client = createClient({
    appId: APP_ID,
    token: TOKEN,
    serverUrl: '',
    requiresAuth: false,
  });

  const summary = [];

  for (const entity of ENTITIES) {
    try {
      console.log(`\nמושך ${entity.name}...`);
      const records = await client.entities[entity.name].list('-created_date', 5000);
      console.log(`  נמצאו ${records.length} רשומות`);

      if (records.length === 0) {
        summary.push({ entity: entity.name, count: 0, status: 'ריק' });
        continue;
      }

      // כתיבה ל-Firebase בקבוצות של 500
      const batch_size = 500;
      for (let i = 0; i < records.length; i += batch_size) {
        const batch = db.batch();
        const chunk = records.slice(i, i + batch_size);

        for (const record of chunk) {
          const docRef = db.collection(entity.collection).doc(String(record.id));
          // שמירת ה-ID המקורי מ-Base44
          batch.set(docRef, {
            ...record,
            _base44_id: record.id,
            _migrated_at: new Date().toISOString(),
          });
        }

        await batch.commit();
        console.log(`  נכתבו ${Math.min(i + batch_size, records.length)}/${records.length}`);
      }

      summary.push({ entity: entity.name, count: records.length, status: 'הועבר' });
    } catch (error) {
      console.error(`  שגיאה ב-${entity.name}:`, error.message);
      summary.push({ entity: entity.name, count: 0, status: `שגיאה: ${error.message}` });
    }
  }

  console.log('\n========== סיכום מיגרציה ==========');
  console.table(summary);
  console.log('סה"כ רשומות:', summary.reduce((s, e) => s + e.count, 0));
}

migrate().catch(console.error);
