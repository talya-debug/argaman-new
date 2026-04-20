
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
  'בתכנון': 'bg-blue-100 text-blue-800',
  'בביצוע': 'bg-yellow-100 text-yellow-800',
  'הושלם': 'bg-green-100 text-green-800',
  'בוטל': 'bg-red-100 text-red-800',
};

const ProjectCard = ({ project, onClick }) => (
    <Card
        className="shadow-lg border-0 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
        onClick={() => onClick(project.id)}
    >
        <CardHeader>
            <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-bold text-slate-800">{project.name}</CardTitle>
                <FolderOpen className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm text-slate-500">{project.client_name}</p>
        </CardHeader>
        <CardContent>
            <div className="flex justify-between items-center text-sm">
                <Badge className={statusColors[project.status] || 'bg-gray-200'}>{project.status}</Badge>
                <span className="text-slate-400">
                    התחלה: {project.start_date ? format(new Date(project.start_date), 'dd/MM/yy', { locale: he }) : 'N/A'}
                </span>
            </div>
        </CardContent>
    </Card>
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
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">ניהול פרויקטים</h1>
            <p className="text-slate-500 mt-1">מעקב וניהול כל הפרויקטים הפעילים וההיסטוריים</p>
          </div>
          <Button onClick={handleNewProject} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
            <Plus className="w-4 h-4 ml-2" />
            פרויקט חדש מהצעה מאושרת
          </Button>
        </div>

        <Tabs defaultValue="active">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">פרויקטים פעילים ({activeProjects.length})</TabsTrigger>
                <TabsTrigger value="archived">ארכיון ({archivedProjects.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {isLoading ? (
                        Array.from({ length: 6 }).map((_, index) => (
                            <Card key={index} className="shadow-lg border-0 p-4 space-y-4"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-5 w-1/4" /></Card>
                        ))
                    ) : (
                        activeProjects.map(project => <ProjectCard key={project.id} project={project} onClick={handleProjectClick} />)
                    )}
                 </div>
                 { !isLoading && activeProjects.length === 0 && (
                     <Card className="shadow-lg border-0"><CardContent className="p-12 text-center"><p className="text-slate-500">אין פרויקטים פעילים.</p></CardContent></Card>
                 )}
            </TabsContent>
            <TabsContent value="archived" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, index) => (
                            <Card key={index} className="shadow-lg border-0 p-4 space-y-4"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-5 w-1/4" /></Card>
                        ))
                    ) : (
                        archivedProjects.map(project => <ProjectCard key={project.id} project={project} onClick={handleProjectClick} />)
                    )}
                 </div>
                 { !isLoading && archivedProjects.length === 0 && (
                     <Card className="shadow-lg border-0"><CardContent className="p-12 text-center"><p className="text-slate-500">אין פרויקטים בארכיון.</p></CardContent></Card>
                 )}
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
