import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

const ALL_RESPONSIBLES = ["יניר", "שי", "חיה", "דבורה", "רבקה", "יהודה"];

export default function TaskFilters({ onFilterChange, users = [], creators = [] }) {
  // Ensure all possible responsibles are in the list
  const allPossibleUsers = [...new Set([...users, ...ALL_RESPONSIBLES])].sort();
  const allPossibleCreators = [...new Set([...creators, ...ALL_RESPONSIBLES])].sort();

  const handleFilter = (name, value) => {
    onFilterChange(name, value === 'all' ? null : value);
  };

  return (
    <div className="p-4 mb-6 rounded-xl" dir="rtl" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <Filter className="w-4 h-4" />
                    סינון לפי אחראי
                </label>
                <Select onValueChange={(value) => handleFilter('assigned_to', value)}>
                    <SelectTrigger style={{ background: 'var(--dark)', borderColor: 'var(--dark-border)', color: 'var(--text-primary)' }}>
                        <SelectValue placeholder="כל האחראים" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">כל האחראים</SelectItem>
                        {allPossibleUsers.map(user => <SelectItem key={user} value={user}>{user}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <Filter className="w-4 h-4" />
                    סינון לפי נותן המשימה
                </label>
                <Select onValueChange={(value) => handleFilter('creator', value)}>
                    <SelectTrigger style={{ background: 'var(--dark)', borderColor: 'var(--dark-border)', color: 'var(--text-primary)' }}>
                        <SelectValue placeholder="כל היוצרים" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">כל היוצרים</SelectItem>
                        {allPossibleCreators.map(creator => <SelectItem key={creator} value={creator}>{creator}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
    </div>
  );
}
