import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Lead, Quote, QuoteLine, Project, Task, User } from "@/entities";
import { uploadFile } from "@/api/storage";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, FileText, Edit } from "lucide-react";
import LeadsTable from "../components/leads/LeadsTable";
import LeadForm from "../components/leads/LeadForm";
import LeadFilters from "../components/leads/LeadFilters";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { createNotification } from "@/lib/notifications";

export default function Leads() {
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectCreationInProgress, setProjectCreationInProgress] = useState(new Set());
  const creatingRef = useRef(false);
  const [activeView, setActiveView] = useState('active');

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    handleFilterChange({});
  }, [activeView, leads]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      await User.me();
      const data = await Lead.list('-created_date');
      setLeads(data);
      setFilteredLeads(data);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error("שגיאה בטעינת לידים.");
    }
    setIsLoading(false);
  };

  const refreshLeads = async () => {
    setIsRefreshing(true);
    await loadLeads();
    setIsRefreshing(false);
  };

  const createProjectFromLead = async (lead) => {
    if (creatingRef.current || projectCreationInProgress.has(lead.id)) {
        console.log(`Project creation already in progress for lead ${lead.id}`);
        return;
    }

    try {
      creatingRef.current = true;
      setIsCreatingProject(true);
      setProjectCreationInProgress(prev => new Set([...prev, lead.id]));

      const existingProjects = await Project.filter({ lead_id: lead.id });
      if (existingProjects && existingProjects.length > 0) {
        const existingProject = existingProjects[0];
        navigate(createPageUrl(`ProjectDetails?id=${existingProject.id}`));
        return;
      }

      let relevantQuotes = [];
      try {
        relevantQuotes = await Quote.filter({ lead_id: lead.id });
      } catch (e) {
        console.error("Error filtering quotes:", e);
      }

      if (!relevantQuotes || relevantQuotes.length === 0) {
        toast.error("לא נמצאה הצעת מחיר עבור הליד. צור הצעת מחיר קודם.");
        await Lead.update(lead.id, { status: 'המתנה לאישור' });
        loadLeads();
        return;
      }

      const quoteToApprove = relevantQuotes.sort((a, b) => new Date(b.updatedAt || b.updated_date) - new Date(a.updatedAt || a.updated_date))[0];

      let quoteLines = [];
      try {
        quoteLines = await QuoteLine.filter({ quote_id: quoteToApprove.id });
      } catch (e) {
        console.error("Error loading quote lines:", e);
      }

      const newProject = await Project.create({
        name: `פרויקט - ${lead.name}`,
        client_name: lead.name,
        lead_id: lead.id,
        quote_id: quoteToApprove.id,
        status: 'בתכנון',
        start_date: new Date().toISOString().split('T')[0],
        responsible: lead.responsible,
        description: `פרויקט שנוצר מהליד: ${lead.name}`,
        deduction_insurance_percentage: 0,
        deduction_retention_percentage: 0,
        deduction_lab_tests_percentage: 0
      });

      for (let i = 0; i < quoteLines.length; i++) {
        const line = quoteLines[i];
        if (line.order_index === undefined || line.order_index === null) {
          await QuoteLine.update(line.id, { order_index: i });
        }
      }

      await Quote.update(quoteToApprove.id, { status: 'אושרה' });

      const startupTasks = [
          {
              title: "פתיחת תיקייה וכניסה למעקב גבייה",
              assigned_to: "חיה",
              source_type: "project_completion",
              priority: "גבוהה",
              status: "חדש"
          },
          {
              title: "פגישת התנעה יניר ויהודה",
              assigned_to: "חיה",
              source_type: "project_completion",
              priority: "בינונית",
              status: "חדש"
          }
      ];

      for (const task of startupTasks) {
          await Task.create({
              ...task,
              client_name: newProject.name,
              project_id: newProject.id,
              source_id: newProject.id,
              auto_created: true
          });
      }

      // התראה על פרויקט חדש
      createNotification({
        user_id: 'all',
        title: 'פרויקט חדש',
        message: `פרויקט ${lead.name} נוצר`,
        type: 'project_started',
        link: `/ProjectDetails?id=${newProject.id}`,
      });

      navigate(createPageUrl(`ProjectDetails?id=${newProject.id}`));

    } catch (error) {
        console.error("Error creating project from lead:", error);
        toast.error("שגיאה ביצירת פרויקט מהליד.");
        loadLeads();
    } finally {
        creatingRef.current = false;
        setIsCreatingProject(false);
        setProjectCreationInProgress(prev => {
            const newSet = new Set(prev);
            newSet.delete(lead.id);
            return newSet;
        });
    }
  };

  const handleSubmit = async (leadData) => {
    try {
      const { image_file, price_list_file, ...restOfData } = leadData;
      let finalData = restOfData;

      if (image_file instanceof File) {
        const result = await uploadFile(image_file, 'leads');
        finalData = { ...finalData, image_url: result.url };
      }

      if (price_list_file instanceof File) {
        const result = await uploadFile(price_list_file, 'leads');
        finalData = { ...finalData, price_list_file_url: result.url };
      }

      if (finalData.estimated_value === '' || finalData.estimated_value === null || finalData.estimated_value === undefined) {
        delete finalData.estimated_value;
      }

      if (editingLead) {
        const oldStatus = editingLead.status;
        await Lead.update(editingLead.id, {
          ...editingLead,
          ...finalData,
          last_interaction_date: new Date().toISOString().split('T')[0]
        });

        // פרויקט נוצר מדף ההצעה — לא מכאן

      } else {
        const newLead = await Lead.create({
          ...finalData,
          last_interaction_date: new Date().toISOString().split('T')[0]
        });

        // התראה על ליד חדש ליניר
        createNotification({
          user_id: 'yanir',
          title: 'ליד חדש',
          message: `ליד חדש: ${newLead.name || finalData.name}`,
          type: 'general',
          link: '/Leads',
        });

        // פרויקט נוצר מדף ההצעה — לא מכאן
      }
      setShowForm(false);
      setEditingLead(null);
      loadLeads();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error("שגיאה בשמירת ליד.");
    }
  };

  const handleUpdate = async (leadId, leadData) => {
    try {
      const currentLead = leads.find(l => l.id === leadId);
      const oldStatus = currentLead?.status;

      await Lead.update(leadId, {
        ...currentLead,
        ...leadData,
        last_interaction_date: new Date().toISOString().split('T')[0]
      });

      // פרויקט נוצר מדף ההצעה — לא מכאן

      loadLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error("שגיאה בעדכון ליד.");
      throw error;
    }
  };

  const handleDelete = async (leadId) => {
    try {
      await Lead.delete(leadId);
      loadLeads();
      toast.success("ליד נמחק בהצלחה.");
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error("שגיאה במחיקת ליד.");
    }
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setShowForm(true);
  };

  const handleQuoteAction = async (lead, forceNew = false) => {
    try {
      if (!forceNew) {
        const quotes = await Quote.filter({ lead_id: lead.id });
        if (quotes && quotes.length > 0) {
          const latestQuote = quotes.sort((a,b) => new Date(b.createdAt || b.created_date) - new Date(a.createdAt || a.created_date))[0];
          if (latestQuote && latestQuote.id) {
            navigate(`/QuoteDetails?id=${latestQuote.id}`);
            return;
          }
        }
      }
      {
        // נווט לדף הצעה חדשה עם פרטי הליד — ההצעה תישמר רק כשלוחצים "שמור"
        navigate(`/QuoteDetails?lead_id=${lead.id}`);
      }
    } catch (error) {
       console.error("Error in handleQuoteAction:", error);
       toast.error("שגיאה בטיפול בהצעת מחיר");
    }
  };

  const handleFilterChange = (filters) => {
    let filtered = leads;

    // סינון לפי סטטוס ליד
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(lead => (lead.lead_status || 'דורש טיפול') === filters.status);
    } else {
      // ברירת מחדל — לא מציג ארכיון
      filtered = filtered.filter(lead => (lead.lead_status || 'דורש טיפול') !== 'ארכיון');
    }

    if (filters.responsible && filters.responsible !== 'all') {
      filtered = filtered.filter(lead => lead.responsible === filters.responsible);
    }

    if (filters.search) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        lead.phone.includes(filters.search) ||
        (lead.email && lead.email.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    setFilteredLeads(filtered);
  };

  return (
    <div className="p-4 md:p-8 min-h-screen animate-in" style={{ background: 'var(--dark)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>ניהול לידים</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>מעקב וניהול כל הלידים במערכת</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refreshLeads}
              disabled={isRefreshing}
              className="btn btn-secondary"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              רענן
            </button>
            <button
              onClick={() => { setEditingLead(null); setShowForm(true); }}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              ליד חדש
            </button>
          </div>
        </div>

        <LeadFilters onFilterChange={handleFilterChange} leads={leads} />
        <LeadsTable
          leads={filteredLeads}
          onEdit={handleEdit}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onQuoteAction={handleQuoteAction}
          isLoading={isLoading}
        />

        <Dialog open={showForm} modal={true} onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingLead(null);
        }}>
          <DialogContent className="max-w-xl" style={{ background: 'var(--dark-card)', borderColor: 'var(--dark-border)' }}>
            <DialogHeader>
              <DialogTitle className="text-right" style={{ color: 'var(--argaman)' }}>
                {editingLead ? 'עריכת ליד' : 'ליד חדש'}
              </DialogTitle>
            </DialogHeader>
            <LeadForm
              lead={editingLead}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingLead(null);
              }}
            />
          </DialogContent>
        </Dialog>

        <div className="mt-8 rounded-xl p-6" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--info-bg)' }}>
              <span className="text-lg font-bold" style={{ color: 'var(--info)' }}>💡</span>
            </div>
            <div className="text-right flex-1">
              <h4 className="font-bold mb-3 text-lg" style={{ color: 'var(--info)' }}>מדריך מהיר לניהול לידים:</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--info)' }}>עריכה מהירה:</h5>
                  <ul className="text-sm space-y-1" style={{ color: 'rgba(96, 165, 250, 0.7)' }}>
                    <li>• לחץ על כל שדה לעריכה ישירה</li>
                    <li>• Enter לשמירה, Escape לביטול</li>
                    <li>• <FileText className="w-3 h-3 inline ml-1" />כפתור ירוק ליצירת/צפייה בהצעת מחיר</li>
                    <li>• <Edit className="w-3 h-3 inline ml-1" />כפתור סגול לעריכה מלאה</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: 'var(--info)' }}>זרימה אוטומטית:</h5>
                  <ul className="text-sm space-y-1" style={{ color: 'rgba(96, 165, 250, 0.7)' }}>
                    <li>• שינוי סטטוס ל"אושר" יוצר פרויקט אוטומטית</li>
                    <li>• המערכת בודקת אם כבר קיים פרויקט למניעת כפילויות</li>
                    <li>• פרויקטים חדשים יפתחו עם משימות מוגדרות מראש</li>
                    <li>• תאריך אינטראקציה מתעדכן אוטומטית</li>
                    <li>• הצעת מחיר מתעדכנת לסטטוס "אושרה" אוטומטית</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
