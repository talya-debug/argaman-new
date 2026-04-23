import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function BtuMatchGauge({ quoteLines, currentBtu, requiredBtu }) {
    // חישוב BTU מתוך שורות ההצעה אם לא התקבלו ערכים ישירים
    const btuData = useMemo(() => {
        // אם התקבלו ערכים ישירים, נשתמש בהם
        if (currentBtu !== undefined && requiredBtu !== undefined) {
            return { indoorBtu: currentBtu, outdoorBtu: requiredBtu };
        }

        // אחרת, חישוב מתוך quoteLines
        let indoorTotal = 0;
        let outdoorTotal = 0;

        if (!quoteLines || quoteLines.length === 0) {
            return { indoorBtu: 0, outdoorBtu: 0 };
        }

        quoteLines.forEach(line => {
            const tipeItem = line.tipe_item_snapshot || line.tipe_item || '';
            const btu = parseFloat(line.btu_snapshot || line.btu) || 0;
            const quantity = parseFloat(line.quantity) || 1;
            const totalBtu = btu * quantity;

            if (tipeItem === 'מאייד') {
                indoorTotal += totalBtu;
            } else if (tipeItem === 'מעבה') {
                outdoorTotal += totalBtu;
            } else {
                // Fallback - ניסיון לזהות לפי קטגוריה/מודל
                const category = (line.category_snapshot || line.category || '').toLowerCase();
                const model = (line.model_snapshot || line.model || '').toLowerCase();

                if (category.includes('מאייד') || category.includes('evaporator') ||
                    model.includes('קסטה') || model.includes('קיר') || model.includes('תקרה') ||
                    model.includes('cassette') || model.includes('wall') || model.includes('ceiling')) {
                    indoorTotal += totalBtu;
                } else if (category.includes('vrf') || category.includes('מעבה') || category.includes('condenser') ||
                    model.includes('vrf') || model.includes('outdoor') || model.includes('חיצונית')) {
                    outdoorTotal += totalBtu;
                }
            }
        });

        return {
            indoorBtu: Math.round(indoorTotal),
            outdoorBtu: Math.round(outdoorTotal)
        };
    }, [quoteLines, currentBtu, requiredBtu]);

    // אם אין נתונים בכלל, לא מציגים
    if (btuData.indoorBtu === 0 && btuData.outdoorBtu === 0) return null;

    const utilization = btuData.outdoorBtu > 0 ? Math.round((btuData.indoorBtu / btuData.outdoorBtu) * 100) : 0;

    let status, badgeColor;
    if (btuData.outdoorBtu === 0) {
        status = 'אין מעבה';
        badgeColor = 'bg-gray-100 text-gray-800';
    } else if (utilization <= 70) {
        status = 'ניצול תקין';
        badgeColor = 'bg-[rgba(74,222,128,0.1)] text-green-800';
    } else if (utilization <= 100) {
        status = 'ניצול גבוה';
        badgeColor = 'bg-[rgba(251,191,36,0.1)] text-yellow-800';
    } else {
        status = 'חריגה';
        badgeColor = 'bg-[rgba(248,113,113,0.1)] text-red-800';
    }

    const percentage = Math.min(utilization, 130);

    return (
        <Card className="shadow-lg">
            <CardHeader className="pb-3">
                <CardTitle className="text-center text-lg">התאמת BTU</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-[#60a5fa] mb-2">
                        {utilization}%
                    </div>
                    <Badge className={badgeColor}>
                        {status}
                    </Badge>
                </div>

                <Progress value={percentage} max={130} className="w-full h-3 mb-4" />

                <div className="text-center text-sm text-[#a0a0b8]">
                    <p className="font-medium">מאיידים: {btuData.indoorBtu.toLocaleString()} BTU</p>
                    <p>מעבה: {btuData.outdoorBtu.toLocaleString()} BTU</p>
                    {utilization > 100 && (
                        <p className="text-[#f87171] font-medium mt-2">
                            חריגה: {(btuData.indoorBtu - btuData.outdoorBtu).toLocaleString()} BTU
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
