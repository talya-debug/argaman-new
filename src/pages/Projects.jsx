
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Project, Quote, User } from "@/entities";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const statusColors = {
  'בתכנון': 'bg-[rgba(96,165,250,0.1)]0/20 text-blue-400 border-blue-500/30',
  'בביצוע': 'bg-[rgba(251,191,36,0.1)]0/20 text-yellow-400 border-yellow-500/30',
  'הושלם': 'bg-[rgba(74,222,128,0.1)]0/20 text-green-400 border-green-500/30',
  'בוטל': 'bg-[rgba(248,113,113,0.1)]0/20 text-red-400 border-red-500/30',
};

const ProjectCard = ({ project, onClick }) => (
    <div
        className="rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-1"
        style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}
        onClick={() => onClick(project.id)}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--argaman-border)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(212, 168, 67, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--dark-border)';
          e.currentTarget.style.boxShadow = 'none';
        }}
    >
        <div className="p-6">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
                <FolderOpen className="w-5 h-5" style={{ color: 'var(--argaman-light)' }} />
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{project.client_name}</p>
            <div className="flex justify-between items-center text-sm">
                <Badge className={`${statusColors[project.status] || 'bg-[#141428]0/20 text-gray-400'} border`}>{project.status}</Badge>
                <span style={{ color: 'var(--text-muted)' }}>
                    התחלה: {project.start_date ? format(new Date(project.start_date), 'dd/MM/yy', { locale: he }) : 'N/A'}
                </span>
            </div>
        </div>
    </div>
);

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      await User.me();
      const allProjects = await Project.list('-created_date');

      // Auto-archive completed projects
      for (const project of allProjects) {
        if (project.status === 'הושלם' && !project.is_archived) {
          await Project.update(project.id, { is_archived: true });
          project.is_archived = true;
        }
      }
      setProjects(allProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error("שגיאה בטעינת פרויקטים");
    }
    setIsLoading(false);
  };

  const handleProjectClick = (projectId) => {
    navigate(createPageUrl(`ProjectDetails?id=${projectId}`));
  };

  const handleNewProject = async () => {
    try {
        const quotes = await Quote.filter({status: 'אושרה'});
        if (quotes.length === 0) {
            toast.info("אין הצעות מאושרות ליצירת פרויקט חדש.");
            return;
        }

        const latestApprovedQuote = quotes.sort((a,b) => new Date(b.updated_date) - new Date(a.updated_date))[0];

        const newProject = await Project.create({
            name: `פרויקט - ${latestApprovedQuote.client_name}`,
            client_name: latestApprovedQuote.client_name,
            lead_id: latestApprovedQuote.lead_id,
            quote_id: latestApprovedQuote.id,
            status: 'בתכנון',
            start_date: new Date().toISOString().split('T')[0],
            responsible: latestApprovedQuote.responsible,
            description: `פרויקט שנוצר מהצעת מחיר: ${latestApprovedQuote.title}`,
            deduction_insurance_percentage: 0,
            deduction_retention_percentage: 0,
            deduction_lab_tests_percentage: 0
        });

        navigate(createPageUrl(`ProjectDetails?id=${newProject.id}`));

    } catch (error) {
        console.error("Error creating new project:", error);
        toast.error("שגיאה ביצירת פרויקט חדש");
    }
  };

  const activeProjects = projects.filter(p => !p.is_archived);
  const archivedProjects = projects.filter(p => p.is_archived);

  return (
    <div className="p-4 md:p-8 min-h-screen animate-in" style={{ background: 'var(--dark)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>ניהול פרויקטים</h1>
            <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>מעקב וניהול כל הפרויקטים הפעילים וההיסטוריים</p>
          </div>
          <button onClick={handleNewProject} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            פרויקט חדש מהצעה מאושרת
          </button>
        </div>

        <Tabs defaultValue="active">
            <TabsList className="grid w-full grid-cols-2" style={{ background: 'var(--dark-card)' }}>
                <TabsTrigger value="active" className="data-[state=active]:text-white" style={{ '--tw-bg-opacity': 1 }}>פרויקטים פעילים ({activeProjects.length})</TabsTrigger>
                <TabsTrigger value="archived" className="data-[state=active]:text-white">ארכיון ({archivedProjects.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                     {isLoading ? (
                        Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="rounded-xl p-4 space-y-4" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
                              <Skeleton className="h-6 w-3/4" style={{ background: 'var(--dark-border)' }} />
                              <Skeleton className="h-4 w-1/2" style={{ background: 'var(--dark-border)' }} />
                              <Skeleton className="h-5 w-1/4" style={{ background: 'var(--dark-border)' }} />
                            </div>
                        ))
                    ) : (
                        activeProjects.map(project => <ProjectCard key={project.id} project={project} onClick={handleProjectClick} />)
                    )}
                 </div>
                 { !isLoading && activeProjects.length === 0 && (
                     <div className="rounded-xl p-12 text-center" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
                       <p style={{ color: 'var(--text-secondary)' }}>אין פרויקטים פעילים.</p>
                     </div>
                 )}
            </TabsContent>
            <TabsContent value="archived" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="rounded-xl p-4 space-y-4" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
                              <Skeleton className="h-6 w-3/4" style={{ background: 'var(--dark-border)' }} />
                              <Skeleton className="h-4 w-1/2" style={{ background: 'var(--dark-border)' }} />
                              <Skeleton className="h-5 w-1/4" style={{ background: 'var(--dark-border)' }} />
                            </div>
                        ))
                    ) : (
                        archivedProjects.map(project => <ProjectCard key={project.id} project={project} onClick={handleProjectClick} />)
                    )}
                 </div>
                 { !isLoading && archivedProjects.length === 0 && (
                     <div className="rounded-xl p-12 text-center" style={{ background: 'var(--dark-card)', border: '1px solid var(--dark-border)' }}>
                       <p style={{ color: 'var(--text-secondary)' }}>אין פרויקטים בארכיון.</p>
                     </div>
                 )}
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
