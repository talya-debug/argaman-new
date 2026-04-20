import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { User, Clock } from "lucide-react";

const statusColors = {
  "חדש": "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  "איסוף מידע מלקוח": "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
  "סיווג / הכנת הצעה": "bg-purple-500/15 text-purple-400 border border-purple-500/20",
  "תיאום סיור": "bg-orange-500/15 text-orange-400 border border-orange-500/20",
  "הצעה נשלחה": "bg-green-500/15 text-green-400 border border-green-500/20",
  "אושר": "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
};

export default function RecentActivity({ leads, isLoading }) {
  return (
    <div className="rounded-xl animate-in" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
      <div className="p-6 pb-4">
        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--argaman)' }}>
          <Clock className="w-5 h-5" />
          פעילות אחרונה
        </h3>
      </div>
      <div className="px-6 pb-6">
        <div className="space-y-4">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" style={{ background: 'var(--dark-border)' }} />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" style={{ background: 'var(--dark-border)' }} />
                  <Skeleton className="h-3 w-24" style={{ background: 'var(--dark-border)' }} />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" style={{ background: 'var(--dark-border)' }} />
              </div>
            ))
          ) : (
            leads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center gap-3 p-2 rounded-lg transition-all duration-200"
                style={{ cursor: 'default' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--argaman-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--argaman-bg)' }}>
                  <User className="w-5 h-5" style={{ color: 'var(--argaman-light)' }} />
                </div>
                <div className="flex-1 text-right">
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{lead.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {format(new Date(lead.created_date), 'dd/MM/yyyy', { locale: he })}
                  </p>
                </div>
                <Badge className={`text-xs ${statusColors[lead.status] || 'bg-gray-500/15 text-gray-400'}`}>
                  {lead.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
