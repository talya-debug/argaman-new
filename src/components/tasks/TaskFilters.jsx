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
    <div className="p-4 mb-6 bg-[#1a1d27] rounded-xl shadow-md border border-[#2d3348]" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    סינון לפי אחראי
                </label>
                <Select onValueChange={(value) => handleFilter('assigned_to', value)}>
                    <SelectTrigger className="bg-[#252836] border-[#2d3348] text-slate-200">
                        <SelectValue placeholder="כל האחראים" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">כל האחראים</SelectItem>
                        {allPossibleUsers.map(user => <SelectItem key={user} value={user}>{user}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    סינון לפי נותן המשימה
                </label>
                <Select onValueChange={(value) => handleFilter('creator', value)}>
                    <SelectTrigger className="bg-[#252836] border-[#2d3348] text-slate-200">
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
