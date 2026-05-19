import React, { useState, useEffect, useMemo } from "react";
import { Task, User, Project } from "@/entities";
import { Button } from "@/components/ui/button";
import { Plus, Archive } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TaskForm from "../components/tasks/TaskForm";
import TaskList from "../components/tasks/TaskList";
import TaskFilters from "../components/tasks/TaskFilters";
import { toast } from "sonner";
import { createNotification, notifyTaskDueSoon, NOTIFICATION_TYPES } from "@/lib/notifications";
import { Notification } from "@/entities";
import { differenceInDays } from 'date-fns';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [filters, setFilters] = useState({});
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);
        const [allTasks, allProjects] = await Promise.all([
          Task.list('-created_date'),
          Project.list()
        ]);
        setTasks(allTasks);
        setProjects(allProjects);

        // בדיקת משימות שמתקרבות לדדליין — התראה חד-פעמית
        checkDueDateNotifications(allTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
        toast.error("שגיאה בטעינת המשימות");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const reloadTasks = async () => {
    setIsLoading(true);
    try {
      const allTasks = await Task.list('-created_date');
      setTasks(allTasks);
    } catch (error) {
      console.error('Error reloading tasks:', error);
      toast.error("שגיאה בטעינה מחדש של המשימות");
    } finally {
        setIsLoading(false);
    }
  };

  const handleFormSubmit = async (taskData) => {
    try {
      if (editingTask) {
        await Task.update(editingTask.id, taskData);
      } else {
        const creatorName = currentUser?.full_name || 'לא ידוע';
        await Task.create({ ...taskData, creator: taskData.creator || creatorName });

        // התראה למשתמש שהוקצתה לו משימה
        if (taskData.assigned_to) {
          createNotification({
            user_id: taskData.assigned_to,
            title: 'משימה חדשה',
            message: `הוקצתה לך משימה: ${taskData.title}`,
            type: 'task_assigned',
            link: '/Tasks',
          });
        }
      }

      await reloadTasks();
      setShowForm(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error("שגיאה בשמירת המשימה");
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    await reloadTasks();
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // בדיקת התראות דדליין — רק פעם אחת לכל משימה
  const checkDueDateNotifications = async (taskList) => {
    try {
      const now = new Date();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const dueSoonTasks = taskList.filter(t => {
        if (!t.due_date || t.status === 'הושלם' || t.status === 'בוטל') return false;
        const dueDate = new Date(t.due_date);
        const diff = dueDate - now;
        return diff >= 0 && diff <= oneDayMs;
      });

      if (dueSoonTasks.length === 0) return;

      // בדיקה אם כבר נשלחה התראה
      const existingNotifications = await Notification.list();
      const existingLinks = new Set(
        existingNotifications
          .filter(n => n.type === NOTIFICATION_TYPES.TASK_DUE)
          .map(n => n.link)
      );

      for (const task of dueSoonTasks) {
        const link = `/tasks/${task.id}`;
        if (!existingLinks.has(link)) {
          await notifyTaskDueSoon(task);
        }
      }
    } catch (err) {
      console.error('Error checking due date notifications:', err);
    }
  };

  const { todoTasks, doneTasks, cancelledTasks, archivedTasks, uniqueUsers, uniqueCreators } = useMemo(() => {
    let filtered = tasks;
    if (filters.assigned_to) {
        filtered = filtered.filter(t => t.assigned_to === filters.assigned_to);
    }
    if (filters.creator) {
        filtered = filtered.filter(t => t.creator === filters.creator);
    }
    if (filters.project_id) {
        filtered = filtered.filter(t => t.project_id === filters.project_id);
    }

    const todo = [];
    const done = [];
    const cancelled = [];
    const archived = [];

    filtered.forEach(task => {
      if (task.is_archived) {
        archived.push(task);
      } else if (task.status === 'בוטל') {
        cancelled.push(task);
      } else if (task.status === 'הושלם') {
        if (task.completion_date && differenceInDays(new Date(), new Date(task.completion_date)) > 7) {
          archived.push(task);
        } else {
          done.push(task);
        }
      } else {
        todo.push(task);
      }
    });

    const uniqueUsers = [...new Set(tasks.map(t => t.assigned_to).filter(Boolean))];
    const uniqueCreators = [...new Set(tasks.map(t => t.creator).filter(Boolean))];

    return { todoTasks: todo, doneTasks: done, cancelledTasks: cancelled, archivedTasks: archived, uniqueUsers, uniqueCreators };
  }, [tasks, filters]);


  return (
    <div className="p-4 md:p-8 min-h-screen animate-in" style={{ background: 'var(--dark)' }}>
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>מרכז המשימות</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>כל המשימות מכל המודולים במקום אחד</p>
          </div>
          <Dialog open={showForm} onOpenChange={(isOpen) => {
              setShowForm(isOpen);
              if (!isOpen) setEditingTask(null);
          }}>
            <DialogTrigger asChild>
              <button className="btn btn-primary w-full md:w-auto" onClick={() => setEditingTask(null)}>
                <Plus className="w-4 h-4" />
                משימה חדשה
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto" style={{ background: 'var(--dark-card)', borderColor: 'var(--dark-border)' }}>
              <DialogHeader>
                <DialogTitle className="text-right text-lg md:text-xl" style={{ color: 'var(--argaman)' }}>
                  {editingTask ? 'עריכת משימה' : 'יצירת משימה חדשה'}
                </DialogTitle>
              </DialogHeader>
              <TaskForm
                task={editingTask}
                onSubmit={handleFormSubmit}
                onCancel={() => setShowForm(false)}
              />
            </DialogContent>
          </Dialog>
        </header>

        <TaskFilters
            onFilterChange={handleFilterChange}
            users={uniqueUsers}
            creators={uniqueCreators}
            projects={projects}
        />

        <div className="space-y-8">
            <TaskList
                title="משימות לביצוע"
                tasks={todoTasks}
                isLoading={isLoading}
                onEdit={handleEditTask}
                onUpdate={reloadTasks}
                defaultOpen={true}
            />
            <TaskList
                title="משימות שבוצעו"
                tasks={doneTasks}
                isLoading={isLoading}
                onEdit={handleEditTask}
                onUpdate={reloadTasks}
            />
            <TaskList
                title="משימות בוטלו"
                tasks={cancelledTasks}
                isLoading={isLoading}
                onEdit={handleEditTask}
                onUpdate={reloadTasks}
            />
            <TaskList
                title="ארכיון"
                tasks={archivedTasks}
                isLoading={isLoading}
                onEdit={handleEditTask}
                onUpdate={reloadTasks}
                icon={<Archive className="w-5 h-5"/>}
            />
        </div>
      </div>
    </div>
  );
}
