import React, { useState } from 'react';
import { Project, QuoteLine } from '@/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function FixQuoteLineOrder() {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleRunFix = async () => {
        setIsRunning(true);
        setError(null);
        setResult(null);

        try {
            // קריאה ישירה לפונקציה במקום base44.functions.invoke
            const allProjects = await Project.list('-created_date');
            const openProjects = allProjects.filter(p => p.status !== 'הושלם' && p.status !== 'בוטל');

            const details = [];
            let totalLinesFixed = 0;

            for (const project of openProjects) {
                if (!project.quote_id) {
                    details.push({
                        project_id: project.id,
                        project_name: project.name,
                        status: 'skipped',
                        lines_count: 0,
                        fixed_count: 0
                    });
                    continue;
                }

                const lines = await QuoteLine.filter({ quote_id: project.quote_id });
                const sortedLines = lines.sort((a, b) => {
                    if (a.order_index !== undefined && b.order_index !== undefined) {
                        return a.order_index - b.order_index;
                    }
                    return new Date(a.created_date) - new Date(b.created_date);
                });

                let fixedCount = 0;
                for (let i = 0; i < sortedLines.length; i++) {
                    if (sortedLines[i].order_index !== i) {
                        await QuoteLine.update(sortedLines[i].id, { order_index: i });
                        fixedCount++;
                    }
                }

                totalLinesFixed += fixedCount;
                details.push({
                    project_id: project.id,
                    project_name: project.name,
                    status: fixedCount > 0 ? 'fixed' : 'ok',
                    lines_count: sortedLines.length,
                    fixed_count: fixedCount
                });
            }

            const resultData = {
                success: true,
                total_projects_checked: openProjects.length,
                total_lines_fixed: totalLinesFixed,
                details
            };

            setResult(resultData);
            toast.success('תיקון סדר השורות הסתיים בהצלחה!');
        } catch (err) {
            const errorMsg = err.message || 'שגיאה בלתי ידועה';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen" dir="rtl">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">תיקון סדר השורות בפרויקטים</h1>
                    <p className="text-slate-600">בדיקה ותיקון אוטומטי של סדר השורות בכתב הכמויות לכל הפרויקטים הפתוחים</p>
                </div>

                <Card className="mb-6">
                    <CardHeader className="bg-blue-50 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-blue-600" />
                            מידע חשוב
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-3 text-sm text-slate-700">
                        <p>• כלי זה יבדוק את כל הפרויקטים הפתוחים (לא מוסרים או הושלמים)</p>
                        <p>• לכל פרויקט יתקן את סדר השורות לפי ההצעה המקורית</p>
                        <p>• <strong>לא ישנה</strong> שום נתונים כספיים או אחוזי ביצוע</p>
                        <p>• <strong>לא ייצור חישוב מחדש</strong> של סכומים</p>
                        <p>• יעדכן רק את שדה order_index לשמירת הסדר הנכון</p>
                    </CardContent>
                </Card>

                <div className="mb-6">
                    <Button
                        onClick={handleRunFix}
                        disabled={isRunning}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 w-full text-white font-semibold py-6"
                    >
                        {isRunning ? 'ביצוע תיקון...' : 'בדוק ותקן את סדר השורות'}
                    </Button>
                </div>

                {isRunning && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-4/6" />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-700">
                                <AlertTriangle className="w-5 h-5" />
                                שגיאה
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-red-700 text-sm">
                            {error}
                        </CardContent>
                    </Card>
                )}

                {result && (
                    <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-700">
                                <CheckCircle2 className="w-5 h-5" />
                                התיקון הסתיים בהצלחה
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-4">
                            <div className="space-y-2 text-slate-700">
                                <p><strong>סך הפרויקטים שנבדקו:</strong> {result.total_projects_checked}</p>
                                <p><strong>סך הפרויקטים שתוקנו:</strong> {result.details?.filter(d => d.status === 'fixed').length || 0}</p>
                                <p><strong>סך השורות שתוקנו:</strong> {result.total_lines_fixed}</p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-green-200">
                                <h4 className="font-semibold mb-2 text-slate-800">פירוט לפי פרויקט:</h4>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {result.details?.map((detail) => (
                                        <div
                                            key={detail.project_id}
                                            className={`p-2 rounded text-xs ${
                                                detail.status === 'fixed'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-green-100 text-green-800'
                                            }`}
                                        >
                                            <div className="font-semibold">{detail.project_name}</div>
                                            <div className="text-xs mt-1">
                                                {detail.status === 'fixed' ? (
                                                    <>תוקן: {detail.fixed_count} שורות מתוך {detail.lines_count}</>
                                                ) : (
                                                    <>בסדר: {detail.lines_count} שורות</>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
