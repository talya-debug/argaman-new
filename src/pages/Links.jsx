
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
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
    url: createPageUrl("LeadForm")
  },
  {
    title: "יומן עבודה",
    description: "דיווח על התקדמות יומית בפרויקט",
    icon: BookUser,
    color: "bg-green-500",
    gradient: "from-green-500 to-green-600",
    url: createPageUrl("WorkLogForm")
  },
  {
    title: "משימה חדשה",
    description: "יצירת משימה חדשה במערכת",
    icon: CheckSquare,
    color: "bg-yellow-500",
    gradient: "from-yellow-500 to-yellow-600",
    url: createPageUrl("NewTask")
  },
  {
    title: "הצעת מחיר חדשה",
    description: "עבור לעמוד הלידים לבחירת לקוח ויצירת הצעה",
    icon: FileText,
    color: "bg-purple-500",
    gradient: "from-purple-500 to-purple-600",
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
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">קישורים מהירים</h1>
          <p className="text-slate-500">
            טפסים ופעולות מהירות שניתן לשתף עם חברי הצוות או לשמור כקיצורי דרך
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {quickLinks.map((link, index) => (
            <Card key={index} className="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0">
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${link.gradient}`} />

              <CardHeader className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${link.color} bg-opacity-10 flex-shrink-0`}>
                    <link.icon className={`w-6 h-6 ${link.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="text-right flex-1">
                    <CardTitle className="text-lg font-bold text-slate-900 mb-1">
                      {link.title}
                    </CardTitle>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {link.description}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-0">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(link.url)}
                    className="flex-1 text-sm"
                  >
                    <Copy className="w-4 h-4 ml-1" />
                    העתק קישור
                  </Button>
                  <Button
                    size="sm"
                    className={`${link.color} hover:opacity-90 flex-1 text-sm`}
                    onClick={() => window.open(link.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 ml-1" />
                    פתח
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions Section */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              כיצד להשתמש בקישורים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-right">
                <h3 className="font-semibold text-slate-900 mb-2">לשיתוף עם הצוות:</h3>
                <ol className="space-y-2 text-slate-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
                    <span>לחץ על "העתק קישור" של הטופס הרצוי</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
                    <span>שתף את הקישור עם חברי הצוות בווטסאפ, מייל או צ'אט</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
                    <span>הם יוכלו למלא את הטופס ישירות מהקישור</span>
                  </li>
                </ol>
              </div>

              <div className="text-right">
                <h3 className="font-semibold text-slate-900 mb-2">לשימוש אישי:</h3>
                <ol className="space-y-2 text-slate-600 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-green-100 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
                    <span>שמור את הקישורים כמועדפים בדפדפן</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-green-100 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
                    <span>השתמש בכפתור "פתח" לגישה מהירה</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-green-100 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
                    <span>צור קיצורי דרך למסך הבית בנייד</span>
                  </li>
                </ol>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">💡</span>
                </div>
                <div className="text-right">
                  <h4 className="font-semibold text-blue-900 mb-1">טיפ:</h4>
                  <p className="text-blue-800 text-sm">
                    ניתן לשלוח את הקישורים ללקוחות כדי שימלאו בעצמם טופס ליד חדש או דיווח על בעיות
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
