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
    let badgeColor = 'bg-red-100 text-red-800';

    if (isMatch) {
        status = 'מתאים';
        badgeColor = 'bg-green-100 text-green-800';
    } else if (isOver) {
        status = 'עודף';
        badgeColor = 'bg-yellow-100 text-yellow-800';
    }

    return (
        <Card className="shadow-lg">
            <CardHeader className="pb-3">
                <CardTitle className="text-center text-lg">התאמת BTU</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
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
                        <p className="text-yellow-600 font-medium mt-2">
                            עודף: {(currentBtu - requiredBtu).toLocaleString()} BTU
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}