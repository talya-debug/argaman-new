import { createEntity } from '../api/db';
import { auth } from '../lib/firebase';

// כל הישויות במערכת - מחליפות את base44.entities
export const Lead = createEntity('leads');
export const Quote = createEntity('quotes');
export const QuoteLine = createEntity('quote_lines');
export const Project = createEntity('projects');
export const Task = createEntity('tasks');
export const ProgressEntry = createEntity('progress_entries');
export const WorkLogEntry = createEntity('work_log_entries');
export const PurchaseRecord = createEntity('purchase_records');
export const SubContractor = createEntity('sub_contractors');
export const CollectionTask = createEntity('collection_tasks');
export const ChangeLog = createEntity('change_logs');
export const TaskActivity = createEntity('task_activities');
export const PriceItem = createEntity('price_items');
export const Notification = createEntity('notifications');
export const Vehicle = createEntity('vehicles');
export const VehicleExpense = createEntity('vehicle_expenses');
export const VehicleDocument = createEntity('vehicle_documents');

// User entity עם תמיכה ב-me() לתאימות עם הקוד הקיים
const _UserEntity = createEntity('users');
export const User = {
  ..._UserEntity,
  async me() {
    const saved = localStorage.getItem('argaman_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
};
