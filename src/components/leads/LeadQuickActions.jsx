import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Calendar, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusFlow = {
  "חדש": "איסוף מידע מלקוח",
  "איסוף מידע מלקוח": "סיווג / הכנת הצעה",
  "סיווג / הכנת הצעה": "תיאום סיור",
  "תיאום סיור": "סיור בוצע",
  "סיור בוצע": "הכנת הצעה",
  "הכנת הצעה": "הצעה מוכנה ממתינה לאישור",
  "הצעה מוכנה ממתינה לאישור": "הצעה נשלחה",
  "הצעה נשלחה": "המתנה לאישור / משא ומתן",
  "המתנה לאישור / משא ומתן": "אושר"
};

const statusResponsible = {
  "חדש": "חיה",
  "איסוף מידע מלקוח": "חיה",
  "סיווג / הכנת הצעה": "יניר",
  "תיאום סיור": "חיה",
  "סיור בוצע": "חיה",
  "הכנת הצעה": "דבורה",
  "הצעה מוכנה ממתינה לאישור": "יניר",
  "הצעה נשלחה": "חיה",
  "המתנה לאישור / משא ומתן": "חיה, יניר",
  "אושר": "יניר"
};

export default function LeadQuickActions({ lead, onStatusChange, onContactAction }) {
  const nextStatus = statusFlow[lead.status];
  const currentResponsible = statusResponsible[lead.status];

  const handleAdvanceStatus = () => {
    if (nextStatus) {
      onStatusChange(lead.id, {
        status: nextStatus,
        responsible: statusResponsible[nextStatus],
        last_interaction_date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${lead.phone}`;
    onContactAction && onContactAction('call', lead);
  };

  const handleEmail = () => {
    if (lead.email) {
      window.location.href = `mailto:${lead.email}`;
      onContactAction && onContactAction('email', lead);
    }
  };

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-700">פעולות מהירות</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Status */}
        <div className="text-right">
          <p className="text-xs text-slate-500 mb-1">סטטוס נוכחי:</p>
          <Badge variant="outline" className="text-xs">
            {lead.status}
          </Badge>
          <p className="text-xs text-slate-400 mt-1">
            אחראי: {currentResponsible}
          </p>
        </div>

        {/* Status Advancement */}
        {nextStatus && (
          <div className="border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdvanceStatus}
              className="w-full text-xs justify-between"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>העבר ל: {nextStatus}</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Contact Actions */}
        <div className="border-t pt-3 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCall}
            className="w-full text-xs justify-start hover:bg-green-50 hover:text-green-700"
          >
            <Phone className="w-3 h-3 ml-2" />
            התקשר: {lead.phone}
          </Button>

          {lead.email && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEmail}
              className="w-full text-xs justify-start hover:bg-blue-50 hover:text-blue-700"
            >
              <Mail className="w-3 h-3 ml-2" />
              שלח מייל: {lead.email}
            </Button>
          )}
        </div>

        {/* Follow-up Reminder */}
        {lead.followup_date && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              <span>פולואפ: {new Date(lead.followup_date).toLocaleDateString('he-IL')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}