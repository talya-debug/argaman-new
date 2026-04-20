import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { User } from '@/entities';

export default function TaskForm({ task, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    client_name: '',
    description: '',
    assigned_to: '',
    creator: '',
    status: 'חדש',
    priority: 'בינונית',
    due_date: '',
    source_type: 'manual'
  });

  useEffect(() => {
    const initForm = async () => {
        const currentUser = await User.me();
        const creatorName = currentUser?.full_name || 'לא ידוע';

        if (task) {
          setFormData({
            title: task.title || '',
            client_name: task.client_name || '',
            description: task.description || '',
            assigned_to: task.assigned_to || '',
            creator: task.creator || creatorName,
            status: task.status || 'חדש',
            priority: task.priority || 'בינונית',
            due_date: task.due_date ? new Date(task.due_date) : '',
            source_type: task.source_type || 'manual'
          });
        } else {
            setFormData(prev => ({ ...prev, creator: creatorName }));
        }
    };
    initForm();
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, due_date: date }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null
    };
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 pt-2 md:pt-4 px-2 md:px-0" dir="rtl">
        <div className="grid grid-cols-1 gap-4 md:gap-6">
            <div className="space-y-2">
                <Label htmlFor="title" className="text-sm md:text-base">פירוט המשימה</Label>
                <Input 
                  id="title" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  required 
                  className="text-sm md:text-base h-10 md:h-auto"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="client_name" className="text-sm md:text-base">שם הלקוח</Label>
                <Input 
                  id="client_name" 
                  name="client_name" 
                  value={formData.client_name} 
                  onChange={handleChange} 
                  className="text-sm md:text-base h-10 md:h-auto"
                />
            </div>
        </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm md:text-base">תיאור נוסף</Label>
        <Textarea 
          id="description" 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          rows={3}
          className="text-sm md:text-base resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-2">
            <Label className="text-sm md:text-base">נותן המשימה</Label>
            <Input 
              id="creator" 
              name="creator" 
              value={formData.creator} 
              onChange={handleChange} 
              required 
              className="text-sm md:text-base h-10 md:h-auto"
            />
        </div>
        <div className="space-y-2">
            <Label className="text-sm md:text-base">אחראי</Label>
            <Select 
              name="assigned_to" 
              value={formData.assigned_to} 
              onValueChange={(value) => handleSelectChange('assigned_to', value)} 
              required
            >
                <SelectTrigger className="h-10 md:h-auto text-sm md:text-base">
                  <SelectValue placeholder="בחר אחראי" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="חיה">חיה</SelectItem>
                    <SelectItem value="יניר">יניר</SelectItem>
                    <SelectItem value="דבורה">דבורה</SelectItem>
                    <SelectItem value="יהודה">יהודה</SelectItem>
                    <SelectItem value="רבקה">רבקה</SelectItem>
                    <SelectItem value="שי">שי</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-2">
          <Label htmlFor="due_date" className="text-sm md:text-base">תאריך יעד</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full justify-start text-right font-normal h-10 md:h-auto text-sm md:text-base ${!formData.due_date && "text-muted-foreground"}`}
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {formData.due_date ? format(formData.due_date, 'PPP', { locale: he }) : <span>בחר תאריך</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.due_date}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
            <Label className="text-sm md:text-base">עדיפות</Label>
            <Select 
              name="priority" 
              value={formData.priority} 
              onValueChange={(value) => handleSelectChange('priority', value)}
            >
                <SelectTrigger className="h-10 md:h-auto text-sm md:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="נמוכה">נמוכה</SelectItem>
                    <SelectItem value="בינונית">בינונית</SelectItem>
                    <SelectItem value="גבוהה">גבוהה</SelectItem>
                    <SelectItem value="דחוף">דחוף</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm md:text-base">סטטוס</Label>
        <Select 
          name="status" 
          value={formData.status} 
          onValueChange={(value) => handleSelectChange('status', value)}
        >
            <SelectTrigger className="h-10 md:h-auto text-sm md:text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="חדש">חדש</SelectItem>
                <SelectItem value="בתהליך">בתהליך</SelectItem>
                <SelectItem value="בבדיקה">בבדיקה</SelectItem>
                <SelectItem value="הושלם">הושלם</SelectItem>
                <SelectItem value="בוטל">בוטל</SelectItem>
            </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-4 border-t sticky bottom-0 bg-[#1a1a2e] pb-2 md:pb-0">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="w-full md:w-auto h-10 md:h-auto text-sm md:text-base"
        >
          ביטול
        </Button>
        <Button 
          type="submit" 
          className="bg-[#D4A843] hover:bg-[#B8922E] w-full md:w-auto h-10 md:h-auto text-sm md:text-base"
        >
          {task ? 'שמור שינויים' : 'צור משימה'}
        </Button>
      </div>
    </form>
  );
}