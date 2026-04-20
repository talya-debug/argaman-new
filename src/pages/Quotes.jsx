
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
  'טיוטה': 'bg-[rgba(251,191,36,0.1)] text-yellow-800 border-yellow-200',
  'מוכנה': 'bg-[rgba(96,165,250,0.1)] text-blue-800 border-blue-200',
  'הצעה מוכנה ממתינה לאישור': 'bg-[rgba(96,165,250,0.1)] text-blue-800 border-blue-200',
  'נשלחה': 'bg-[rgba(74,222,128,0.1)] text-green-800 border-green-200',
  'אושרה': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'נדחתה': 'bg-[rgba(248,113,113,0.1)] text-red-800 border-red-200'
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
    <div className="p-4 md:p-8 bg-[#1a1a2e] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#f0f0f0]">הצעות מחיר</h1>
            <p className="text-[#a0a0b8] mt-1">ניהול וטיפול בכל ההצעות במערכת</p>
          </div>
          <Button
            className="bg-[#D4A843] hover:bg-[#B8922E] shadow-lg"
            onClick={handleNewQuoteClick}
          >
            <Plus className="w-4 h-4 ml-2" />
            הצעת מחיר חדשה
          </Button>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader>
             <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6b6b80] w-4 h-4" />
              <Input
                placeholder="חיפוש לפי שם לקוח, מספר הצעה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-right w-full md:w-1/3"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#1a1a2e]">
                      <TableHead className="text-right font-semibold">מספר הצעה</TableHead>
                      <TableHead className="text-right font-semibold">לקוח</TableHead>
                      <TableHead className="text-right font-semibold">סכום</TableHead>
                      <TableHead className="text-right font-semibold">תאריך</TableHead>
                      <TableHead className="text-center font-semibold">סטטוס</TableHead>
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
                        <TableRow key={quote.id} className="hover:bg-[#1a1a2e] cursor-pointer" onClick={() => handleRowClick(quote)}>
                          <TableCell className="font-medium text-[#60a5fa]">{quote.quote_number}</TableCell>
                          <TableCell className="text-[#f0f0f0]">{quote.client_name}</TableCell>
                          <TableCell className="text-[#f0f0f0]">₪{quote.total?.toLocaleString()}</TableCell>
                          <TableCell className="text-[#a0a0b8]">{format(new Date(quote.created_date), 'dd/MM/yyyy', { locale: he })}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${statusColors[quote.status] || 'bg-gray-200'} text-xs`}>
                              {quote.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                 { !isLoading && filteredQuotes.length === 0 && (
                    <div className="text-center p-8 text-[#a0a0b8]">
                        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <p>לא נמצאו הצעות מחיר</p>
                    </div>
                 )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
