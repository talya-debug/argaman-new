
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ChevronDown, ChevronRight, Edit, Calendar, Link as LinkIcon, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import TaskActivityLog from './TaskActivityLog';
import { Skeleton } from "@/components/ui/skeleton";
import { Task } from '@/entities';
import { PurchaseRecord } from '@/entities';
import { toast } from "sonner";
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const statusColors = {
  "חדש": "bg-blue-500/15 text-blue-400",
  "בתהליך": "bg-yellow-500/15 text-yellow-400",
  "בבדיקה": "bg-purple-500/15 text-purple-400",
  "הושלם": "bg-green-500/15 text-green-400",
  "בוטל": "bg-red-500/15 text-red-400"
};

const priorityColors = {
  "גבוהה": "bg-red-500/20 text-red-400 border-red-500/30",
  "דחוף": "bg-red-500/20 text-red-400 border-red-500/30",
  "בינונית": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "נמוכה": "bg-green-500/20 text-green-400 border-green-500/30"
};

const userOptions = ["חיה", "יניר", "דבורה", "יהודה", "רבקה", "שי"];

// Inline editable cell component
function EditableCell({ value, task, fieldName, options = null, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (editValue === value) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            const updates = { [fieldName]: editValue };
            if (fieldName === 'status' && editValue === 'הושלם') {
                updates.completion_date = new Date().toISOString();
            }
            await Task.update(task.id, updates);

            // Bi-directional sync with PurchaseRecord
            if (fieldName === 'status' && task.source_type === 'procurement_record' && task.source_id) {
                let purchaseStatus;
                if (editValue === 'בתהליך' || editValue === 'בבדיקה') {
                    purchaseStatus = 'בהזמנה';
                } else if (editValue === 'הושלם') {
                    purchaseStatus = 'סופק';
                } else if (editValue === 'חדש') {
                    const record = await PurchaseRecord.get(task.source_id);
                    if (record && record.status !== 'סופק') {
                       purchaseStatus = 'יש להזמין';
                    }
                }

                if (purchaseStatus) {
                    await PurchaseRecord.update(task.source_id, { status: purchaseStatus });
                    toast.info(`סטטוס הזמנת הרכש עודכן ל: ${purchaseStatus}`);
                }
            }

            onUpdate();
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error("שגיאה בעדכון המשימה");
            setEditValue(value);
        } finally {
            setIsLoading(false);
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setEditValue(value || '');
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave();
        else if (e.key === 'Escape') handleCancel();
    };

    const displayValue = () => {
        if (fieldName === 'due_date' && value) {
             try {
                return (
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <span>{format(new Date(value), 'dd/MM/yy', { locale: he })}</span>
                    </div>
                );
            } catch (e) {
                return 'תאריך לא חוקי';
            }
        }
        if (fieldName === 'due_date' && !value) {
            return (
                 <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Calendar className="w-4 h-4" />
                    <span>לא הוגדר</span>
                </div>
            )
        }
        if (fieldName === 'status') {
            return (
                <Badge className={`${statusColors[value] || 'bg-gray-500/15 text-gray-400'} hover:opacity-80 text-xs`}>
                    {value}
                </Badge>
            );
        }
        return value || 'N/A';
    };

    if (!isEditing) {
        return (
          <div
            className="cursor-pointer p-1 rounded transition-colors"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--argaman-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.background = ''}
            onClick={() => setIsEditing(true)}
          >
            {displayValue()}
          </div>
        );
    }

    if (isLoading) return <Skeleton className="h-6 w-24" style={{ background: 'var(--dark-border)' }} />;

    if (options) {
        return (
            <Select value={editValue} onValueChange={setEditValue} onOpenChange={(open) => !open && handleSave()}>
                <SelectTrigger className="h-8 text-xs" style={{ background: 'var(--dark)', borderColor: 'var(--dark-border)', color: 'var(--text-primary)' }}><SelectValue /></SelectTrigger>
                <SelectContent>
                    {options.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
            </Select>
        );
    }

    return (
        <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-8 text-xs"
            style={{ background: 'var(--dark)', borderColor: 'var(--dark-border)', color: 'var(--text-primary)' }}
            type={fieldName === 'due_date' ? 'date' : 'text'}
            autoFocus
        />
    );
}

