
import React from 'react';
import TaskForm from '../components/tasks/TaskForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-3xl shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-slate-900 text-right">
                        יצירת משימה חדשה
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <TaskForm
                        onSubmit={handleCreateTask}
                        onCancel={() => navigate(createPageUrl('Tasks'))}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
