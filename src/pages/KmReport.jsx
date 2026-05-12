import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleExpense } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function KmReport() {
    const [allVehicles, setAllVehicles] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [reports, setReports] = useState({});
    const [submitted, setSubmitted] = useState(new Set());
    const [submitting, setSubmitting] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await Vehicle.list();
                setAllVehicles(data.filter(v => v.status === 'פעיל'));
            } catch { toast.error('שגיאה בטעינה'); }
            setLoading(false);
        };
        load();
    }, []);

    // כשבוחרים משתמש — מסננים רכבים
    useEffect(() => {
        if (!selectedUser) return;
        const filtered = allVehicles.filter(v => v.assigned_to === selectedUser);
        setVehicles(filtered);
        const initial = {};
        filtered.forEach(v => { initial[v.id] = ''; });
        setReports(initial);
    }, [selectedUser, allVehicles]);

    // רשימת עובדים ייחודית מהרכבים
    const assignedUsers = [...new Set(allVehicles.map(v => v.assigned_to).filter(Boolean))];

    const handleSubmit = async (vehicle) => {
        const km = Number(reports[vehicle.id]);
        if (!km || km <= 0) { toast.error('יש להזין ק"מ תקין'); return; }
        if (vehicle.current_km && km < vehicle.current_km) { toast.error(`ק"מ חייב להיות גבוה מ-${vehicle.current_km.toLocaleString()}`); return; }

        setSubmitting(vehicle.id);
        try {
            await VehicleExpense.create({
                vehicle_id: vehicle.id,
                expense_type: 'דיווח_קמ',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                km_at_expense: km,
                description: `דיווח ק"מ חודשי`
            });
            await Vehicle.update(vehicle.id, { current_km: km });
            setSubmitted(prev => new Set([...prev, vehicle.id]));
            toast.success(`${vehicle.license_plate} — עודכן ל-${km.toLocaleString()} ק"מ`);
        } catch { toast.error('שגיאה בשמירה'); }
        setSubmitting(null);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#f1f3f8' }}>
            <p className="text-gray-500">טוען רכבים...</p>
        </div>
    );

    return (
        <div className="min-h-screen p-4 md:p-8" dir="rtl" style={{ background: '#f1f3f8', fontFamily: 'Heebo, sans-serif' }}>
            <div className="max-w-lg mx-auto space-y-6">
                <div className="text-center">
                    <img src="/logo.jpg" alt="ארגמן" style={{ width: 60, height: 60, borderRadius: 10, margin: '0 auto 12px' }}
                        onError={(e) => { e.target.style.display = 'none'; }} />
                    <h1 className="text-2xl font-bold text-slate-800">דיווח ק"מ חודשי</h1>
                    <p className="text-gray-500 mt-1">הזן את מד הק"מ הנוכחי של כל רכב</p>
                    <p className="text-sm text-gray-400 mt-1">{new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}</p>
                </div>

                {!selectedUser ? (
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-6">
                            <p className="text-center font-medium text-slate-700 mb-4">מי אתה?</p>
                            <div className="grid grid-cols-2 gap-3">
                                {assignedUsers.map(name => (
                                    <Button key={name} variant="outline" className="h-14 text-lg font-medium hover:bg-indigo-50 hover:border-indigo-400" onClick={() => setSelectedUser(name)}>
                                        {name}
                                    </Button>
                                ))}
                            </div>
                            {assignedUsers.length === 0 && <p className="text-center text-gray-400 mt-4">אין רכבים משויכים לעובדים</p>}
                        </CardContent>
                    </Card>
                ) : vehicles.length === 0 ? (
                    <Card><CardContent className="p-8 text-center text-gray-400">אין רכבים משויכים ל-{selectedUser}</CardContent></Card>
                ) : vehicles.map(v => {
                    const isDone = submitted.has(v.id);
                    return (
                        <Card key={v.id} className={`border-0 shadow-md transition-all ${isDone ? 'bg-green-50 border-green-200' : ''}`}>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <Car className={`w-5 h-5 ${isDone ? 'text-green-600' : 'text-indigo-600'}`} />
                                        <div>
                                            <p className="font-bold text-slate-800" dir="ltr">{v.license_plate}</p>
                                            <p className="text-sm text-gray-500">{[v.brand, v.model].filter(Boolean).join(' ')} {v.assigned_to ? `• ${v.assigned_to}` : ''}</p>
                                        </div>
                                    </div>
                                    {isDone && <Check className="w-6 h-6 text-green-600" />}
                                </div>

                                {v.current_km > 0 && (
                                    <p className="text-xs text-gray-400 mb-2">ק"מ אחרון ידוע: {v.current_km.toLocaleString()}</p>
                                )}

                                {isDone ? (
                                    <p className="text-green-700 font-medium text-center py-2">דווח בהצלחה ✓</p>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            placeholder="הזן ק״מ נוכחי"
                                            value={reports[v.id] || ''}
                                            onChange={e => setReports(prev => ({ ...prev, [v.id]: e.target.value }))}
                                            className="flex-1"
                                            min={v.current_km || 0}
                                        />
                                        <Button
                                            onClick={() => handleSubmit(v)}
                                            disabled={submitting === v.id}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
                                        >
                                            {submitting === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שלח'}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}

                {submitted.size === vehicles.length && vehicles.length > 0 && (
                    <div className="text-center py-6">
                        <p className="text-xl font-bold text-green-700">כל הרכבים דווחו!</p>
                        <p className="text-gray-500 mt-1">תודה, אפשר לסגור את הדף.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
