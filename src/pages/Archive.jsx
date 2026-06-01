import React, { useState, useEffect, useMemo } from 'react';
import { Project, Quote, Lead } from '@/entities';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archive, RotateCcw, Search, FolderOpen, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ArchivePage() {
    const [projects, setProjects] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const navigate = useNavigate();

    const loadData = async () => {
        setLoading(true);
        try {
            const [allProjects, allQuotes, allLeads] = await Promise.all([
                Project.list(),
                Quote.list(),
                Lead.list(),
            ]);
            setProjects(allProjects.filter(p => p.is_archived));
            setQuotes(allQuotes.filter(q => q.is_archived));
            setLeads(allLeads.filter(l => l.is_archived));
        } catch (e) {
            console.error(e);
            toast.error('שגיאה בטעינת ארכיון');
        }
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleRestore = async (type, id, name) => {
        if (!confirm(`לשחזר "${name}" מהארכיון?`)) return;
        try {
            if (type === 'project') await Project.update(id, { is_archived: false });
            else if (type === 'quote') await Quote.update(id, { is_archived: false });
            else if (type === 'lead') await Lead.update(id, { is_archived: false });
            toast.success(`"${name}" שוחזר מהארכיון`);
            loadData();
        } catch (e) {
            toast.error('שגיאה בשחזור');
        }
    };

    const filtered = useMemo(() => {
        const term = searchTerm.toLowerCase();
        const items = [];

        if (activeTab === 'all' || activeTab === 'projects') {
            projects.forEach(p => {
                if (!term || (p.name || '').toLowerCase().includes(term) || (p.client_name || '').toLowerCase().includes(term)) {
                    items.push({ type: 'project', id: p.id, name: p.name, sub: p.client_name, status: p.status, date: p.start_date || p.created_date, icon: FolderOpen, color: '#8b5cf6' });
                }
            });
        }
        if (activeTab === 'all' || activeTab === 'quotes') {
            quotes.forEach(q => {
                if (!term || (q.title || '').toLowerCase().includes(term) || (q.client_name || '').toLowerCase().includes(term)) {
                    items.push({ type: 'quote', id: q.id, name: q.title || q.client_name, sub: q.quote_number, status: q.status, date: q.created_date, icon: FileText, color: '#D4A843' });
                }
            });
        }
        if (activeTab === 'all' || activeTab === 'leads') {
            leads.forEach(l => {
                if (!term || (l.name || '').toLowerCase().includes(term)) {
                    items.push({ type: 'lead', id: l.id, name: l.name, sub: l.phone, status: l.status, date: l.created_date, icon: Users, color: '#22c55e' });
                }
            });
        }

        return items;
    }, [projects, quotes, leads, searchTerm, activeTab]);

    const typeLabel = { project: 'פרויקט', quote: 'הצעת מחיר', lead: 'ליד' };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><p className="text-gray-500">טוען ארכיון...</p></div>;
    }

    const totalCount = projects.length + quotes.length + leads.length;

    return (
        <div className="space-y-6 p-6" dir="rtl">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800">
                    <Archive className="w-7 h-7 text-gray-500" />
                    ארכיון
                </h1>
                <span className="text-sm text-gray-500">{totalCount} פריטים בארכיון</span>
            </div>

            {/* פילטרים */}
            <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <Search className="w-4 h-4 text-gray-400" />
                            <Input placeholder="חיפוש..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white" />
                        </div>
                        <div className="flex gap-2">
                            {[
                                { key: 'all', label: `הכל (${totalCount})` },
                                { key: 'projects', label: `פרויקטים (${projects.length})` },
                                { key: 'quotes', label: `הצעות (${quotes.length})` },
                                { key: 'leads', label: `לידים (${leads.length})` },
                            ].map(tab => (
                                <Button key={tab.key} variant={activeTab === tab.key ? 'default' : 'outline'} size="sm"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={activeTab === tab.key ? 'bg-gray-600' : ''}>
                                    {tab.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* רשימה */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Archive className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>הארכיון ריק</p>
                </div>
            ) : (
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-0">
                        {filtered.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-slate-50 transition-colors">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}15` }}>
                                        <Icon size={20} style={{ color: item.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                                        if (item.type === 'project') navigate(createPageUrl(`ProjectDetails?id=${item.id}`));
                                        else if (item.type === 'quote') navigate(createPageUrl(`QuoteDetails?id=${item.id}`));
                                        else if (item.type === 'lead') navigate(createPageUrl('Leads'));
                                    }}>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-800">{item.name || '—'}</span>
                                            <Badge variant="outline" className="text-xs">{typeLabel[item.type]}</Badge>
                                        </div>
                                        <div className="text-sm text-gray-500 flex gap-3 mt-1">
                                            {item.sub && <span>{item.sub}</span>}
                                            {item.status && <span>סטטוס: {item.status}</span>}
                                            {item.date && <span>{(() => { try { return format(new Date(item.date), 'dd/MM/yy', { locale: he }); } catch { return ''; } })()}</span>}
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleRestore(item.type, item.id, item.name)} className="flex items-center gap-1">
                                        <RotateCcw size={14} />
                                        שחזר
                                    </Button>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
