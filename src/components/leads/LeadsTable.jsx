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
  ExternalLink,
  Plus
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
import LeadActivityLog from './LeadActivityLog';

const LEAD_STATUSES = [
  { value: 'דורש טיפול', color: 'bg-red-50 text-red-700 border-red-300' },
  { value: 'טופל', color: 'bg-green-50 text-green-700 border-green-300' },
  { value: 'ארכיון', color: 'bg-gray-100 text-gray-500 border-gray-300' },
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
          <Badge className={`text-xs whitespace-nowrap ${(LEAD_STATUSES.find(s => s.value === (lead.lead_status || 'דורש טיפול'))?.color) || 'bg-gray-50 text-gray-600'}`}>
            {lead.lead_status || 'דורש טיפול'}
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
          <div className="flex flex-col gap-1 flex-1">
            {(leadQuotes[lead.id] || []).map(q => (
              <Button key={q.id} variant="outline" size="sm" className="text-xs h-7 text-blue-700 hover:bg-blue-50 justify-start" style={{ borderColor: 'var(--dark-border)' }}
                onClick={() => window.location.href = `/QuoteDetails?id=${q.id}`}>
                <FileText className="w-3 h-3 ml-1" />{q.quote_number || 'הצעה'} {q.status === 'אושרה' ? '✓' : ''}
              </Button>
            ))}
            <Button variant="outline" size="sm" className="text-xs h-7 text-green-700 hover:bg-green-50 justify-start" style={{ borderColor: 'var(--dark-border)' }}
              onClick={() => onQuoteAction(lead, true)}>
              <Plus className="w-3 h-3 ml-1" />הצעה חדשה
            </Button>
          </div>
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
                className="h-9 text-red-400 hover:bg-red-50 px-2"
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
        <LeadActivityLog leadId={lead.id} />
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
  const [expandedLead, setExpandedLead] = useState(null);
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
                <TableHead className="text-center font-semibold" style={{ color: 'var(--argaman)' }}>טיפול</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>אחראי</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>תאריך פולואפ</TableHead>
                <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <React.Fragment key={lead.id}>
                <TableRow
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: expandedLead === lead.id ? 'none' : '1px solid var(--dark-border)' }}
                  onMouseEnter={(e) => { for (const td of e.currentTarget.querySelectorAll('td')) td.style.background = 'var(--argaman-bg)'; }}
                  onMouseLeave={(e) => { for (const td of e.currentTarget.querySelectorAll('td')) td.style.background = ''; }}
                  onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
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

                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Select value={lead.lead_status || 'דורש טיפול'} onValueChange={(value) => saveEdit(lead.id, 'lead_status', value)}>
                      <SelectTrigger className={`text-right text-xs h-8 w-[120px] mx-auto border ${(LEAD_STATUSES.find(s => s.value === (lead.lead_status || 'דורש טיפול'))?.color) || 'bg-gray-50 text-gray-600'}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STATUSES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.value}</SelectItem>
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
                      <div className="flex flex-col gap-1">
                        {(leadQuotes[lead.id] || []).map(q => (
                          <Button key={q.id} variant="ghost" size="sm" className="h-7 text-xs justify-start text-blue-700 hover:bg-blue-50 px-2"
                            onClick={() => window.location.href = `/QuoteDetails?id=${q.id}`}>
                            <FileText className="w-3 h-3 ml-1" />{q.quote_number || 'הצעה'} {q.status === 'אושרה' ? '✓' : ''}
                          </Button>
                        ))}
                        <Button variant="ghost" size="sm" className="h-7 text-xs justify-start text-green-700 hover:bg-green-50 px-2"
                          onClick={() => onQuoteAction(lead, true)}>
                          <Plus className="w-3 h-3 ml-1" />הצעה חדשה
                        </Button>
                      </div>
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
                            className="hover:bg-red-50 hover:text-red-400 text-red-400 h-8 w-8 p-0"
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
                {expandedLead === lead.id && (
                  <TableRow>
                    <TableCell colSpan={7} style={{ background: 'var(--dark)', padding: '12px 20px', borderBottom: '1px solid var(--dark-border)' }}>
                      <LeadActivityLog leadId={lead.id} />
                    </TableCell>
                  </TableRow>
                )}
                </React.Fragment>
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
