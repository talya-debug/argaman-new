
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
  "חדש": "bg-blue-100 text-blue-800",
  "בתהליך": "bg-yellow-100 text-yellow-800",
  "בבדיקה": "bg-purple-100 text-purple-800",
  "הושלם": "bg-green-100 text-green-800",
  "בוטל": "bg-red-100 text-red-800"
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
            // toast.success("המשימה עודכנה בהצלחה"); // This line was removed as per the request
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
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span>{format(new Date(value), 'dd/MM/yy', { locale: he })}</span>
                    </div>
                );
            } catch (e) {
                return 'תאריך לא חוקי';
            }
        }
        if (fieldName === 'due_date' && !value) {
            return (
                 <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>לא הוגדר</span>
                </div>
            )
        }
        if (fieldName === 'status') {
            return (
                <Badge className={`${statusColors[value] || 'bg-gray-100 text-gray-800'} hover:opacity-80 text-xs`}>
                    {value}
                </Badge>
            );
        }
        return value || 'N/A';
    };

    if (!isEditing) {
        return <div className="cursor-pointer hover:bg-slate-50 p-1 rounded" onClick={() => setIsEditing(true)}>{displayValue()}</div>;
    }

    if (isLoading) return <Skeleton className="h-6 w-24" />;

    if (options) {
        return (
            <Select value={editValue} onValueChange={setEditValue} onOpenChange={(open) => !open && handleSave()}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
            type={fieldName === 'due_date' ? 'date' : 'text'}
            autoFocus
        />
    );
}

// Mobile Card View Component
function TaskCard({ task, onEdit, onUpdate }) {
    return (
        <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
                <div className="space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <h3 className="font-bold text-slate-900 cursor-pointer hover:text-blue-600 text-base">
                                        {task.title}
                                    </h3>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
                                    <DialogHeader><DialogTitle>{task.title}</DialogTitle></DialogHeader>
                                    <div className="py-4">
                                        {task.description && <p className='mb-4 text-slate-700'>{task.description}</p>}
                                        <TaskActivityLog taskId={task.id} />
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <p className="text-sm text-slate-600 mt-1">{task.client_name || 'לא שויך'}</p>
                        </div>
                        <EditableCell value={task.status} task={task} fieldName="status" options={Object.keys(statusColors)} onUpdate={onUpdate} />
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">נותן: </span>
                            <EditableCell value={task.creator} task={task} fieldName="creator" onUpdate={onUpdate} />
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">אחראי: </span>
                            <EditableCell value={task.assigned_to} task={task} fieldName="assigned_to" options={userOptions} onUpdate={onUpdate} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">יעד: </span>
                        <EditableCell value={task.due_date} task={task} fieldName="due_date" onUpdate={onUpdate} />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                        {task.project_id && (
                            <Link to={createPageUrl(`ProjectDetails?id=${task.project_id}`)} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full text-green-600 border-green-200 hover:bg-green-50">
                                    <LinkIcon className="w-4 h-4 ml-1" />
                                    קישור לפרויקט
                                </Button>
                            </Link>
                        )}
                        <Button variant="outline" size="sm" onClick={() => onEdit(task)} className="flex-1">
                            <Edit className="w-4 h-4 ml-1" />
                            ערוך
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function TaskList({ title, tasks, isLoading, onEdit, icon, defaultOpen = false, onUpdate }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    if (isLoading) {
        return (
             <Card>
                <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                <CardContent><Skeleton className="h-24 w-full" /></CardContent>
             </Card>
        )
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className="shadow-lg border-0">
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-slate-50">
                        <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                            {isOpen ? <ChevronDown className="w-5 h-5 md:w-6 md:h-6" /> : <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />}
                            {icon || null}
                            <span className="flex-1">{title}</span>
                            <span className="text-slate-400 font-medium text-base md:text-lg">({tasks.length})</span>
                        </CardTitle>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="p-0">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table dir="rtl">
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="text-right font-semibold">שם הלקוח</TableHead>
                                        <TableHead className="text-right font-semibold">פירוט המשימה</TableHead>
                                        <TableHead className="text-right font-semibold">נותן המשימה</TableHead>
                                        <TableHead className="text-right font-semibold">אחראי</TableHead>
                                        <TableHead className="text-right font-semibold">תאריך יעד</TableHead>
                                        <TableHead className="text-right font-semibold">סטטוס</TableHead>
                                        <TableHead className="text-center font-semibold">פעולות</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.map((task, index) => (
                                        <TableRow 
                                            key={task.id}
                                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50 transition-colors`}
                                        >
                                            <TableCell className="font-medium text-slate-900">{task.client_name || 'לא שויך'}</TableCell>
                                            <TableCell className="max-w-xs">
                                                 <Dialog>
                                                    <DialogTrigger asChild>
                                                        <span className="cursor-pointer hover:underline text-blue-600">{task.title}</span>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl bg-white">
                                                        <DialogHeader><DialogTitle>{task.title}</DialogTitle></DialogHeader>
                                                        <div className="py-4">
                                                            {task.description && <p className='mb-4 text-slate-700'>{task.description}</p>}
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
                                                            <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-50">
                                                                <LinkIcon className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {tasks.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-slate-500 py-8">אין משימות להצגה בקטגוריה זו.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden p-4">
                            {tasks.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">אין משימות להצגה בקטגוריה זו.</p>
                            ) : (
                                tasks.map((task) => (
                                    <TaskCard key={task.id} task={task} onEdit={onEdit} onUpdate={onUpdate} />
                                ))
                            )}
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
