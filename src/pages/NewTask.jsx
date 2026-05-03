
import React from 'react';
import TaskForm from '../components/tasks/TaskForm';
import { Task } from '@/entities';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function NewTaskPage() {
    const navigate = useNavigate();

    const handleCreateTask = async (taskData) => {
        try {
            await Task.create(taskData);
            navigate(createPageUrl('Tasks'));
        } catch (error) {
            console.error("Error creating task:", error);
            toast.error("שגיאה ביצירת המשימה.");
        }
    };

    return (
        <div style={{ padding: 32, minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ maxWidth: 700, width: '100%', background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }} dir="rtl">
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--dark-border)' }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>יצירת משימה חדשה</h1>
                </div>
                <div style={{ padding: 32 }}>
                    <TaskForm
                        onSubmit={handleCreateTask}
                        onCancel={() => navigate(createPageUrl('Tasks'))}
                    />
                </div>
            </div>
        </div>
    );
}
