import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar, AlertCircle } from "lucide-react";

const priorityColors = {
  "נמוכה": "bg-[rgba(96,165,250,0.1)]0/15 text-blue-400",
  "בינונית": "bg-[rgba(251,191,36,0.1)]0/15 text-yellow-400",
  "גבוהה": "bg-orange-500/15 text-orange-400",
  "דחוף": "bg-[rgba(248,113,113,0.1)]0/15 text-red-400"
};

export default function UpcomingTasks({ tasks, isLoading }) {
  return (
    <div className="rounded-xl animate-in" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
      <div className="p-6 pb-4">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--argaman)' }}>
          <Calendar className="w-5 h-5" />
          משימות קרובות
        </h3>
      </div>
      <div className="px-6 pb-6">
        <div className="space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ border: '1px solid var(--dark-border)' }}>
                <Skeleton className="h-4 w-32 mb-2" style={{ background: 'var(--dark-border)' }} />
                <Skeleton className="h-3 w-20" style={{ background: 'var(--dark-border)' }} />
              </div>
            ))
          ) : tasks.length === 0 ? (
            <div className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>
              אין משימות קרובות
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-lg transition-all duration-200"
                style={{ border: '1px solid var(--dark-border)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--argaman-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-right flex-1">
                    <p className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                      יעד: {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: he })}
                    </p>
                    <Badge className={`text-xs ${priorityColors[task.priority] || 'bg-[#141428]0/15 text-gray-400'}`}>
                      {task.priority}
                    </Badge>
                  </div>
                  {task.priority === 'דחוף' && (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: 'var(--danger)' }} />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
