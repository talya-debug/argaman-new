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
  "חדש": "bg-blue-100 text-blue-800 border-blue-200",
  "איסוף מידע מלקוח": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "סיווג / הכנת הצעה": "bg-purple-100 text-purple-800 border-purple-200",
  "תיאום סיור": "bg-orange-100 text-orange-800 border-orange-200",
  "סיור בוצע": "bg-teal-100 text-teal-800 border-teal-200",
  "הכנת הצעה": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "הצעה מוכנה ממתינה לאישור": "bg-pink-100 text-pink-800 border-pink-200",
  "הצעה נשלחה": "bg-green-100 text-green-800 border-green-200",
  "המתנה לאישור / משא ומתן": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "אושר": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "נדחה": "bg-red-100 text-red-800 border-red-200"
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
    <Card className="bg-[#1a1d27] border border-[#2d3348] mb-3 overflow-hidden">
      <div className="p-4 space-y-3">
        {/* שורה עליונה: שם + סטטוס */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-3 flex-1">
            {lead.image_url ? (
              <img src={lead.image_url} alt={lead.name} className="w-10 h-10 rounded-md object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-md bg-[#252836] flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-slate-500" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-100 text-base">{lead.name}</h3>
              {lead.estimated_value && (
                <span className="text-xs text-slate-400">₪{lead.estimated_value?.toLocaleString('he-IL')}</span>
              )}
            </div>
          </div>
          <Badge className={`text-xs whitespace-nowrap ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}>
            {lead.status}
          </Badge>
        </div>

        {/* פרטי קשר */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <a href={`tel:${lead.phone}`} className="text-blue-400 hover:underline">{lead.phone}</a>
          </div>
          {lead.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <a href={`mailto:${lead.email}`} className="text-blue-400 hover:underline text-xs">{lead.email}</a>
            </div>
          )}
        </div>

        {/* אחראי + תאריך */}
        <div className="flex justify-between items-center text-sm">
          <div className="text-slate-400">
            <span>אחראי: </span>
            <span className="text-slate-200">{lead.responsible || 'לא הוגדר'}</span>
          </div>
          {lead.followup_date && (
            <div className="flex items-center gap-1 text-slate-400">
              <CalendarIcon className="w-3 h-3" />
              <span className="text-xs">{format(new Date(lead.followup_date), 'dd/MM/yy', { locale: he })}</span>
            </div>
          )}
        </div>

        {/* כפתורי פעולה */}
        <div className="flex gap-2 pt-2 border-t border-[#2d3348]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuoteAction(lead)}
            className={`flex-1 text-xs h-9 border-[#2d3348] ${leadQuotes[lead.id]?.length > 0 ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-400 hover:bg-[#252836]'}`}
          >
            <FileText className="w-3.5 h-3.5 ml-1" />
            {leadQuotes[lead.id]?.length > 0 ? 'הצעת מחיר' : 'צור הצעה'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(lead)}
            className="flex-1 text-xs h-9 border-[#2d3348] text-purple-400 hover:bg-purple-500/10"
          >
            <Edit className="w-3.5 h-3.5 ml-1" />
            ערוך
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-[#2d3348] text-red-400 hover:bg-red-500/10 px-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-[#1a1d27] border-[#2d3348]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-right text-slate-100">מחיקת ליד</AlertDialogTitle>
                <AlertDialogDescription className="text-right text-slate-400">
                  האם אתה בטוח שברצונך למחוק את הליד "{lead.name}"?
                  פעולה זו אינה ניתנת לביטוק.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex gap-2">
                <AlertDialogCancel className="border-[#2d3348] text-slate-300">ביטול</AlertDialogCancel>
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
    </Card>
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
      <Card className="shadow-lg border-0 bg-[#1a1d27]">
        <div className="p-6">
          <div className="space-y-4">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 flex-1 bg-[#2d3348]" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // תצוגת מובייל - כרטיסים
  if (isMobile) {
    return (
      <div className="space-y-0">
        {leads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">לא נמצאו לידים</p>
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
      <Card className="shadow-lg border-0 overflow-hidden bg-[#1a1d27]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#0f1117] border-b border-[#2d3348]">
                <TableHead className="text-right font-semibold w-60 text-slate-300">שם ליד</TableHead>
                <TableHead className="text-right font-semibold text-slate-300">פרטי יצירת קשר</TableHead>
                <TableHead className="text-right font-semibold text-slate-300">קישור לתיקיית לקוח</TableHead>
                <TableHead className="text-right font-semibold text-slate-300">סטטוס</TableHead>
                <TableHead className="text-right font-semibold text-slate-300">אחראי</TableHead>
                <TableHead className="text-right font-semibold text-slate-300">תאריך פולואפ</TableHead>
                <TableHead className="text-right font-semibold text-slate-300">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="hover:bg-[#252836] transition-colors border-b border-[#2d3348]"
                >
                  <TableCell>
                    <div className="flex items-start gap-3">
                        {lead.image_url ? (
                            <img src={lead.image_url} alt={lead.name} className="w-10 h-10 rounded-md object-cover"/>
                        ) : (
                            <div className="w-10 h-10 rounded-md bg-[#252836] flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-slate-500" />
                            </div>
                        )}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            {isEditing(lead.id, 'name') ? (
                              <div className="flex items-center gap-1 flex-1">
                                <Input
                                  value={getCellValue(lead.id, 'name')}
                                  onChange={(e) => handleCellValueChange(lead.id, 'name', e.target.value)}
                                  className="text-right text-sm flex-1 h-8 bg-[#252836] border-[#2d3348] text-slate-100"
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
                                className="font-medium text-slate-100 cursor-pointer hover:text-blue-400 flex-1"
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
                                  className="text-right text-xs flex-1 h-7 bg-[#252836] border-[#2d3348] text-slate-100"
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
                                className="text-xs text-slate-400 cursor-pointer hover:text-blue-400"
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
                              className="text-right text-xs flex-1 bg-[#252836] border-[#2d3348] text-slate-100"
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
                              className="text-sm cursor-pointer hover:text-blue-400 text-slate-200"
                              onClick={() => startEdit(lead.id, 'phone', lead.phone)}
                            >
                              {lead.phone}
                            </span>
                            <Phone className="w-3 h-3 text-slate-500" />
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
                                className="text-right text-xs flex-1 bg-[#252836] border-[#2d3348] text-slate-100"
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
                                className="text-xs text-slate-400 cursor-pointer hover:text-blue-400"
                                onClick={() => startEdit(lead.id, 'email', lead.email)}
                              >
                                {lead.email}
                              </span>
                              <Mail className="w-3 h-3 text-slate-500" />
                            </>
                          )}
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(lead.id, 'email', '')}
                          className="h-6 text-xs text-slate-500 hover:text-blue-400 p-0"
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
                          className="text-right text-xs h-8 bg-[#252836] border-[#2d3348] text-slate-100"
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
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
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
                            className="h-6 text-xs text-slate-500 hover:text-blue-400 p-0"
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
                        <SelectTrigger className={`text-right text-xs h-8 border-0 shadow-none focus:ring-0 ${statusColors[lead.status] || 'bg-gray-100 text-gray-800'}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((status) => (
                            <SelectItem key={status} value={status} className="text-right">
                              <Badge className={`text-xs w-full justify-start ${statusColors[status] || 'bg-gray-100 text-gray-800'} border`}>
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
                      <SelectTrigger className="text-right text-xs h-8 bg-[#252836] border-[#2d3348] text-slate-200">
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
                          className="text-right text-xs h-8 bg-[#252836] border-[#2d3348] text-slate-100"
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
                          className="text-sm text-slate-300 cursor-pointer hover:text-blue-400"
                          onClick={() => startEdit(lead.id, 'followup_date', lead.followup_date || '')}
                        >
                          {lead.followup_date ? format(new Date(lead.followup_date), 'dd/MM/yyyy', { locale: he }) : 'הוסף תאריך'}
                        </span>
                        <CalendarIcon className="w-3 h-3 text-slate-500" />
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
                            className={`h-8 w-8 p-0 ${leadQuotes[lead.id] && leadQuotes[lead.id].length > 0 ? 'text-blue-400 hover:bg-blue-500/10' : 'text-slate-500 hover:bg-[#252836]'}`}
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
                            className="hover:bg-red-500/10 hover:text-red-400 text-red-400 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#1a1d27] border-[#2d3348]">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-right text-slate-100">מחיקת ליד</AlertDialogTitle>
                            <AlertDialogDescription className="text-right text-slate-400">
                              האם אתה בטוח שברצונך למחוק את הליד "{lead.name}"?
                              פעולה זו אינה ניתנת לביטוק.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex gap-2">
                            <AlertDialogCancel className="border-[#2d3348] text-slate-300">ביטול</AlertDialogCancel>
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
              <p className="text-slate-400">לא נמצאו לידים</p>
            </div>
          )}
        </div>
      </Card>
    </TooltipProvider>
  );
}
