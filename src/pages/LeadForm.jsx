
import React, { useState } from 'react';
import { Lead } from '@/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const STATUSES = [
  "חדש",
  "איסוף מידע מלקוח",
  "סיווג / הכנת הצעה",
  "תיאום סיור",
  "סיור בוצע",
  "הכנת הצעה",
  "הצעה מוכנה ממתינה לאישור",
  "הצעה נשלחה",
  "המתנה לאישור / משא ומתן",
  "אושר",
  "נדחה"
];

const RESPONSIBLES = ["חיה", "יניר", "דבורה"];

export default function LeadForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    status: 'חדש',
    followup_date: '',
    responsible: '',
    notes: '',
    source: '',
    estimated_value: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("נא למלא שם וטלפון.");
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = { ...formData };

      // Fix estimated_value handling
      if (submitData.estimated_value === '' || submitData.estimated_value === null || submitData.estimated_value === undefined) {
        delete submitData.estimated_value;
      } else {
        submitData.estimated_value = parseFloat(submitData.estimated_value);
      }

      await Lead.create({
        ...submitData,
        last_interaction_date: new Date().toISOString().split('T')[0]
      });

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        status: 'חדש',
        followup_date: '',
        responsible: '',
        notes: '',
        source: '',
        estimated_value: ''
      });
    } catch (error) {
      console.error("Failed to create lead:", error);
      toast.error("שגיאה ביצירת הליד.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 md:p-8 bg-[#1a1a2e] min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-4xl shadow-2xl bg-[#1a1a2e]" dir="rtl">
        <CardHeader className="bg-[#c42b2b] text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold text-center">הוספת ליד חדש</CardTitle>
          <p className="text-blue-100 text-center">מלא את פרטי הליד החדש במערכת</p>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-right font-medium text-[#e0e0e0]">שם *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  className="text-right bg-[#1a1a2e] border-2 border-gray-300 focus:border-blue-500 h-12"
                  placeholder="שם הלקוח"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-right font-medium text-[#e0e0e0]">טלפון *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  required
                  className="text-right bg-[#1a1a2e] border-2 border-gray-300 focus:border-blue-500 h-12"
                  placeholder="מספר טלפון"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-right font-medium text-[#e0e0e0]">מייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="text-right bg-[#1a1a2e] border-2 border-gray-300 focus:border-blue-500 h-12"
                  placeholder="כתובת מייל"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_value" className="text-right font-medium text-[#e0e0e0]">ערך משוער (₪)</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => handleChange('estimated_value', e.target.value)}
                  className="text-right bg-[#1a1a2e] border-2 border-gray-300 focus:border-blue-500 h-12"
                  placeholder="ערך משוער"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-right font-medium text-[#e0e0e0]">סטטוס</Label>
                <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger className="text-right bg-[#1a1a2e] border-2 border-gray-300 focus:border-blue-500 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e]">
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible" className="text-right font-medium text-[#e0e0e0]">אחראי</Label>
                <Select value={formData.responsible} onValueChange={(value) => handleChange('responsible', value)}>
                  <SelectTrigger className="text-right bg-[#1a1a2e] border-2 border-gray-300 focus:border-blue-500 h-12">
                    <SelectValue placeholder="בחר אחראי" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e]">
                    {RESPONSIBLES.map((responsible) => (
                      <SelectItem key={responsible} value={responsible}>
                        {responsible}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="followup_date" className="text-right font-medium text-[#e0e0e0]">תאריך פולואפ</Label>
                <Input
                  id="followup_date"
                  type="date"
                  value={formData.followup_date}
                  onChange={(e) => handleChange('followup_date', e.target.value)}
                  className="text-right bg-[#1a1a2e] border-2 border-gray-300 focus:border-blue-500 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source" className="text-right font-medium text-[#e0e0e0]">מקור</Label>
                <Input
                  id="source"
                  value={formData.source}
                  onChange={(e) => handleChange('source', e.target.value)}
                  className="text-right bg-[#1a1a2e] border-2 border-gray-300 focus:border-blue-500 h-12"
                  placeholder="מקור הליד"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-right font-medium text-[#e0e0e0]">כתובת</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="text-right bg-[#1a1a2e] border-2 border-gray-300 focus:border-blue-500 h-12"
                placeholder="כתובת הלקוח"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-right font-medium text-[#e0e0e0]">הערות</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
                className="text-right bg-[#1a1a2e] border-2 border-gray-300 focus:border-blue-500"
                placeholder="הערות נוספות"
              />
            </div>

            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#c42b2b] hover:bg-[#991b1b] text-white px-12 py-3 text-lg font-semibold"
              >
                {isSubmitting ? "שומר..." : "צור ליד חדש"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
