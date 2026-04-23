
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Quote, User } from "@/entities";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileText } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

const statusColors = {
  'טיוטה': 'bg-[rgba(251,191,36,0.1)] text-[#fbbf24] border-[rgba(251,191,36,0.3)]',
  'מוכנה': 'bg-[rgba(96,165,250,0.1)] text-[#60a5fa] border-[rgba(96,165,250,0.3)]',
  'הצעה מוכנה ממתינה לאישור': 'bg-[rgba(96,165,250,0.1)] text-[#60a5fa] border-[rgba(96,165,250,0.3)]',
  'נשלחה': 'bg-[rgba(74,222,128,0.1)] text-[#4ade80] border-[rgba(74,222,128,0.3)]',
  'אושרה': 'bg-[rgba(74,222,128,0.15)] text-[#4ade80] border-[rgba(74,222,128,0.3)]',
  'נדחתה': 'bg-[rgba(248,113,113,0.1)] text-[#f87171] border-[rgba(248,113,113,0.3)]'
};

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
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
      const data = await Quote.list('-created_date');
      setQuotes(data);
      setFilteredQuotes(data);
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
                          <TableCell className="text-center">
                            <Badge className={`${statusColors[quote.status] || 'bg-[rgba(255,255,255,0.05)]'} text-xs border`}>
                              {quote.status}
                            </Badge>
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
