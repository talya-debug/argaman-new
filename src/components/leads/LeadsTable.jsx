import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Quote } from '@/entities';
import {
  Edit,
  Phone,
  Mail,
  FileText,
  Calendar as CalendarIcon,
  Trash2,
  Image as ImageIcon,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from 'sonner';
import { useIsMobile } from "@/hooks/use-mobile";

const statusColors = {
  "חדש": "bg-[rgba(96,165,250,0.1)]0/15 text-blue-400 border-blue-500/20",
  "איסוף מידע מלקוח": "bg-[rgba(251,191,36,0.1)]0/15 text-yellow-400 border-yellow-500/20",
  "סיווג / הכנת הצעה": "bg-purple-500/15 text-purple-400 border-purple-500/20",
  "תיאום סיור": "bg-orange-500/15 text-orange-400 border-orange-500/20",
  "סיור בוצע": "bg-teal-500/15 text-teal-400 border-teal-500/20",
  "הכנת הצעה": "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  "הצעה מוכנה ממתינה לאישור": "bg-pink-500/15 text-pink-400 border-pink-500/20",
  "הצעה נשלחה": "bg-[rgba(74,222,128,0.1)]0/15 text-green-400 border-green-500/20",
  "המתנה לאישור / משא ומתן": "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  "אושר": "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  "נדחה": "bg-[rgba(248,113,113,0.1)]0/15 text-red-400 border-red-500/20"
};

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

// כרטיס ליד למובייל
function LeadMobileCard({ lead, onEdit, onUpdate, onDelete, onQuoteAction, leadQuotes, saveEdit }) {
  return (
    <div className="mb-3 overflow-hidden rounded-xl" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
      <div className="p-4 space-y-3">
        {/* שורה עליונה: שם + סטטוס */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3 flex-1">
            {lead.image_url ? (
              <img src={lead.image_url} alt={lead.name} className="w-10 h-10 rounded-md object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: 'var(--dark)' }}>
                <ImageIcon className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </div>
            )}
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{lead.name}</h3>
              {lead.estimated_value && (
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>₪{lead.estimated_value?.toLocaleString('he-IL')}</span>
              )}
            </div>
          </div>
          <Badge className={`text-xs whitespace-nowrap ${statusColors[lead.status] || 'bg-[#141428]0/15 text-gray-400'}`}>
            {lead.status}
          </Badge>
        </div>

        {/* פרטי קשר */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <a href={`tel:${lead.phone}`} style={{ color: 'var(--info)' }} className="hover:underline">{lead.phone}</a>
          </div>
          {lead.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <a href={`mailto:${lead.email}`} style={{ color: 'var(--info)' }} className="hover:underline text-xs">{lead.email}</a>
            </div>
          )}
        </div>

        {/* אחראי + תאריך */}
        <div className="flex justify-between items-center text-sm">
          <div style={{ color: 'var(--text-secondary)' }}>
            <span>אחראי: </span>
            <span style={{ color: 'var(--text-primary)' }}>{lead.responsible || 'לא הוגדר'}</span>
          </div>
          {lead.followup_date && (
            <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <CalendarIcon className="w-3 h-3" />
              <span className="text-xs">{format(new Date(lead.followup_date), 'dd/MM/yy', { locale: he })}</span>
            </div>
          )}
        </div>

        {/* כפתורי פעולה */}
        <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--dark-border)' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuoteAction(lead)}
            className={`flex-1 text-xs h-9 ${leadQuotes[lead.id]?.length > 0 ? 'text-blue-400 hover:bg-[rgba(96,165,250,0.1)]0/10' : ''}`}
            style={{ borderColor: 'var(--dark-border)', color: leadQuotes[lead.id]?.length > 0 ? undefined : 'var(--text-secondary)' }}
          >
            <FileText className="w-3.5 h-3.5 ml-1" />
            {leadQuotes[lead.id]?.length > 0 ? 'הצעת מחיר' : 'צור הצעה'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(lead)}
            className="flex-1 text-xs h-9 text-purple-400 hover:bg-purple-500/10"
            style={{ borderColor: 'var(--dark-border)' }}
          >
            <Edit className="w-3.5 h-3.5 ml-1" />
            ערוך
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-red-400 hover:bg-[rgba(248,113,113,0.1)]0/10 px-2"
                style={{ borderColor: 'var(--dark-border)' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent style={{ background: 'var(--dark-card)', borderColor: 'var(--dark-border)' }}>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-right" style={{ color: 'var(--text-primary)' }}>מחיקת ליד</AlertDialogTitle>
                <AlertDialogDescription className="text-right" style={{ color: 'var(--text-secondary)' }}>
                  האם אתה בטוח שברצונך למחוק את הליד "{lead.name}"?
                  פעולה זו אינה ניתנת לביטוק.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex gap-2">
                <AlertDialogCancel style={{ borderColor: 'var(--dark-border)', color: 'var(--text-secondary)' }}>ביטול</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(lead.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  מחק
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export default function LeadsTable({
  leads,
  onEdit,
  onUpdate,
  onDelete,
  isLoading,
  onQuoteAction
}) {
  const [editingCells, setEditingCells] = useState({});
  const [editValues, setEditValues] = useState({});
  const [savingCells, setSavingCells] = useState({});
  const [leadQuotes, setLeadQuotes] = useState({});
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchLeadQuotes = async () => {
      if (leads.length > 0) {
        const leadIds = leads.map(l => l.id);
        const allQuotes = await Quote.filter({ lead_id: { $in: leadIds } });

        const quotesMap = allQuotes.reduce((acc, quote) => {
          if (!acc[quote.lead_id]) {
            acc[quote.lead_id] = [];
          }
          acc[quote.lead_id].push(quote);
          return acc;
        }, {});
        setLeadQuotes(quotesMap);
      }
    };
    fetchLeadQuotes();
  }, [leads]);

  const startEdit = (leadId, field, currentValue) => {
    const cellKey = `${leadId}-${field}`;
    setEditingCells({ ...editingCells, [cellKey]: true });
    setEditValues({ ...editValues, [cellKey]: currentValue });
  };

  const cancelEdit = (leadId, field) => {
    const cellKey = `${leadId}-${field}`;
    const newEditingCells = { ...editingCells };
    const newEditValues = { ...editValues };
    delete newEditingCells[cellKey];
    delete newEditValues[cellKey];
    setEditingCells(newEditingCells);
    setEditValues(newEditValues);
  };

  const saveEdit = async (leadId, field, value) => {
    const cellKey = `${leadId}-${field}`;

    setSavingCells({ ...savingCells, [cellKey]: true });

    try {
      const updateData = { [field]: value };

      if (field === 'status' || field === 'responsible' || field === 'followup_date') {
        updateData.last_interaction_date = new Date().toISOString().split('T')[0];
      }

      await onUpdate(leadId, updateData);

      const newEditingCells = { ...editingCells };
      const newEditValues = { ...editValues };
      delete newEditingCells[cellKey];
      delete newEditValues[cellKey];
      setEditingCells(newEditingCells);
      setEditValues(newEditValues);

    } catch (error) {
      console.error('Error updating field:', error);
      toast.error("שגיאה בעדכון הנתונים");
    }

    setSavingCells({ ...savingCells, [cellKey]: false });
  };

  const handleCellValueChange = (leadId, field, value) => {
    const cellKey = `${leadId}-${field}`;
    setEditValues({ ...editValues, [cellKey]: value });
  };

  const isEditing = (leadId, field) => {
    return editingCells[`${leadId}-${field}`];
  };

  const getCellValue = (leadId, field) => {
    const cellKey = `${leadId}-${field}`;
    return editValues[cellKey];
  };

  const isSaving = (leadId, field) => {
    return savingCells[`${leadId}-${field}`];
  };

  if (isLoading) {
    return (
      <div className="rounded-xl p-6" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
        <div className="space-y-4">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 flex-1" style={{ background: 'var(--dark-border)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // תצוגת מובייל - כרטיסים
  if (isMobile) {
    return (
      <div className="space-y-0">
        {leads.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-secondary)' }}>לא נמצאו לידים</p>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadMobileCard
              key={lead.id}
              lead={lead}
              onEdit={onEdit}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onQuoteAction={onQuoteAction}
              leadQuotes={leadQuotes}
              saveEdit={saveEdit}
            />
          ))
        )}
      </div>
    );
  }

  // תצוגת דסקטופ - טבלה
  return (
    <TooltipProvider>
      <div className="overflow-hidden rounded-xl" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow style={{ background: 'rgba(212, 168, 67, 0.05)', borderBottom: '1px solid var(--dark-border)' }}>
                <TableHead className="text-right font-semibold w-60" style={{ color: 'var(--argaman)' }}>שם ליד</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>פרטי יצירת קשר</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>קישור לתיקיית לקוח</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>סטטוס</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>אחראי</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>תאריך פולואפ</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid var(--dark-border)' }}
                  onMouseEnter={(e) => { for (const td of e.currentTarget.querySelectorAll('td')) td.style.background = 'var(--argaman-bg)'; }}
                  onMouseLeave={(e) => { for (const td of e.currentTarget.querySelectorAll('td')) td.style.background = ''; }}
                >
                  <TableCell>
                    <div className="flex items-start gap-3">
                        {lead.image_url ? (
                            <img src={lead.image_url} alt={lead.name} className="w-10 h-10 rounded-md object-cover"/>
                        ) : (
                            <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: 'var(--dark)' }}>
                                <ImageIcon className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                            </div>
                        )}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {isEditing(lead.id, 'name') ? (
                              <div className="flex items-center gap-1 flex-1">
                                <Input
                                  value={getCellValue(lead.id, 'name')}
                                  onChange={(e) => handleCellValueChange(lead.id, 'name', e.target.value)}
                                  className="text-right text-sm flex-1 h-8"
                                  style={{ background: 'var(--dark)', borderColor: 'var(--dark-border)', color: 'var(--text-primary)' }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit(lead.id, 'name', getCellValue(lead.id, 'name'));
                                    if (e.key === 'Escape') cancelEdit(lead.id, 'name');
                                  }}
                                  onBlur={() => saveEdit(lead.id, 'name', getCellValue(lead.id, 'name'))}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <span
                                className="font-medium cursor-pointer flex-1 transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                                onMouseEnter={(e) => e.target.style.color = 'var(--argaman-light)'}
                                onMouseLeave={(e) => e.target.style.color = 'var(--text-primary)'}
                                onClick={() => startEdit(lead.id, 'name', lead.name)}
                              >
                                {lead.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isEditing(lead.id, 'estimated_value') ? (
                              <div className="flex items-center gap-1 flex-1">
                                <Input
                                  type="number"
                                  value={getCellValue(lead.id, 'estimated_value')}
                                  onChange={(e) => handleCellValueChange(lead.id, 'estimated_value', e.target.value)}
                                  className="text-right text-xs flex-1 h-7"
                                  style={{ background: 'var(--dark)', borderColor: 'var(--dark-border)', color: 'var(--text-primary)' }}
                                  placeholder="ערך משוער"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit(lead.id, 'estimated_value', getCellValue(lead.id, 'estimated_value'));
                                    if (e.key === 'Escape') cancelEdit(lead.id, 'estimated_value');
                                  }}
                                  onBlur={() => saveEdit(lead.id, 'estimated_value', getCellValue(lead.id, 'estimated_value'))}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <span
                                className="text-xs cursor-pointer transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={(e) => e.target.style.color = 'var(--argaman-light)'}
                                onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                                onClick={() => startEdit(lead.id, 'estimated_value', lead.estimated_value || '')}
                              >
                                {lead.estimated_value ? `ערך: ₪${lead.estimated_value?.toLocaleString('he-IL')}` : '+ הוסף ערך'}
                              </span>
                            )}
                          </div>
                        </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        {isEditing(lead.id, 'phone') ? (
                          <div className="flex items-center gap-1 flex-1">
                            <Input
                              value={getCellValue(lead.id, 'phone')}
                              onChange={(e) => handleCellValueChange(lead.id, 'phone', e.target.value)}
                              className="text-right text-xs flex-1"
                              style={{ background: 'var(--dark)', borderColor: 'var(--dark-border)', color: 'var(--text-primary)' }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit(lead.id, 'phone', getCellValue(lead.id, 'phone'));
                                if (e.key === 'Escape') cancelEdit(lead.id, 'phone');
                              }}
                              onBlur={() => saveEdit(lead.id, 'phone', getCellValue(lead.id, 'phone'))}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <>
                            <span
                              className="text-sm cursor-pointer transition-colors"
                              style={{ color: 'var(--text-primary)' }}
                              onMouseEnter={(e) => e.target.style.color = 'var(--argaman-light)'}
                              onMouseLeave={(e) => e.target.style.color = 'var(--text-primary)'}
                              onClick={() => startEdit(lead.id, 'phone', lead.phone)}
                            >
                              {lead.phone}
                            </span>
                            <Phone className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                          </>
                        )}
                      </div>

                      {(lead.email || isEditing(lead.id, 'email')) ? (
                        <div className="flex items-center gap-1">
                          {isEditing(lead.id, 'email') ? (
                            <div className="flex items-center gap-1 flex-1">
                              <Input
                                type="email"
                                value={getCellValue(lead.id, 'email')}
                                onChange={(e) => handleCellValueChange(lead.id, 'email', e.target.value)}
                                className="text-right text-xs flex-1"
                                style={{ background: 'var(--dark)', borderColor: 'var(--dark-border)', color: 'var(--text-primary)' }}
                                placeholder="מייל"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit(lead.id, 'email', getCellValue(lead.id, 'email'));
                                  if (e.key === 'Escape') cancelEdit(lead.id, 'email');
                                }}
                                onBlur={() => saveEdit(lead.id, 'email', getCellValue(lead.id, 'email'))}
                                autoFocus
                              />
                            </div>
                          ) : (
                            <>
                              <span
                                className="text-xs cursor-pointer transition-colors"
                                style={{ color: 'var(--text-secondary)' }}
                                onMouseEnter={(e) => e.target.style.color = 'var(--argaman-light)'}
                                onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                                onClick={() => startEdit(lead.id, 'email', lead.email)}
                              >
                                {lead.email}
                              </span>
                              <Mail className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                            </>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(lead.id, 'email', '')}
                          className="h-6 text-xs p-0"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          + הוסף מייל
                        </Button>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    {isEditing(lead.id, 'drive_folder_url') ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="url"
                          value={getCellValue(lead.id, 'drive_folder_url')}
                          onChange={(e) => handleCellValueChange(lead.id, 'drive_folder_url', e.target.value)}
                          className="text-right text-xs h-8"
                          style={{ background: 'var(--dark)', borderColor: 'var(--dark-border)', color: 'var(--text-primary)' }}
                          placeholder="https://drive.google.com/..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(lead.id, 'drive_folder_url', getCellValue(lead.id, 'drive_folder_url'));
                            if (e.key === 'Escape') cancelEdit(lead.id, 'drive_folder_url');
                          }}
                          onBlur={() => saveEdit(lead.id, 'drive_folder_url', getCellValue(lead.id, 'drive_folder_url'))}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <>
                        {lead.drive_folder_url ? (
                          <a
                            href={lead.drive_folder_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm transition-colors"
                            style={{ color: 'var(--info)' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>פתח תיקיה</span>
                          </a>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(lead.id, 'drive_folder_url', '')}
                            className="h-6 text-xs p-0"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            + הוסף קישור
                          </Button>
                        )}
                      </>
                    )}
                  </TableCell>

                  <TableCell>
                     <Select
                        value={lead.status}
                        onValueChange={(value) => saveEdit(lead.id, 'status', value)}
                      >
                        <SelectTrigger className={`text-right text-xs h-8 border-0 shadow-none focus:ring-0 ${statusColors[lead.status] || 'bg-[#141428]0/15 text-gray-400'}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((status) => (
                            <SelectItem key={status} value={status} className="text-right">
                              <Badge className={`text-xs w-full justify-start ${statusColors[status] || 'bg-[#141428]0/15 text-gray-400'} border`}>
                                {status}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </TableCell>

                  <TableCell className="text-right">
                    <Select
                      value={lead.responsible || ''}
                      onValueChange={(value) => saveEdit(lead.id, 'responsible', value)}
                    >
                      <SelectTrigger className="text-right text-xs h-8" style={{ background: 'var(--dark)', borderColor: 'var(--dark-border)', color: 'var(--text-primary)' }}>
                        <SelectValue placeholder="בחר אחראי" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESPONSIBLES.map((responsible) => (
                          <SelectItem key={responsible} value={responsible}>
                            {responsible}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell className="text-right">
                    {isEditing(lead.id, 'followup_date') ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="date"
                          value={getCellValue(lead.id, 'followup_date')}
                          onChange={(e) => handleCellValueChange(lead.id, 'followup_date', e.target.value)}
                          className="text-right text-xs h-8"
                          style={{ background: 'var(--dark)', borderColor: 'var(--dark-border)', color: 'var(--text-primary)' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(lead.id, 'followup_date', getCellValue(lead.id, 'followup_date'));
                            if (e.key === 'Escape') cancelEdit(lead.id, 'followup_date');
                          }}
                          onBlur={() => saveEdit(lead.id, 'followup_date', getCellValue(lead.id, 'followup_date'))}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <span
                          className="text-sm cursor-pointer transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={(e) => e.target.style.color = 'var(--argaman-light)'}
                          onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                          onClick={() => startEdit(lead.id, 'followup_date', lead.followup_date || '')}
                        >
                          {lead.followup_date ? format(new Date(lead.followup_date), 'dd/MM/yyyy', { locale: he }) : 'הוסף תאריך'}
                        </span>
                        <CalendarIcon className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onQuoteAction(lead)}
                            className={`h-8 w-8 p-0 ${leadQuotes[lead.id] && leadQuotes[lead.id].length > 0 ? 'text-blue-400 hover:bg-[rgba(96,165,250,0.1)]0/10' : 'hover:bg-[#252836]'}`}
                            style={{ color: leadQuotes[lead.id] && leadQuotes[lead.id].length > 0 ? undefined : 'var(--text-muted)' }}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{leadQuotes[lead.id] && leadQuotes[lead.id].length > 0 ? 'הצג/ערוך הצעת מחיר' : 'צור הצעת מחיר'}</p>
                           {leadQuotes[lead.id] && leadQuotes[lead.id].length > 0 && <p className="text-xs text-blue-500">קיימת הצעה</p>}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(lead)}
                            className="hover:bg-purple-500/10 hover:text-purple-400 text-purple-400 h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>עריכה מלאה</p>
                        </TooltipContent>
                      </Tooltip>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-[rgba(248,113,113,0.1)]0/10 hover:text-red-400 text-red-400 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent style={{ background: 'var(--dark-card)', borderColor: 'var(--dark-border)' }}>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-right" style={{ color: 'var(--text-primary)' }}>מחיקת ליד</AlertDialogTitle>
                            <AlertDialogDescription className="text-right" style={{ color: 'var(--text-secondary)' }}>
                              האם אתה בטוח שברצונך למחוק את הליד "{lead.name}"?
                              פעולה זו אינה ניתנת לביטוק.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex gap-2">
                            <AlertDialogCancel style={{ borderColor: 'var(--dark-border)', color: 'var(--text-secondary)' }}>ביטול</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(lead.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              מחק
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {leads.length === 0 && (
            <div className="text-center py-12">
              <p style={{ color: 'var(--text-secondary)' }}>לא נמצאו לידים</p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