// Mobile Card View Component
function TaskCard({ task, onEdit, onUpdate }) {
    const priorityClass = priorityColors[task.priority] || '';

    return (
        <div className="mb-3 rounded-xl transition-all duration-200" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
            <div className="p-4">
                <div className="space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <h3 className="font-bold cursor-pointer text-base transition-colors" style={{ color: 'var(--text-primary)' }}
                                        onMouseEnter={(e) => e.target.style.color = 'var(--argaman-light)'}
                                        onMouseLeave={(e) => e.target.style.color = 'var(--text-primary)'}
                                    >
                                        {task.title}
                                    </h3>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: 'var(--dark-card)', borderColor: 'var(--dark-border)' }}>
                                    <DialogHeader><DialogTitle style={{ color: 'var(--argaman)' }}>{task.title}</DialogTitle></DialogHeader>
                                    <div className="py-4">
                                        {task.description && <p className='mb-4' style={{ color: 'var(--text-secondary)' }}>{task.description}</p>}
                                        <TaskActivityLog taskId={task.id} />
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{task.client_name || 'לא שויך'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                            <EditableCell value={task.status} task={task} fieldName="status" options={Object.keys(statusColors)} onUpdate={onUpdate} />
                            {task.priority && (
                                <Badge className={`text-xs ${priorityClass}`}>
                                    {task.priority}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            <span style={{ color: 'var(--text-muted)' }}>נותן: </span>
                            <EditableCell value={task.creator} task={task} fieldName="creator" onUpdate={onUpdate} />
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            <span style={{ color: 'var(--text-muted)' }}>אחראי: </span>
                            <EditableCell value={task.assigned_to} task={task} fieldName="assigned_to" options={userOptions} onUpdate={onUpdate} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-muted)' }}>יעד: </span>
                        <EditableCell value={task.due_date} task={task} fieldName="due_date" onUpdate={onUpdate} />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--dark-border)' }}>
                        {task.project_id && (
                            <Link to={createPageUrl(`ProjectDetails?id=${task.project_id}`)} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full text-green-400 hover:bg-green-500/10" style={{ borderColor: 'var(--dark-border)' }}>
                                    <LinkIcon className="w-4 h-4 ml-1" />
                                    קישור לפרויקט
                                </Button>
                            </Link>
                        )}
                        <Button variant="outline" size="sm" onClick={() => onEdit(task)} className="flex-1" style={{ borderColor: 'var(--dark-border)', color: 'var(--text-secondary)' }}>
                            <Edit className="w-4 h-4 ml-1" />
                            ערוך
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TaskList({ title, tasks, isLoading, onEdit, icon, defaultOpen = false, onUpdate }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (isLoading) {
        return (
             <div className="rounded-xl p-6" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
                <Skeleton className="h-6 w-1/3 mb-4" style={{ background: 'var(--dark-border)' }} />
                <Skeleton className="h-24 w-full" style={{ background: 'var(--dark-border)' }} />
             </div>
        )
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
                <CollapsibleTrigger asChild>
                    <div className="cursor-pointer p-6 transition-colors" onMouseEnter={(e) => e.currentTarget.style.background = 'var(--argaman-bg)'} onMouseLeave={(e) => e.currentTarget.style.background = ''}>
                        <div className="flex items-center gap-3 text-lg md:text-xl" style={{ color: 'var(--text-primary)' }}>
                            {isOpen ? <ChevronDown className="w-5 h-5 md:w-6 md:h-6" /> : <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />}
                            {icon || null}
                            <span className="flex-1 font-bold">{title}</span>
                            <span className="font-medium text-base md:text-lg" style={{ color: 'var(--text-muted)' }}>({tasks.length})</span>
                        </div>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table dir="rtl">
                                <TableHeader>
                                    <TableRow style={{ background: 'rgba(196, 43, 43, 0.05)', borderBottom: '1px solid var(--dark-border)' }}>
                                        <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>שם הלקוח</TableHead>
                                        <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>פירוט המשימה</TableHead>
                                        <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>נותן המשימה</TableHead>
                                        <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>אחראי</TableHead>
                                        <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>תאריך יעד</TableHead>
                                        <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>סטטוס</TableHead>
                                        <TableHead className="text-center font-semibold" style={{ color: 'var(--argaman)' }}>פעולות</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.map((task, index) => (
                                        <TableRow
                                            key={task.id}
                                            className="transition-colors"
                                            style={{
                                              background: index % 2 === 0 ? 'var(--dark-card)' : 'rgba(0,0,0,0.15)',
                                              borderBottom: '1px solid var(--dark-border)'
                                            }}
                                            onMouseEnter={(e) => { for (const td of e.currentTarget.querySelectorAll('td')) td.style.background = 'var(--argaman-bg)'; }}
                                            onMouseLeave={(e) => { for (const td of e.currentTarget.querySelectorAll('td')) td.style.background = ''; }}
                                        >
                                            <TableCell className="font-medium" style={{ color: 'var(--text-primary)' }}>{task.client_name || 'לא שויך'}</TableCell>
                                            <TableCell className="max-w-xs">
                                                 <Dialog>
                                                    <DialogTrigger asChild>
                                                        <span className="cursor-pointer hover:underline" style={{ color: 'var(--argaman-light)' }}>{task.title}</span>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl" style={{ background: 'var(--dark-card)', borderColor: 'var(--dark-border)' }}>
                                                        <DialogHeader><DialogTitle style={{ color: 'var(--argaman)' }}>{task.title}</DialogTitle></DialogHeader>
                                                        <div className="py-4">
                                                            {task.description && <p className='mb-4' style={{ color: 'var(--text-secondary)' }}>{task.description}</p>}
                                                            <TaskActivityLog taskId={task.id} />
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                            <TableCell><EditableCell value={task.creator} task={task} fieldName="creator" onUpdate={onUpdate} /></TableCell>
                                            <TableCell><EditableCell value={task.assigned_to} task={task} fieldName="assigned_to" options={userOptions} onUpdate={onUpdate} /></TableCell>
                                            <TableCell><EditableCell value={task.due_date} task={task} fieldName="due_date" onUpdate={onUpdate} /></TableCell>
                                            <TableCell><EditableCell value={task.status} task={task} fieldName="status" options={Object.keys(statusColors)} onUpdate={onUpdate} /></TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex gap-1 justify-center items-center">
                                                    {task.project_id && (
                                                        <Link to={createPageUrl(`ProjectDetails?id=${task.project_id}`)}>
                                                            <Button variant="ghost" size="icon" className="text-green-400 hover:bg-green-500/10">
                                                                <LinkIcon className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    <Button variant="ghost" size="icon" onClick={() => onEdit(task)} style={{ color: 'var(--text-secondary)' }}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {tasks.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>אין משימות להצגה בקטגוריה זו.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden p-3">
                            {tasks.length === 0 ? (
                                <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>אין משימות להצגה בקטגוריה זו.</p>
                            ) : (
                                tasks.map((task) => (
                                    <TaskCard key={task.id} task={task} onEdit={onEdit} onUpdate={onUpdate} />
                                ))
                            )}
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
