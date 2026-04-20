import React, { useState, useEffect, useMemo } from "react";
import { CollectionTask, Project } from "@/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowRight, ExternalLink, Receipt, Plus } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate, Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const statusConfig = {
  "חשבון מאושר – יש לשלוח חשבון עסקה": { color: "bg-blue-500 text-white", icon: "🔵" },
  "נשלחה חשבונית – ממתין לתשלום": { color: "bg-orange-500 text-white", icon: "🟠", displayName: "נשלח חשבון – ממתין לתשלום" },
  "עיכוב בתשלום – לטיפול יניר": { color: "bg-yellow-500 text-white", icon: "🟡" },
  "שולם ונשלחה חשבונית מס": { color: "bg-green-500 text-white", icon: "🟢" },
  "בוטל / זיכוי": { color: "bg-gray-400 text-white", icon: "⚪" }
};

const EditableCell = ({ value, onSave, type = "text", options = [], field }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onSave(editValue);
    }
  };

  if (isEditing) {
    return (
      <Input
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleBlur();
          if (e.key === 'Escape') { setEditValue(value); setIsEditing(false); }
        }}
        autoFocus
        className="h-9 text-sm"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors border border-transparent hover:border-blue-200"
    >
      <span className="text-slate-700">
        {type === "date" && value ? new Date(value).toLocaleDateString('he-IL') : (value || "לחץ להזנה")}
      </span>
    </div>
  );
};

