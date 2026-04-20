import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";

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

const RESPONSIBLES = ["יניר", "שי", "חיה", "דבורה", "רבקה", "יהודה"];

export default function LeadFilters({ onFilterChange, leads }) {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    responsible: 'all'
  });

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="mb-6 rounded-xl p-4" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <Input
            placeholder="חיפוש לפי שם, טלפון או מייל..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pr-10 text-right"
            style={{ background: 'var(--dark)', border: '1px solid var(--dark-border)', color: 'var(--text-primary)' }}
          />
        </div>

        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-48 text-right" style={{ background: 'var(--dark)', border: '1px solid var(--dark-border)', color: 'var(--text-secondary)' }}>
                <SelectValue placeholder="כל הסטטוסים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={filters.responsible} onValueChange={(value) => handleFilterChange('responsible', value)}>
            <SelectTrigger className="w-32 text-right" style={{ background: 'var(--dark)', border: '1px solid var(--dark-border)', color: 'var(--text-secondary)' }}>
              <SelectValue placeholder="כל האחראים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל האחראים</SelectItem>
              {RESPONSIBLES.map((responsible) => (
                <SelectItem key={responsible} value={responsible}>
                  {responsible}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
