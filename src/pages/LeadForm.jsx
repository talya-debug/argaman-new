
import React, { useState } from 'react';
import { Lead } from '@/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

const STATUSES = [
  "חדש", "איסוף מידע מלקוח", "סיווג / הכנת הצעה", "תיאום סיור",
  "סיור בוצע", "הכנת הצעה", "הצעה מוכנה ממתינה לאישור", "הצעה נשלחה",
  "המתנה לאישור / משא ומתן", "אושר", "נדחה"
];

const RESPONSIBLES = ["חיה", "יניר", "דבורה"];

export default function LeadForm() {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', status: 'חדש',
    followup_date: '', responsible: '', notes: '', source: '', estimated_value: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("נא למלא שם וטלפון.");
      return;
    }
    const phoneRegex = /^[0-9\-+\s()]+$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      toast.error('מספר טלפון לא תקין — מותר רק ספרות, מקפים, +, רווחים וסוגריים');
      return;
    }
    if (formData.email && !formData.email.includes('@')) {
      toast.error('כתובת מייל לא תקינה — חסר @');
      return;
    }
    setIsSubmitting(true);
    try {
      const submitData = { ...formData };
      if (submitData.estimated_value === '' || submitData.estimated_value === null || submitData.estimated_value === undefined) {
        delete submitData.estimated_value;
      } else {
        submitData.estimated_value = parseFloat(submitData.estimated_value);
      }
      await Lead.create({ ...submitData, last_interaction_date: new Date().toISOString().split('T')[0] });
      toast.success('הליד נוצר בהצלחה!');
      setFormData({ name: '', phone: '', email: '', address: '', status: 'חדש', followup_date: '', responsible: '', notes: '', source: '', estimated_value: '' });
    } catch (error) {
      console.error("Failed to create lead:", error);
      toast.error("שגיאה ביצירת הליד.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const labelStyle = { color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 };

  const fields = [
    { id: 'name', label: 'שם *', required: true, placeholder: 'שם הלקוח', maxLength: 100 },
    { id: 'phone', label: 'טלפון *', required: true, placeholder: 'מספר טלפון', maxLength: 20 },
    { id: 'email', label: 'מייל', type: 'email', placeholder: 'כתובת מייל', maxLength: 100 },
    { id: 'estimated_value', label: 'ערך משוער (₪)', type: 'number', placeholder: 'ערך משוער' },
    { id: 'followup_date', label: 'תאריך פולואפ', type: 'date' },
    { id: 'source', label: 'מקור', placeholder: 'מקור הליד' },
  ];

  return (
    <div style={{ padding: '24px 16px', minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 800, width: '100%', background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }} dir="rtl">

        <div style={{ background: 'var(--argaman)', padding: '24px 32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>הוספת ליד חדש</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }}>מלא את פרטי הליד החדש במערכת</p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {fields.map(f => (
              <div key={f.id}>
                <label style={labelStyle}>{f.label}</label>
                <Input
                  id={f.id} type={f.type || 'text'} value={formData[f.id]}
                  onChange={(e) => handleChange(f.id, e.target.value)}
                  required={f.required} placeholder={f.placeholder} maxLength={f.maxLength} style={{ height: 44 }}
                />
              </div>
            ))}
            <div>
              <label style={labelStyle}>סטטוס</label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger style={{ height: 44 }}><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label style={labelStyle}>אחראי</label>
              <Select value={formData.responsible} onValueChange={(v) => handleChange('responsible', v)}>
                <SelectTrigger style={{ height: 44 }}><SelectValue placeholder="בחר אחראי" /></SelectTrigger>
                <SelectContent>{RESPONSIBLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>כתובת</label>
            <Input value={formData.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="כתובת הלקוח" style={{ height: 44 }} />
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>הערות</label>
            <Textarea value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={4} maxLength={500} placeholder="הערות נוספות" />
          </div>

          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <Button type="submit" disabled={isSubmitting} style={{ height: 48, paddingInline: 48, fontSize: 16, background: 'var(--argaman)', color: '#fff' }}>
              {isSubmitting ? "שומר..." : "צור ליד חדש"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
