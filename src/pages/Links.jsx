
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  ExternalLink,
  Copy,
  BookUser,
  CheckSquare,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

const quickLinks = [
  {
    title: "טופס ליד חדש",
    description: "קליטת ליד חדש במערכת",
    icon: Users,
    color: "var(--info)",
    bgColor: "var(--info-bg)",
    gradient: "from-[#60a5fa] to-[#3b82f6]",
    url: createPageUrl("LeadForm")
  },
  {
    title: "יומן עבודה",
    description: "דיווח על התקדמות יומית בפרויקט",
    icon: BookUser,
    color: "var(--success)",
    bgColor: "var(--success-bg)",
    gradient: "from-[#4ade80] to-[#22c55e]",
    url: createPageUrl("WorkLogForm")
  },
  {
    title: "משימה חדשה",
    description: "יצירת משימה חדשה במערכת",
    icon: CheckSquare,
    color: "var(--warning)",
    bgColor: "var(--warning-bg)",
    gradient: "from-[#fbbf24] to-[#f59e0b]",
    url: createPageUrl("NewTask")
  },
  {
    title: "הצעת מחיר חדשה",
    description: "עבור לעמוד הלידים לבחירת לקוח ויצירת הצעה",
    icon: FileText,
    color: "#a78bfa",
    bgColor: "rgba(167,139,250,0.1)",
    gradient: "from-[#a78bfa] to-[#7c3aed]",
    url: createPageUrl("Leads")
  }
];

export default function Links() {
  const copyToClipboard = (url) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      toast.success("הקישור הועתק בהצלחה!", {
        description: "ניתן כעת לשתף את הקישור עם חברי הצוות",
      });
    });
  };

  return (
    <div className="p-4 md:p-8 min-h-screen" style={{ background: 'var(--dark)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>קישורים מהירים</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            טפסים ופעולות מהירות שניתן לשתף עם חברי הצוות או לשמור כקיצורי דרך
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {quickLinks.map((link, index) => (
            <div key={index} className="relative overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${link.gradient}`} />

              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl flex-shrink-0" style={{ background: link.bgColor }}>
                    <link.icon className="w-6 h-6" style={{ color: link.color }} />
                  </div>
                  <div className="text-right flex-1">
                    <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {link.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {link.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(link.url)}
                    className="btn btn-secondary flex-1 text-sm justify-center"
                  >
                    <Copy className="w-4 h-4 ml-1" />
                    העתק קישור
                  </button>
                  <button
                    className="btn btn-primary flex-1 text-sm justify-center"
                    onClick={() => window.open(link.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 ml-1" />
                    פתח
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions Section */}
        <div className="rounded-xl" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
          <div className="p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
              <CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} />
              כיצד להשתמש בקישורים
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-right">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>לשיתוף עם הצוות:</h3>
                <ol className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5" style={{ background: 'var(--argaman-bg)', color: 'var(--argaman)' }}>1</span>
                    <span>לחץ על "העתק קישור" של הטופס הרצוי</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5" style={{ background: 'var(--argaman-bg)', color: 'var(--argaman)' }}>2</span>
                    <span>שתף את הקישור עם חברי הצוות בווטסאפ, מייל או צ'אט</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5" style={{ background: 'var(--argaman-bg)', color: 'var(--argaman)' }}>3</span>
                    <span>הם יוכלו למלא את הטופס ישירות מהקישור</span>
                  </li>
                </ol>
              </div>

              <div className="text-right">
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>לשימוש אישי:</h3>
                <ol className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>1</span>
                    <span>שמור את הקישורים כמועדפים בדפדפן</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>2</span>
                    <span>השתמש בכפתור "פתח" לגישה מהירה</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>3</span>
                    <span>צור קיצורי דרך למסך הבית בנייד</span>
                  </li>
                </ol>
              </div>
            </div>

            <div className="rounded-lg p-4 mt-6" style={{ background: 'var(--argaman-bg)', border: '1px solid var(--argaman-border)' }}>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--argaman-bg)' }}>
                  <span className="text-sm font-bold" style={{ color: 'var(--argaman)' }}>💡</span>
                </div>
                <div className="text-right">
                  <h4 className="font-semibold mb-1" style={{ color: 'var(--argaman)' }}>טיפ:</h4>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    ניתן לשלוח את הקישורים ללקוחות כדי שימלאו בעצמם טופס ליד חדש או דיווח על בעיות
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
