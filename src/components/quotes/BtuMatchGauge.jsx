import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function BtuMatchGauge({ currentBtu, requiredBtu }) {
    if (!requiredBtu || requiredBtu === 0) return null;

    const percentage = Math.min((currentBtu / requiredBtu) * 100, 100);
    const isOver = currentBtu > requiredBtu;
    const isMatch = Math.abs(currentBtu - requiredBtu) <= (requiredBtu * 0.1); // 10% tolerance

    let status = 'חסר';
    let badgeColor = 'bg-[rgba(248,113,113,0.1)] text-red-800';

    if (isMatch) {
        status = 'מתאים';
        badgeColor = 'bg-[rgba(74,222,128,0.1)] text-green-800';
    } else if (isOver) {
        status = 'עודף';
        badgeColor = 'bg-[rgba(251,191,36,0.1)] text-yellow-800';
    }

    return (
        <Card className="shadow-lg">
            <CardHeader className="pb-3">
                <CardTitle className="text-center text-lg">התאמת BTU</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-[#60a5fa] mb-2">
                        {percentage.toFixed(0)}%
                    </div>
                    <Badge className={badgeColor}>
                        {status}
                    </Badge>
                </div>

                <Progress value={percentage} className="w-full h-3 mb-4" />

                <div className="text-center text-sm text-gray-600">
                    <p className="font-medium">{currentBtu.toLocaleString()} BTU</p>
                    <p>מתוך {requiredBtu.toLocaleString()} נדרש</p>
                    {isOver && (
                        <p className="text-[#fbbf24] font-medium mt-2">
                            עודף: {(currentBtu - requiredBtu).toLocaleString()} BTU
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}