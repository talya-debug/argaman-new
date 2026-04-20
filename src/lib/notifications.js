import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification } from '@/entities/Notification';

// סוגי התראות
export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_DUE: 'task_due',
  PAYMENT_OVERDUE: 'payment_overdue',
  PROJECT_STARTED: 'project_started',
  GENERAL: 'general',
};

// יצירת התראה חדשה
export async function createNotification({ user_id, title, message, type = 'general', link = '' }) {
  return await Notification.create({
    user_id,
    title,
    message,
    type,
    link,
    read: false,
    created_at: new Date().toISOString(),
  });
}

// סימון התראה כנקראה
export async function markAsRead(notificationId) {
  const ref = doc(db, 'notifications', notificationId);
  await updateDoc(ref, { read: true });
}

// סימון כל ההתראות של משתמש כנקראות
export async function markAllAsRead(userId) {
  const q = query(
    collection(db, 'notifications'),
    where('user_id', '==', userId),
    where('read', '==', false)
  );
  const snapshot = await getDocs(q);
  const updates = snapshot.docs.map((d) => updateDoc(d.ref, { read: true }));
  await Promise.all(updates);
}

// ספירת התראות שלא נקראו
export async function getUnreadCount(userId) {
  const q = query(
    collection(db, 'notifications'),
    where('user_id', '==', userId),
    where('read', '==', false)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// התראה על שיוך משימה
export async function notifyTaskAssigned(task, assignedTo) {
  return await createNotification({
    user_id: assignedTo,
    title: 'משימה חדשה שויכה אליך',
    message: `המשימה "${task.title}" שויכה אליך`,
    type: NOTIFICATION_TYPES.TASK_ASSIGNED,
    link: `/tasks/${task.id}`,
  });
}

// התראה על משימה שמתקרבת לדדליין
export async function notifyTaskDueSoon(task) {
  return await createNotification({
    user_id: task.assigned_to,
    title: 'משימה מתקרבת לדדליין',
    message: `המשימה "${task.title}" מתקרבת לתאריך היעד`,
    type: NOTIFICATION_TYPES.TASK_DUE,
    link: `/tasks/${task.id}`,
  });
}

// התראה על תשלום באיחור
export async function notifyPaymentOverdue(collectionTask) {
  return await createNotification({
    user_id: collectionTask.assigned_to || collectionTask.user_id,
    title: 'תשלום באיחור',
    message: `גבייה "${collectionTask.title || collectionTask.description}" באיחור`,
    type: NOTIFICATION_TYPES.PAYMENT_OVERDUE,
    link: `/collections/${collectionTask.id}`,
  });
}

// התראה על פרויקט חדש שהתחיל
export async function notifyProjectStarted(project) {
  return await createNotification({
    user_id: project.manager_id || project.user_id,
    title: 'פרויקט חדש התחיל',
    message: `הפרויקט "${project.name || project.title}" התחיל`,
    type: NOTIFICATION_TYPES.PROJECT_STARTED,
    link: `/projects/${project.id}`,
  });
}