export default function CollectionTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showClosed, setShowClosed] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    project_id: '',
    project_name: '',
    amount_to_collect: '',
    invoice_date: '',
    payment_due_date: '',
    collection_status: 'חשבון מאושר – יש לשלוח חשבון עסקה',
    responsible: 'רבקה',
    invoice_number: '',
    client_name: '',
    notes: ''
  });
  const [paymentDialog, setPaymentDialog] = useState({
    isOpen: false,
    task: null,
    isFullPayment: true,
    amountReceived: '',
    receiptDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await Project.list('-created_date');
      setProjects(data.filter(p => !p.is_archived));
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await CollectionTask.list('-created_date');
      setTasks(data);
    } catch (error) {
      console.error('Error loading collection tasks:', error);
      toast.error("שגיאה בטעינת משימות גבייה");
    }
    setIsLoading(false);
  };

  const handleUpdate = async (taskId, field, value) => {
    try {
      // Special handling for "שולם ונשלחה חשבונית מס" status
      if (field === 'collection_status' && value === 'שולם ונשלחה חשבונית מס') {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          // Open payment dialog
          setPaymentDialog({
            isOpen: true,
            task: task,
            isFullPayment: true,
            amountReceived: task.amount_to_collect || 0,
            receiptDate: new Date().toISOString().split('T')[0],
            notes: ''
          });
          return; // Don't update yet, wait for dialog
        }
      }

      const updateData = { [field]: value };

      // Auto-close when status is "בוטל"
      if (field === 'collection_status' && value === 'בוטל / זיכוי') {
        updateData.is_closed = true;
      }

      await CollectionTask.update(taskId, updateData);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updateData } : t));
      toast.success("עודכן בהצלחה");
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error("שגיאה בעדכון");
    }
  };

  const handlePaymentConfirm = async () => {
    if (!paymentDialog.task) return;

    const { task, isFullPayment, amountReceived, receiptDate, notes } = paymentDialog;
    const originalAmount = task.amount_to_collect || 0;

    try {
      if (isFullPayment) {
        const fullPaymentNote = `תשלום מלא התקבל בתאריך ${new Date(receiptDate).toLocaleDateString('he-IL')}.${notes ? ` ${notes}` : ''}`;
        await CollectionTask.update(task.id, {
          collection_status: 'שולם ונשלחה חשבונית מס',
          is_closed: true,
          notes: task.notes ? `${task.notes}\n\n${fullPaymentNote}` : fullPaymentNote
        });
        toast.success("המשימה סומנה כשולמה במלואה");
      } else {
        const amountReceivedNum = parseFloat(amountReceived);
        if (isNaN(amountReceivedNum) || amountReceivedNum <= 0) {
          toast.error("יש להזין סכום תקין שהתקבל");
          return;
        }
        if (amountReceivedNum >= originalAmount) {
          toast.error("הסכום שהתקבל גבוה או שווה לסכום המקורי. יש לבחור 'תשלום מלא'");
          return;
        }

        const remainingAmount = originalAmount - amountReceivedNum;

        const partialPaymentNote = `התקבל תשלום חלקי בסך ₪${amountReceivedNum.toLocaleString('he-IL')} בתאריך ${new Date(receiptDate).toLocaleDateString('he-IL')}. נפתחה משימת המשך ליתרה לגבייה בסך ₪${remainingAmount.toLocaleString('he-IL')}.${notes ? ` ${notes}` : ''}`;
        await CollectionTask.update(task.id, {
          collection_status: 'שולם ונשלחה חשבונית מס',
          is_closed: true,
          notes: task.notes ? `${task.notes}\n\n${partialPaymentNote}` : partialPaymentNote
        });

        const followUpTask = {
          project_name: `תשלום חלקי – המשך ל${task.invoice_number || 'חשבון'} – יתרה לגבייה`,
          amount_to_collect: remainingAmount,
          invoice_date: task.invoice_date,
          payment_due_date: task.payment_due_date,
          collection_status: 'חשבון מאושר – יש לשלוח חשבון עסקה',
          responsible: task.responsible,
          invoice_number: `${task.invoice_number || 'חשבון'} - המשך`,
          notes: `המשך לתשלום חלקי שהתקבל בסך ₪${amountReceivedNum.toLocaleString('he-IL')}. יתרה לגבייה: ₪${remainingAmount.toLocaleString('he-IL')}.${notes ? ` ${notes}` : ''}`
        };

        if (task.project_id) {
          followUpTask.project_id = task.project_id;
        }

        await CollectionTask.create(followUpTask);
        toast.success(`משימת המשך נוצרה על יתרה של ₪${remainingAmount.toLocaleString('he-IL')}`);
      }

      loadTasks();
      setPaymentDialog({
        isOpen: false,
        task: null,
        isFullPayment: true,
        amountReceived: '',
        receiptDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error("שגיאה בעיבוד התשלום");
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => showClosed ? task.is_closed : !task.is_closed);
  }, [tasks, showClosed]);

  const calculateDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.floor((today - due) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const handleCreateTask = async () => {
    if (!formData.client_name || !formData.amount_to_collect || !formData.invoice_number) {
      toast.error("יש למלא שם לקוח, תיאור וסכום");
      return;
    }

    try {
      const selectedProject = projects.find(p => p.id === formData.project_id);
      const taskData = {
        project_name: selectedProject?.name || formData.client_name,
        amount_to_collect: Number(formData.amount_to_collect),
        invoice_date: formData.invoice_date || new Date().toISOString().split('T')[0],
        payment_due_date: formData.payment_due_date,
        collection_status: formData.collection_status,
        responsible: formData.responsible,
        invoice_number: formData.invoice_number
      };

      if (formData.project_id) {
        taskData.project_id = formData.project_id;
      }

      await CollectionTask.create(taskData);

      toast.success("משימת גבייה נוספה בהצלחה");
      setIsDialogOpen(false);
      setFormData({
        project_id: '',
        project_name: '',
        amount_to_collect: '',
        invoice_date: '',
        payment_due_date: '',
        collection_status: 'חשבון מאושר – יש לשלוח חשבון עסקה',
        responsible: 'רבקה',
        invoice_number: '',
        client_name: '',
        notes: ''
      });
      loadTasks();
    } catch (error) {
      console.error('Error creating collection task:', error);
      toast.error("שגיאה ביצירת משימת גבייה");
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">לוח משימות גבייה</h1>
            <p className="text-slate-500 mt-1">ניהול ומעקב גבייה</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 ml-2" />
                  הוספת משימת גבייה
                </Button>
              </DialogTrigger>
              <DialogContent
                className="max-w-lg bg-white border-0 shadow-2xl max-h-[90vh] overflow-y-auto"
                dir="rtl"
                style={{ boxShadow: '0px 8px 24px rgba(0,0,0,0.15)' }}
              >
                <DialogHeader className="text-right pb-4 border-b border-slate-200">
                  <DialogTitle className="text-xl font-semibold text-slate-800">משימת גבייה חדשה</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-6">
                  <div>
                    <Label htmlFor="client_name" className="text-sm font-medium text-slate-700 mb-2 block text-right">
                      שם לקוח / ישות לחיוב *
                    </Label>
                    <Input
                      id="client_name"
                      value={formData.client_name}
                      onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                      placeholder="שם הלקוח או הישות"
                      className="bg-white border-slate-300 text-slate-900"
                    />
                  </div>

                  <div>
                    <Label htmlFor="invoice_number" className="text-sm font-medium text-slate-700 mb-2 block text-right">
                      תיאור חיוב / משימה *
                    </Label>
                    <Input
                      id="invoice_number"
                      value={formData.invoice_number}
                      onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                      placeholder="חשבון 1, תיקון, תשלום..."
                      className="bg-white border-slate-300 text-slate-900"
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount" className="text-sm font-medium text-slate-700 mb-2 block text-right">סכום גבייה *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount_to_collect}
                      onChange={(e) => setFormData({...formData, amount_to_collect: e.target.value})}
                      placeholder="0.00"
                      className="bg-white border-slate-300 text-slate-900"
                    />
                  </div>

                  <div>
                    <Label htmlFor="invoice_date" className="text-sm font-medium text-slate-700 mb-2 block text-right">תאריך חשבון</Label>
                    <Input
                      id="invoice_date"
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
                      className="bg-white border-slate-300 text-slate-900"
                    />
                  </div>

                  <div>
                    <Label htmlFor="due_date" className="text-sm font-medium text-slate-700 mb-2 block text-right">תאריך יעד לתשלום</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.payment_due_date}
                      onChange={(e) => setFormData({...formData, payment_due_date: e.target.value})}
                      className="bg-white border-slate-300 text-slate-900"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status" className="text-sm font-medium text-slate-700 mb-2 block text-right">סטטוס גבייה</Label>
                    <Select value={formData.collection_status} onValueChange={(val) => setFormData({...formData, collection_status: val})}>
                      <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {Object.entries(statusConfig).map(([status, config]) => (
                          <SelectItem key={status} value={status}>
                            {config.icon} {config.displayName || status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="responsible" className="text-sm font-medium text-slate-700 mb-2 block text-right">אחראי</Label>
                    <Select value={formData.responsible} onValueChange={(val) => setFormData({...formData, responsible: val})}>
                      <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {["חיה", "יניר", "דבורה", "יהודה", "רבקה", "שי"].map(name => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-3">שדות אופציונליים</p>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="project" className="text-sm font-medium text-slate-700 mb-2 block text-right">
                          שיוך לפרויקט (אופציונלי)
                        </Label>
                        <Select value={formData.project_id} onValueChange={(val) => setFormData({...formData, project_id: val})}>
                          <SelectTrigger className="bg-white border-slate-300 text-slate-900">
                            <SelectValue placeholder="ללא שיוך לפרויקט" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            {projects.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name} - {p.client_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-300 text-slate-700">
                      ביטול
                    </Button>
                    <Button onClick={handleCreateTask} className="text-white" style={{ backgroundColor: '#16A34A' }}>
                      צור משימה
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("CollectionDashboard"))}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה לדאשבורד
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl md:text-2xl flex items-center gap-3">
                <Receipt className="w-6 h-6 text-blue-600" />
                {showClosed ? 'משימות גבייה סגורות' : 'משימות גבייה פעילות'}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={!showClosed ? "default" : "outline"}
                  onClick={() => setShowClosed(false)}
                  className={!showClosed ? "bg-blue-600" : ""}
                >
                  פעילות ({tasks.filter(t => !t.is_closed).length})
                </Button>
                <Button
                  variant={showClosed ? "default" : "outline"}
                  onClick={() => setShowClosed(true)}
                  className={showClosed ? "bg-slate-600" : ""}
                >
                  סגורות ({tasks.filter(t => t.is_closed).length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-12 text-slate-500">טוען...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>{showClosed ? 'אין משימות סגורות' : 'אין משימות פעילות'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100">
                      <TableHead className="text-right font-bold w-[200px]">פרויקט</TableHead>
                      <TableHead className="text-right font-bold w-[120px]">סכום לגבייה</TableHead>
                      <TableHead className="text-right font-bold w-[120px]">תאריך חשבון</TableHead>
                      <TableHead className="text-right font-bold w-[120px]">יעד תשלום</TableHead>
                      <TableHead className="text-right font-bold w-[90px]">ימים באיחור</TableHead>
                      <TableHead className="text-right font-bold w-[220px]">סטטוס</TableHead>
                      <TableHead className="text-right font-bold w-[100px]">אחראי</TableHead>
                      <TableHead className="text-right font-bold w-[250px]">הערות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => {
                      const daysOverdue = calculateDaysOverdue(task.payment_due_date);
                      const statusInfo = statusConfig[task.collection_status] || statusConfig["חשבון מאושר – יש לשלוח חשבון עסקה"];

                      return (
                        <TableRow key={task.id} className="h-16 hover:bg-slate-50">
                          <TableCell className="text-right align-middle">
                            {task.project_id ? (
                              <Link
                                to={createPageUrl(`ProjectDetails?id=${task.project_id}`)}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              >
                                <span>{task.project_name}</span>
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            ) : (
                              <span className="font-medium">{task.project_name}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-900 align-middle">
                            ₪{task.amount_to_collect?.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </TableCell>
                          <TableCell className="text-right align-middle">
                            <span className="text-slate-700">
                              {task.invoice_date ? new Date(task.invoice_date).toLocaleDateString('he-IL') : '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right align-middle">
                            <EditableCell
                              value={task.payment_due_date}
                              onSave={(val) => handleUpdate(task.id, 'payment_due_date', val)}
                              type="date"
                            />
                          </TableCell>
                          <TableCell className="text-right align-middle">
                            {daysOverdue > 0 ? (
                              <Badge className="bg-red-500 text-white font-semibold">{daysOverdue} ימים</Badge>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right align-middle">
                            <Select
                              value={task.collection_status}
                              onValueChange={(val) => handleUpdate(task.id, 'collection_status', val)}
                            >
                              <SelectTrigger className="h-9 w-[220px]">
                                <SelectValue>
                                  <Badge className={`${statusInfo.color} px-3 py-1 text-xs font-medium`}>
                                    {statusInfo.icon} {statusInfo.displayName || task.collection_status}
                                  </Badge>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusConfig).map(([status, config]) => (
                                  <SelectItem key={status} value={status}>
                                    <Badge className={`${config.color} px-3 py-1 text-xs font-medium`}>
                                      {config.icon} {config.displayName || status}
                                    </Badge>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right align-middle">
                            <Select
                              value={task.responsible || "רבקה"}
                              onValueChange={(val) => handleUpdate(task.id, 'responsible', val)}
                            >
                              <SelectTrigger className="h-9 w-[100px] text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["חיה", "יניר", "דבורה", "יהודה", "רבקה", "שי"].map(name => (
                                  <SelectItem key={name} value={name}>{name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right align-middle">
                            <Textarea
                              value={task.notes || ''}
                              onChange={(e) => handleUpdate(task.id, 'notes', e.target.value)}
                              placeholder="הוסף הערות..."
                              className="min-h-[60px] text-sm resize-none bg-white"
                              rows={2}
                            />
                          </TableCell>
                          </TableRow>
                          );
                          })}
                          </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          </Card>

          {/* Payment Dialog */}
          <Dialog open={paymentDialog.isOpen} onOpenChange={(open) => {
          if (!open) {
            setPaymentDialog({
              isOpen: false,
              task: null,
              isFullPayment: true,
              amountReceived: '',
              receiptDate: new Date().toISOString().split('T')[0],
              notes: ''
            });
          }
          }}>
          <DialogContent className="max-w-md bg-white border-0 shadow-2xl" dir="rtl">
            <DialogHeader className="text-right pb-4 border-b border-slate-200">
              <DialogTitle className="text-xl font-semibold text-slate-800">קליטת תשלום</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-slate-700 mb-1">סכום לגבייה מקורי:</p>
                <p className="text-2xl font-bold text-blue-700">
                  ₪{(paymentDialog.task?.amount_to_collect || 0).toLocaleString('he-IL')}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700 mb-3 block text-right">
                  האם התקבל תשלום מלא?
                </Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={paymentDialog.isFullPayment ? "default" : "outline"}
                    onClick={() => setPaymentDialog({...paymentDialog, isFullPayment: true, amountReceived: paymentDialog.task?.amount_to_collect || 0})}
                    className={paymentDialog.isFullPayment ? "bg-green-600 hover:bg-green-700 flex-1" : "flex-1"}
                  >
                    כן - תשלום מלא
                  </Button>
                  <Button
                    type="button"
                    variant={!paymentDialog.isFullPayment ? "default" : "outline"}
                    onClick={() => setPaymentDialog({...paymentDialog, isFullPayment: false, amountReceived: ''})}
                    className={!paymentDialog.isFullPayment ? "bg-orange-600 hover:bg-orange-700 flex-1" : "flex-1"}
                  >
                    לא - תשלום חלקי
                  </Button>
                </div>
              </div>

              {!paymentDialog.isFullPayment && (
                <div>
                  <Label htmlFor="amount_received" className="text-sm font-medium text-slate-700 mb-2 block text-right">
                    כמה התקבל בפועל? *
                  </Label>
                  <Input
                    id="amount_received"
                    type="number"
                    value={paymentDialog.amountReceived}
                    onChange={(e) => setPaymentDialog({...paymentDialog, amountReceived: e.target.value})}
                    placeholder="0.00"
                    className="bg-white border-slate-300 text-slate-900"
                    required
                  />
                  {paymentDialog.amountReceived && (
                    <p className="text-sm text-orange-600 mt-2 font-medium">
                      יתרה לגבייה: ₪{((paymentDialog.task?.amount_to_collect || 0) - parseFloat(paymentDialog.amountReceived || 0)).toLocaleString('he-IL')}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="receipt_date" className="text-sm font-medium text-slate-700 mb-2 block text-right">
                  תאריך קבלה
                </Label>
                <Input
                  id="receipt_date"
                  type="date"
                  value={paymentDialog.receiptDate}
                  onChange={(e) => setPaymentDialog({...paymentDialog, receiptDate: e.target.value})}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <Label htmlFor="payment_notes" className="text-sm font-medium text-slate-700 mb-2 block text-right">
                  הערות
                </Label>
                <Textarea
                  id="payment_notes"
                  value={paymentDialog.notes}
                  onChange={(e) => setPaymentDialog({...paymentDialog, notes: e.target.value})}
                  placeholder="הערות נוספות..."
                  rows={3}
                  className="bg-white border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  onClick={() => setPaymentDialog({
                    isOpen: false,
                    task: null,
                    isFullPayment: true,
                    amountReceived: '',
                    receiptDate: new Date().toISOString().split('T')[0],
                    notes: ''
                  })}
                  className="border-slate-300 text-slate-700"
                >
                  ביטול
                </Button>
                <Button
                  onClick={handlePaymentConfirm}
                  className="text-white bg-blue-600 hover:bg-blue-700"
                >
                  אישור וסגירה
                </Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
          </div>
          </div>
          );
          }
