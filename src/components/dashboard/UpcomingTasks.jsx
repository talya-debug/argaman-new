import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar, AlertCircle } from "lucide-react";

const priorityColors = {
  "נמוכה": "bg-blue-100 text-blue-800",
  "בינונית": "bg-yellow-100 text-yellow-800",
  "גבוהה": "bg-orange-100 text-orange-800",
  "דחוף": "bg-red-100 text-red-800"
};

export default function UpcomingTasks({ tasks, isLoading }) {
  return (
    <Card className="shadow-lg border-0 bg-[#1a1d27]">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          משימות קרובות
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="p-3 border border-[#2d3348] rounded-lg">
                <Skeleton className="h-4 w-32 mb-2 bg-[#2d3348]" />
                <Skeleton className="h-3 w-20 bg-[#2d3348]" />
              </div>
            ))
          ) : tasks.length === 0 ? (
            <div className="text-center text-slate-400 py-4">
              אין משימות קרובות
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="p-3 border border-[#2d3348] rounded-lg hover:bg-[#252836] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-right flex-1">
                    <p className="font-medium text-slate-100 text-sm mb-1">{task.title}</p>
                    <p className="text-xs text-slate-400 mb-2">
                      יעד: {format(new Date(task.due_date), 'dd/MM/yyyy', { locale: he })}
                    </p>
                    <Badge className={`text-xs ${priorityColors[task.priority] || 'bg-gray-100 text-gray-800'}`}>
                      {task.priority}
                    </Badge>
                  </div>
                  {task.priority === 'דחוף' && (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-1" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
