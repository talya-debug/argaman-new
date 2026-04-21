import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Project, Quote, QuoteLine, WorkLogEntry, PurchaseRecord, SubContractor, CollectionTask, ProgressEntry, Task } from '@/entities';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, FileSpreadsheet, ShoppingBasket, BookUser } from 'lucide-react';
import BillOfQuantities from '../components/projects/BillOfQuantities';
import ProcurementManagement from '../components/projects/ProcurementManagement';
import WorkLog from '../components/projects/WorkLog';
import ProjectDashboard from '../components/projects/ProjectDashboard';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function ProjectDetails() {
    const { search } = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(search);
    const projectId = queryParams.get('id');

    const [project, setProject] = useState(null);
    const [quote, setQuote] = useState(null);
    const [quoteLines, setQuoteLines] = useState([]);
    const [progressEntries, setProgressEntries] = useState([]);
    const [workLogEntries, setWorkLogEntries] = useState([]);
    const [purchaseRecords, setPurchaseRecords] = useState([]);
    const [subContractors, setSubContractors] = useState([]);
    const [collectionTasks, setCollectionTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');

    const loadProjectDetails = useCallback(async (forceReload = false) => {
        if (!projectId) {
            toast.error("לא נמצא מזהה פרויקט.");
            setIsLoading(false);
            return;
        }
        if (!forceReload) setIsLoading(true);
        try {
            const currentProject = await Project.get(projectId);
            setProject(currentProject);

            const [logs, purchases, subContractorsData, collectionTasksData, quoteLinesData] = await Promise.all([
                WorkLogEntry.filter({ project_id: projectId }),
                PurchaseRecord.filter({ project_id: projectId }),
                SubContractor.filter({ project_id: projectId }),
                CollectionTask.filter({ project_id: projectId }),
                currentProject.quote_id ? QuoteLine.filter({ quote_id: currentProject.quote_id }, 'order_index', 2000) : Promise.resolve([]),
            ]);
            setWorkLogEntries(logs);
            setPurchaseRecords(purchases);
            setSubContractors(subContractorsData);
            setCollectionTasks(collectionTasksData);
            // Sort quote lines by order_index to preserve order
            const sortedQuoteLines = quoteLinesData.sort((a, b) => {
                const indexA = a.order_index !== undefined ? a.order_index : Infinity;
                const indexB = b.order_index !== undefined ? b.order_index : Infinity;
                return indexA - indexB;
            });
            setQuoteLines(sortedQuoteLines);

            if (currentProject && currentProject.quote_id) {
                try {
                    const currentQuote = await Quote.get(currentProject.quote_id);
                    setQuote(currentQuote);
                } catch (quoteError) {
                    console.warn(`Could not load quote with ID ${currentProject.quote_id}. It might have been deleted.`, quoteError);
                    toast.warning("לא ניתן היה לטעון את הצעת המחיר המשויכת לפרויקט זה.");
                    setQuote(null);
                }

                if (quoteLinesData.length > 0) {
                    // Fetch by project_id to avoid $in with many IDs
                    let allProgress = [];
                    let pgSkip = 0;
                    while (true) {
                        const pgBatch = await ProgressEntry.filter({ project_id: projectId }, '-entry_date', 200, pgSkip);
                        allProgress = allProgress.concat(pgBatch);
                        if (pgBatch.length < 200) break;
                        pgSkip += 200;
                    }
                    setProgressEntries(allProgress);
                }
            } else {
                setQuote(null); // Explicitly set quote to null if no quote_id exists for the project
            }
        } catch (error) {
            console.error("Error loading project data:", error);
            toast.error("שגיאה בטעינת נתוני הפרויקט.");
        } finally {
            if (!forceReload) setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadProjectDetails();
    }, [loadProjectDetails]);

    const handleDataChange = async () => {
        await loadProjectDetails(true);
    };

    const handleUpdateProjectDetails = async (details) => {
        if (!project || !project.id) return;

        try {
            const oldStatus = project.status;
            await Project.update(project.id, details);

            if (details.status && details.status !== oldStatus && details.status === 'הושלם') {
                const completionTasks = [
                    {
                        title: `סגירת פרויקט - ${project.name}`,
                        assigned_to: 'אדמיניסטרציה',
                        source_type: 'project_completion',
                        priority: 'גבוהה',
                        status: 'חדש'
                    },
                    {
                        title: `בדיקת חשבון סופי - ${project.name}`,
                        assigned_to: 'דבורה',
                        source_type: 'project_completion',
                        priority: 'גבוהה',
                        status: 'חדש'
                    },
                ];

                for (const task of completionTasks) {
                    await Task.create({
                        ...task,
                        project_id: project.id,
                        client_name: project.name,
                        source_id: project.id,
                        auto_created: true,
                    });
                }
            }

            toast.success("פרטי הפרויקט עודכנו");
            handleDataChange();
        } catch (error) {
            console.error("Failed to update project details:", error);
            toast.error("שגיאה בעדכון פרטי הפרויקט");
        }
    };

    if (isLoading) {
        return (
            <div className="p-8">
                <Skeleton className="h-10 w-1/2 mb-4" />
                <Skeleton className="h-8 w-1/3 mb-8" />
                <Skeleton className="h-24 w-full mb-4" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!project) {
        return <div className="p-8 text-center text-red-500">הפרויקט לא נמצא.</div>;
    }

    const quoteId = quote ? quote.id : null;

    return (
        <div className="p-4 md:p-8 min-h-screen" dir="rtl" style={{ background: 'var(--dark)' }}>
            <header className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</h1>
                    <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>ניהול מלא של הפרויקט עבור: {project.client_name}</p>
                </div>
                <div>
                    <Select value={project.status} onValueChange={(newStatus) => handleUpdateProjectDetails({ status: newStatus })}>
                        <SelectTrigger className="w-[180px]" style={{ background: 'var(--dark-card)', borderColor: 'var(--dark-border)', color: 'var(--text-primary)' }}>
                            <SelectValue placeholder="שנה סטטוס" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="בתכנון">בתכנון</SelectItem>
                            <SelectItem value="בביצוע">בביצוע</SelectItem>
                            <SelectItem value="הושלם">הושלם</SelectItem>
                            <SelectItem value="בוטל">בוטל</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
                <TabsList className="grid w-full grid-cols-4" style={{ background: 'var(--dark-card)' }}>
                    <TabsTrigger value="dashboard"><LayoutDashboard className="ml-2 h-4 w-4" /> סקירה כללית</TabsTrigger>
                    <TabsTrigger value="boq"><FileSpreadsheet className="ml-2 h-4 w-4" /> כתב כמויות</TabsTrigger>
                    <TabsTrigger value="procurement"><ShoppingBasket className="ml-2 h-4 w-4" /> ניהול רכש</TabsTrigger>
                    <TabsTrigger value="worklog"><BookUser className="ml-2 h-4 w-4" /> יומן עבודה</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard">
                    <ProjectDashboard
                        quoteLines={quoteLines}
                        progressEntries={progressEntries}
                        workLogEntries={workLogEntries}
                        purchaseRecords={purchaseRecords}
                        quote={quote}
                        subContractors={subContractors}
                        collectionTasks={collectionTasks}
                    />
                </TabsContent>

                <TabsContent value="boq">
                    <BillOfQuantities
                        quoteLines={quoteLines}
                        projectId={project.id}
                        project={project}
                        quote={quote}
                        quoteId={quoteId}
                        onUpdateQuoteLine={handleDataChange}
                        progressEntries={progressEntries}
                    />
                </TabsContent>

                <TabsContent value="procurement">
                    <ProcurementManagement
                        key={project.id}
                        quoteLines={quoteLines}
                        purchaseRecords={purchaseRecords}
                        project={project}
                        onUpdateQuoteLine={handleDataChange}
                    />
                </TabsContent>

                <TabsContent value="worklog">
                    <WorkLog
                        projectId={project.id}
                        workLogEntries={workLogEntries}
                        onWorkLogAdded={handleDataChange}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
