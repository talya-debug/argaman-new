import { createEntity } from '../api/db';
import { auth } from '../lib/firebase';

// כל הישויות במערכת - מחליפות את base44.entities
export const Lead = createEntity('leads');
export const Quote = createEntity('quotes');
export const QuoteLine = createEntity('quoteLines');
export const Project = createEntity('projects');
export const Task = createEntity('tasks');
export const ProgressEntry = createEntity('progressEntries');
export const WorkLogEntry = createEntity('workLogEntries');
export const PurchaseRecord = createEntity('purchaseRecords');
export const SubContractor = createEntity('subContractors');
export const CollectionTask = createEntity('collectionTasks');
export const ChangeLog = createEntity('changeLogs');
export const TaskActivity = createEntity('taskActivities');
export const PriceItem = createEntity('priceItems');
export const Notification = createEntity('notifications');

// User entity עם תמיכה ב-me() לתאימות עם הקוד הקיים
const _UserEntity = createEntity('users');
export const User = {
  ..._UserEntity,
  // מחזיר את המשתמש המחובר הנוכחי - מחליף את base44.auth.me()
  async me() {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    return {
      id: currentUser.uid,
      email: currentUser.email,
      full_name: currentUser.displayName || currentUser.email,
      displayName: currentUser.displayName,
    };
  }
};
