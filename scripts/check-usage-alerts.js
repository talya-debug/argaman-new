/**
 * סקריפט בדיקת שימוש במערכת — מריץ פעם ביום
 * בודק: יומני עבודה, משימות, לידים, גבייה
 * יוצר התראות על חוסר פעילות
 *
 * שימוש: node scripts/check-usage-alerts.js
 * מומלץ להריץ כ-cron job יומי
 */

const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = require('./firebase-service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'argaman-f3921'
  });
}
const db = admin.firestore();

// כל המשתמשים במערכת
const USERS = ['חיה', 'יניר', 'דבורה', 'יהודה', 'רבקה', 'שי'];

async function createAlert(userId, title, message, type, link = '') {
  await db.collection('notifications').add({
    user_id: userId,
    title,
    message,
    type,
    link,
    read: false,
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

async function checkWorkLogs() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  // רק ימי עבודה (א-ה = 0-4 בישראל)
  const day = yesterday.getDay();
  if (day === 5 || day === 6) return; // שישי-שבת

  const dateStr = yesterday.toISOString().split('T')[0];
  const logs = await db.collection('work_log_entries')
    .where('date', '==', dateStr)
    .get();

  const reportedUsers = logs.docs.map(d => d.data().worker_name || d.data().reported_by);

  for (const user of USERS) {
    if (!reportedUsers.includes(user)) {
      await createAlert(
        user,
        'לא מולא יומן עבודה',
        `לא דווח יומן עבודה לתאריך ${new Date(dateStr).toLocaleDateString('he-IL')}`,
        'work_log_missing',
        '/WorkLogForm'
      );
      console.log(`התראה: ${user} לא מילא יומן עבודה ל-${dateStr}`);
    }
  }
}

async function checkOverdueTasks() {
  const today = new Date().toISOString().split('T')[0];
  const tasks = await db.collection('tasks')
    .where('status', '!=', 'הושלם')
    .get();

  for (const doc of tasks.docs) {
    const task = doc.data();
    if (task.due_date && task.due_date < today && task.assigned_to) {
      await createAlert(
        task.assigned_to,
        'משימה באיחור',
        `המשימה "${task.title}" עברה את תאריך היעד`,
        'task_due',
        `/Tasks`
      );
      console.log(`התראה: משימה באיחור — ${task.title}`);
    }
  }
}

async function checkOverduePayments() {
  const today = new Date().toISOString().split('T')[0];
  const collections = await db.collection('collection_tasks')
    .where('collection_status', 'in', ['ממתין', 'נשלחה חשבונית'])
    .get();

  for (const doc of collections.docs) {
    const task = doc.data();
    if (task.due_date && task.due_date < today) {
      // התראה למנהל
      await createAlert(
        'all',
        'תשלום באיחור',
        `גבייה "${task.description || task.title}" — ₪${task.amount || 0} באיחור`,
        'payment_overdue',
        '/CollectionDashboard'
      );
      console.log(`התראה: תשלום באיחור — ${task.description}`);
    }
  }
}

async function generateUsageReport() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();

  // ספירת פעולות ב-30 יום אחרונים
  const [logs, tasks, leads] = await Promise.all([
    db.collection('work_log_entries').where('createdAt', '>=', since).get(),
    db.collection('tasks').where('createdAt', '>=', since).get(),
    db.collection('leads').where('createdAt', '>=', since).get(),
  ]);

  console.log('\n========== דוח שימוש — 30 יום אחרונים ==========');
  console.log(`יומני עבודה: ${logs.size}`);
  console.log(`משימות חדשות: ${tasks.size}`);
  console.log(`לידים חדשים: ${leads.size}`);

  if (logs.size === 0 && tasks.size === 0 && leads.size === 0) {
    console.log('⚠️  המערכת לא בשימוש בכלל!');
  }
}

async function main() {
  console.log('בודק שימוש במערכת...\n');
  await checkWorkLogs();
  await checkOverdueTasks();
  await checkOverduePayments();
  await generateUsageReport();
  console.log('\nסיום.');
}

main().catch(console.error);
