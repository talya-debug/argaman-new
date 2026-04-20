import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, X } from "lucide-react";

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

const RESPONSIBLES = ["יניר", "חיה", "רבקה", "דבורה", "יהודה", "שי"];

export default function LeadForm({ lead, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(lead ? { ...lead, image_file: null } : {
    name: '',
    phone: '',
    email: '',
    address: '',
    status: 'חדש',
    followup_date: '',
    responsible: '',
    notes: '',
    source: '',
    estimated_value: '',
    image_url: null,
    image_file: null,
    drive_folder_url: '',
  });
  const [imagePreview, setImagePreview] = useState(lead?.image_url || null);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };

    // Fix estimated_value handling
    if (submitData.estimated_value === '' || submitData.estimated_value === null || submitData.estimated_value === undefined) {
      delete submitData.estimated_value; // Remove the field entirely if empty
    } else {
      submitData.estimated_value = parseFloat(submitData.estimated_value);
    }

    onSubmit(submitData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setFormData(prev => ({ ...prev, image_file: file, image_url: null })); // Store file object
        setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_file: null, image_url: null }));
    setImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-[#1a1a2e] p-6 rounded-lg" dir="rtl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-right font-medium">שם *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              className="text-right bg-[#1a1a2e] border-gray-300"
              placeholder="שם הלקוח"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-right font-medium">טלפון *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              required
              className="text-right bg-[#1a1a2e] border-gray-300"
              placeholder="מספר טלפון"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-right font-medium">מייל</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="text-right bg-[#1a1a2e] border-gray-300"
              placeholder="כתובת מייל"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_value" className="text-right font-medium">ערך משוער (₪)</Label>
            <Input
              id="estimated_value"
              type="number"
              value={formData.estimated_value}
              onChange={(e) => handleChange('estimated_value', e.target.value)}
              className="text-right bg-[#1a1a2e] border-gray-300"
              placeholder="ערך משוער"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-right font-medium">סטטוס</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger className="text-right bg-[#1a1a2e] border-gray-300">
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
            <Label htmlFor="responsible" className="text-right font-medium">אחראי</Label>
            <Select value={formData.responsible} onValueChange={(value) => handleChange('responsible', value)}>
              <SelectTrigger className="text-right bg-[#1a1a2e] border-gray-300">
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
            <Label htmlFor="followup_date" className="text-right font-medium">תאריך פולואפ</Label>
            <Input
              id="followup_date"
              type="date"
              value={formData.followup_date}
              onChange={(e) => handleChange('followup_date', e.target.value)}
              className="text-right bg-[#1a1a2e] border-gray-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source" className="text-right font-medium">מקור</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => handleChange('source', e.target.value)}
              className="text-right bg-[#1a1a2e] border-gray-300"
              placeholder="מקור הליד"
            />
          </div>
        </div>

        <div className="space-y-2">
            <Label htmlFor="image" className="text-right font-medium">הוסף תמונה</Label>
            <div className="flex items-center gap-4">
                {imagePreview ? (
                    <div className="relative">
                        <img src={imagePreview} alt="preview" className="w-20 h-20 rounded-lg object-cover"/>
                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeImage}>
                            <X className="h-4 w-4"/>
                        </Button>
                    </div>
                ) : (
                    <Button type="button" variant="outline" className="h-20 w-20 border-dashed" onClick={() => fileInputRef.current?.click()}>
                        <UploadCloud className="h-6 w-6 text-[#6b6b80]"/>
                    </Button>
                )}
                <Input
                    id="image-upload"
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*"
                />
                 <div className="text-sm text-[#a0a0b8]">
                    <p>ניתן להוסיף תמונה של המקום,</p>
                    <p>תוכניות או כל קובץ רלוונטי אחר.</p>
                </div>
            </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-right font-medium">כתובת</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="text-right bg-[#1a1a2e] border-gray-300"
            placeholder="כתובת הלקוח"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="drive_folder_url" className="text-right font-medium">קישור לתיקיית לקוח</Label>
          <Input
            id="drive_folder_url"
            type="url"
            value={formData.drive_folder_url}
            onChange={(e) => handleChange('drive_folder_url', e.target.value)}
            className="text-right bg-[#1a1a2e] border-gray-300"
            placeholder="https://drive.google.com/..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-right font-medium">הערות</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="text-right bg-[#1a1a2e] border-gray-300"
            placeholder="הערות נוספות"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onCancel}>
            ביטול
          </Button>
          <Button type="submit" className="bg-[#c42b2b] hover:bg-[#991b1b] text-white">
            {lead ? 'עדכן' : 'צור'} ליד
          </Button>
        </div>
      </form>
    </div>
  );
}