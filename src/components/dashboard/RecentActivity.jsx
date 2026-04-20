import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { User, Clock } from "lucide-react";

const statusColors = {
  "חדש": "bg-blue-100 text-blue-800 border-blue-200",
  "איסוף מידע מלקוח": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "סיווג / הכנת הצעה": "bg-purple-100 text-purple-800 border-purple-200",
  "תיאום סיור": "bg-orange-100 text-orange-800 border-orange-200",
  "הצעה נשלחה": "bg-green-100 text-green-800 border-green-200",
  "אושר": "bg-emerald-100 text-emerald-800 border-emerald-200"
};

export default function RecentActivity({ leads, isLoading }) {
  return (
    <Card className="shadow-lg border-0 bg-[#1a1d27]">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          פעילות אחרונה
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full bg-[#2d3348]" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1 bg-[#2d3348]" />
                  <Skeleton className="h-3 w-24 bg-[#2d3348]" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full bg-[#2d3348]" />
              </div>
            ))
          ) : (
            leads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 p-2 hover:bg-[#252836] rounded-lg transition-colors">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 text-right">
                  <p className="font-medium text-slate-100 text-sm">{lead.name}</p>
                  <p className="text-xs text-slate-400">
                    {format(new Date(lead.created_date), 'dd/MM/yyyy', { locale: he })}
                  </p>
                </div>
                <Badge className={`text-xs ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}>
                  {lead.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
