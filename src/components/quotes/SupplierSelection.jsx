import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

const supplierColors = {
  "סמסונג": "bg-blue-100 text-blue-800 border-blue-200",
  "טורנדו": "bg-green-100 text-green-800 border-green-200",
  "הייסנס": "bg-purple-100 text-purple-800 border-purple-200",
  "אלקטרה": "bg-orange-100 text-orange-800 border-orange-200",
  "אריאה": "bg-red-100 text-red-800 border-red-200"
};

const suppliers = ["סמסונג", "טורנדו", "הייסנס", "אלקטרה", "אריאה"];

export default function SupplierSelection({ onComplete }) {
  
  const handleSupplierSelect = (supplierName) => {
    const supplierObject = {
      id: supplierName.toLowerCase(), // create an id from name
      name: supplierName
    };
    onComplete(supplierObject);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">שלב 1: בחר ספק למחירון</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((supplier) => (
          <Card
            key={supplier}
            className="cursor-pointer hover:shadow-xl transition-all duration-200 border-2 hover:border-blue-400 focus:ring-2 focus:ring-blue-500"
            onClick={() => handleSupplierSelect(supplier)}
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && handleSupplierSelect(supplier)}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <div className={`w-16 h-16 rounded-full ${supplierColors[supplier] || ''} flex items-center justify-center`}>
                  <Building2 className="w-8 h-8" />
                </div>
              </div>
              <CardTitle className="text-xl">{supplier}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <Badge variant="secondary" className={supplierColors[supplier] || ''}>
                מחירון מוצרים
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}