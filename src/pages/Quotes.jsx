
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Quote, Lead, Project, User } from "@/entities";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileText, FolderOpen, Archive } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const QUOTE_STATUSES = ['טיוטה', 'מוכנה', 'נשלחה', 'מאושרת', 'נדחתה'];

const statusColors = {
  'טיוטה': 'bg-amber-50 text-amber-700 border-amber-300',
  'מוכנה': 'bg-blue-50 text-blue-700 border-blue-300',
  'הצעה מוכנה ממתינה לאישור': 'bg-blue-50 text-blue-700 border-blue-300',
  'נשלחה': 'bg-green-50 text-green-700 border-green-300',
  'אושרה': 'bg-green-50 text-green-700 border-green-300',
  'נדחתה': 'bg-red-50 text-red-700 border-red-300'
};

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadQuotes();
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = quotes.filter(item =>
      item.title?.toLowerCase().includes(lowercasedFilter) ||
      item.client_name?.toLowerCase().includes(lowercasedFilter) ||
      item.quote_number?.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredQuotes(filteredData);
  }, [searchTerm, quotes]);

  const loadQuotes = async () => {
    setIsLoading(true);
    try {
      await User.me();
      const [data, allProjects] = await Promise.all([
        Quote.list('-created_date'),
        Project.list(),
      ]);
      setQuotes(data.filter(q => !q.is_archived));
      setFilteredQuotes(data.filter(q => !q.is_archived));
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading quotes:', error);
    }
    setIsLoading(false);
  };

  const handleRowClick = (quote) => {
    if (quote && quote.id) {
        console.log("Navigating to quote details:", quote.id);
        navigate(`/QuoteDetails?id=${quote.id}`);
    } else {
        console.error("מזהה הצעת המחיר לא תקין.");
        toast.error("מזהה הצעת המחיר לא תקין");
    }
  };

  const handleStatusChange = async (quoteId, newStatus) => {
    try {
      const quote = quotes.find(q => q.id === quoteId);
      await Quote.update(quoteId, { status: newStatus });
      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));

      // עדכון סטטוס ליד כשהצעה מאושרת
      if (newStatus === 'אושרה' && quote?.lead_id) {
        try {
          const lead = await Lead.get(quote.lead_id);
          if (lead && lead.status !== 'אושר') {
            await Lead.update(quote.lead_id, { status: 'אושר' });
          }
        } catch (e) {
          console.error('Error updating lead status:', e);
        }
      }
      // פרויקט נוצר מתוך דף ההצעה — כפתור "צור פרויקט"

      toast.success(`סטטוס עודכן ל-${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('שגיאה בעדכון סטטוס');
    }
  };

  const handleNewQuoteClick = () => {
    toast.info("נא לבחור ליד כדי ליצור הצעת מחיר חדשה.", {
      description: "עובר לעמוד הלידים לבחירת לקוח.",
      duration: 5000,
    });
    navigate(createPageUrl("Leads"));
  };


  return (
    <div className="p-4 md:p-8 min-h-screen" style={{ background: 'var(--dark)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>הצעות מחיר</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>ניהול וטיפול בכל ההצעות במערכת</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleNewQuoteClick}
          >
            <Plus className="w-4 h-4" />
            הצעת מחיר חדשה
          </button>
        </div>

        <div className="rounded-xl" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
          <div className="p-4">
             <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <Input
                placeholder="חיפוש לפי שם לקוח, מספר הצעה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-right w-full md:w-1/3"
                style={{ background: 'var(--dark)', borderColor: 'var(--dark-border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          <div className="p-0">
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow style={{ background: 'var(--dark)' }}>
                      <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>מספר הצעה</TableHead>
                      <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>לקוח</TableHead>
                      <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>סכום</TableHead>
                      <TableHead className="text-right font-semibold" style={{ color: 'var(--argaman)' }}>תאריך</TableHead>
                      <TableHead className="text-center font-semibold" style={{ color: 'var(--argaman)' }}>סטטוס</TableHead>
                      <TableHead className="text-center font-semibold" style={{ color: 'var(--argaman)' }}>פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                          <TableCell className="text-center"><Skeleton className="h-6 w-24 mx-auto rounded-full" /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      filteredQuotes.map((quote) => (
                        <TableRow key={quote.id} className="cursor-pointer" style={{ '--hover-bg': 'var(--argaman-bg)' }} onClick={() => handleRowClick(quote)}>
                          <TableCell className="font-medium" style={{ color: 'var(--argaman)' }}>{quote.quote_number}</TableCell>
                          <TableCell style={{ color: 'var(--text-primary)' }}>{quote.client_name}</TableCell>
                          <TableCell style={{ color: 'var(--text-primary)' }}>₪{quote.total?.toLocaleString()}</TableCell>
                          <TableCell style={{ color: 'var(--text-secondary)' }}>{format(new Date(quote.createdAt || quote.created_date || Date.now()), 'dd/MM/yyyy', { locale: he })}</TableCell>
                          <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                            <Select value={quote.status} onValueChange={(val) => handleStatusChange(quote.id, val)}>
                              <SelectTrigger className="w-[130px] mx-auto h-8 text-xs" style={{ borderColor: 'var(--dark-border)' }}>
                                <Badge className={`${statusColors[quote.status] || 'bg-gray-100 text-gray-600'} text-xs border`}>
                                  {quote.status}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                {QUOTE_STATUSES.map(s => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                            {(() => {
                              const proj = projects.find(p => p.quote_id === quote.id);
                              if (proj) {
                                return <Button size="sm" variant="outline" onClick={() => navigate(`/ProjectDetails?id=${proj.id}`)} className="text-xs gap-1"><FolderOpen size={12} />לפרויקט</Button>;
                              }
                              if (quote.status === 'אושרה') {
                                return <Button size="sm" onClick={() => navigate(`/QuoteDetails?id=${quote.id}`)} className="text-xs gap-1 bg-green-600 hover:bg-green-700 text-white"><FolderOpen size={12} />צור פרויקט</Button>;
                              }
                              return <Button size="sm" variant="ghost" onClick={() => { Quote.update(quote.id, { is_archived: true }); toast.success('הועבר לארכיון'); loadQuotes(); }} className="text-xs gap-1 text-gray-400"><Archive size={12} />ארכיון</Button>;
                            })()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                 { !isLoading && filteredQuotes.length === 0 && (
                    <div className="text-center p-8" style={{ color: 'var(--text-secondary)' }}>
                        <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
                        <p>לא נמצאו הצעות מחיר</p>
                    </div>
                 )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
