import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskActivity } from '@/entities';
import { User } from '@/entities';
import { MessageCircle, Send, Clock } from "lucide-react";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from "sonner";

export default function TaskActivityLog({ taskId }) {
    const [activities, setActivities] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const loadActivities = useCallback(async () => {
        setIsLoading(true);
        try {
            const activityList = await TaskActivity.filter({ task_id: taskId });
            const sortedActivities = activityList.sort((a, b) => 
                new Date(b.created_date) - new Date(a.created_date)
            );
            setActivities(sortedActivities);
        } catch (error) {
            console.error('Error loading activities:', error);
        } finally {
            setIsLoading(false);
        }
    }, [taskId]);

    const loadCurrentUser = useCallback(async () => {
        try {
            const user = await User.me();
            setCurrentUser(user);
        } catch (error) {
            console.error('Error loading user:', error);
        }
    }, []);

    useEffect(() => {
        loadActivities();
        loadCurrentUser();
    }, [loadActivities, loadCurrentUser]);

    const handleSubmitComment = async () => {
        if (!newComment.trim()) {
            toast.error("אנא הזן הערה");
            return;
        }

        setIsSaving(true);
        try {
            await TaskActivity.create({
                task_id: taskId,
                user_name: currentUser?.full_name || 'משתמש אנונימי',
                comment: newComment.trim()
            });
            
            setNewComment('');
            await loadActivities(); // Reload activities
            toast.success("הערה נוספה בהצלחה");
        } catch (error) {
            console.error('Error saving activity:', error);
            toast.error("שגיאה בהוספת הערה");
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleSubmitComment();
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="w-5 h-5" />
                    יומן פעילות
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Add new comment */}
                <div className="space-y-3 mb-6">
                    <Textarea
                        placeholder="הוסף עדכון חדש..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-h-[80px]"
                        disabled={isSaving}
                    />
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-500">Ctrl + Enter לשליחה מהירה</p>
                        <Button 
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim() || isSaving}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Send className="w-4 h-4 ml-2" />
                            {isSaving ? 'שולח...' : 'הוסף עדכון'}
                        </Button>
                    </div>
                </div>

                {/* Activity timeline */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="border-b pb-4">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        ))
                    ) : activities.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>אין עדכונים עדיין</p>
                            <p className="text-sm">הוסף את העדכון הראשון</p>
                        </div>
                    ) : (
                        activities.map((activity) => (
                            <div key={activity.id} className="border-b border-slate-100 pb-4 last:border-b-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold text-xs">
                                            {activity.user_name.charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-900">{activity.user_name}</span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(activity.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mr-10">
                                    <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">
                                        {activity.comment}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}