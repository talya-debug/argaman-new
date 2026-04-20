import React, { useState, useEffect } from 'react';
import { Project, WorkLogEntry } from '@/entities';
import { uploadFile } from '@/api/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, X, Save } from 'lucide-react';
import SignaturePad from '../components/ui/SignaturePad';

const dataURLtoFile = (dataurl, filename) => {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

export default function WorkLogForm() {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [workDescription, setWorkDescription] = useState('');
    const [numberOfWorkers, setNumberOfWorkers] = useState(1);
    const [workingHours, setWorkingHours] = useState(9);
    const [totalHours, setTotalHours] = useState(9);
    const [issuesOrShortages, setIssuesOrShortages] = useState('');
    const [imageFiles, setImageFiles] = useState([]);
    const [signatureData, setSignatureData] = useState(null);
    const [signerName, setSignerName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessScreen, setShowSuccessScreen] = useState(false);
    const [savedProjectName, setSavedProjectName] = useState('');

    useEffect(() => {
        const fetchProjects = async () => {
            const activeProjects = await Project.filter({ status: { "$in": ["בביצוע", "בתכנון"] } });
            setProjects(activeProjects);
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        setTotalHours(numberOfWorkers * workingHours);
    }, [numberOfWorkers, workingHours]);

    const handleImageChange = (e) => {
        setImageFiles([...imageFiles, ...e.target.files]);
    };

    const removeImage = (index) => {
        setImageFiles(imageFiles.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProject || !workDescription) {
            toast.error("נא למלא פרויקט ותיאור עבודה.");
            return;
        }

        setIsSubmitting(true);
        try {
            const imageUrls = await Promise.all(
                imageFiles.map(file => uploadFile(file, 'worklog').then(res => res.url))
            );

            let signatureUrl = null;
            if (signatureData) {
                const signatureFile = dataURLtoFile(signatureData, `signature-${Date.now()}.png`);
                const sigResult = await uploadFile(signatureFile, 'signatures');
                signatureUrl = sigResult.url;
            }

            await WorkLogEntry.create({
                project_id: selectedProject,
                work_description: workDescription,
                number_of_workers: Number(numberOfWorkers),
                working_hours: Number(workingHours),
                total_hours: totalHours,
                issues_or_shortages: issuesOrShortages,
                image_urls: imageUrls,
                client_signature_url: signatureUrl,
                client_signer_name: signerName
            });

            // Save project name and show success screen
            const projectName = projects.find(p => p.id === selectedProject)?.name || 'הפרויקט';
            setSavedProjectName(projectName);
            setShowSuccessScreen(true);

            // Reset form after a delay
            setTimeout(() => {
                setSelectedProject('');
                setWorkDescription('');
                setNumberOfWorkers(1);
                setWorkingHours(9);
                setIssuesOrShortages('');
                setImageFiles([]);
                setSignatureData(null);
                setSignerName('');
                setShowSuccessScreen(false);
            }, 5000);

        } catch (error) {
            console.error("Failed to submit work log:", error);
            toast.error("שגיאה בשליחת הדיווח.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showSuccessScreen) {
        return (
            <div className="p-4 md:p-8 bg-slate-50 min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-3xl shadow-2xl bg-white border-4 border-green-500" dir="rtl">
                    <CardHeader className="text-center bg-green-50 border-b-4 border-green-500">
                        <div className="mx-auto mb-4 w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                            <Save className="w-10 h-10 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-green-800">תודה!</CardTitle>
                        <CardDescription className="text-lg text-slate-700 mt-2">הפרטים נשמרו בהצלחה</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-6">
                        <div className="text-center space-y-4">
                            <p className="text-2xl font-bold text-slate-800">
                                אנא דאג למלא יומן עבודה גם מחר
                            </p>

                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-3">
                                <h3 className="font-bold text-lg text-blue-800">סיכום הדיווח:</h3>
                                <div className="text-right space-y-2">
                                    <p className="text-slate-700"><span className="font-semibold">פרויקט:</span> {savedProjectName}</p>
                                    <p className="text-slate-700"><span className="font-semibold">תאריך:</span> {new Date().toLocaleDateString('he-IL')}</p>
                                    <p className="text-slate-700"><span className="font-semibold">עובדים:</span> {numberOfWorkers}</p>
                                    <p className="text-slate-700"><span className="font-semibold">סה"כ שעות:</span> {totalHours}</p>
                                </div>
                            </div>

                            {(imageFiles.length > 0 || signatureData) && (
                                <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-6 space-y-4">
                                    {imageFiles.length > 0 && (
                                        <div>
                                            <p className="font-semibold text-slate-800 mb-3">תמונות שצורפו ({imageFiles.length}):</p>
                                            <div className="flex flex-wrap gap-3 justify-center">
                                                {imageFiles.slice(0, 4).map((file, index) => (
                                                    <img
                                                        key={index}
                                                        src={URL.createObjectURL(file)}
                                                        alt={`תמונה ${index + 1}`}
                                                        className="h-24 w-24 object-cover rounded-lg border-2 border-slate-300 shadow-md"
                                                    />
                                                ))}
                                                {imageFiles.length > 4 && (
                                                    <div className="h-24 w-24 bg-slate-300 rounded-lg border-2 border-slate-300 flex items-center justify-center text-lg font-bold text-slate-600">
                                                        +{imageFiles.length - 4}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {signatureData && (
                                        <div>
                                            <p className="font-semibold text-slate-800 mb-3">חתימת לקוח:</p>
                                            <div className="flex justify-center">
                                                <img
                                                    src={signatureData}
                                                    alt="חתימה"
                                                    className="max-h-32 border-2 border-slate-300 rounded-lg shadow-md bg-white p-2"
                                                />
                                            </div>
                                            {signerName && (
                                                <p className="text-sm text-slate-600 mt-2">חותם: {signerName}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="text-sm text-slate-500 mt-6">
                                חוזרים לטופס אוטומטית בעוד מספר שניות...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-50 py-6 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="border-b p-6 text-center bg-white">
                        <h1 className="text-2xl font-bold text-slate-800">דיווח יומן עבודה יומי</h1>
                        <p className="text-slate-500 mt-1">מלא את פרטי העבודה שבוצעה היום בפרויקט.</p>
                    </div>
                    <div className="px-6 py-6">
                        <form id="worklog-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="project" className="font-semibold">שייך לפרויקט *</Label>
                            <Select value={selectedProject} onValueChange={setSelectedProject} required>
                                <SelectTrigger id="project"><SelectValue placeholder="בחר פרויקט מהרשימה..." /></SelectTrigger>
                                <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="workers" className="font-semibold">מספר עובדים</Label>
                                <Input id="workers" type="number" value={numberOfWorkers} onChange={(e) => setNumberOfWorkers(Number(e.target.value))} min="1" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="hours" className="font-semibold">שעות עבודה</Label>
                                <Input id="hours" type="number" value={workingHours} onChange={(e) => setWorkingHours(Number(e.target.value))} min="1" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">סה"כ שעות</Label>
                                <div className="h-10 flex items-center justify-center bg-slate-100 rounded-md border text-lg font-bold text-slate-700">{totalHours}</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="font-semibold">מה בוצע היום? *</Label>
                            <Textarea id="description" value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} placeholder="פרט את העבודות שבוצעו, כולל מיקומים..." required rows={5} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="issues" className="font-semibold">תקלות / חוסרים</Label>
                            <Textarea id="issues" value={issuesOrShortages} onChange={(e) => setIssuesOrShortages(e.target.value)} placeholder="פרט כל בעיה, עיכוב או נושא שדורש התייחסות..." rows={3} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="images" className="font-semibold">העלה תמונות</Label>
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="images-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-4 text-slate-500"/>
                                            <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">לחץ להעלאה</span> או גרור לכאן</p>
                                        </div>
                                        <input id="images-upload" type="file" multiple className="hidden" onChange={handleImageChange} />
                                    </label>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {imageFiles.map((file, index) => (
                                        <div key={index} className="relative">
                                            <img src={URL.createObjectURL(file)} alt="preview" className="h-16 w-16 object-cover rounded-md" />
                                            <button type="button" onClick={() => removeImage(index)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signerName" className="font-semibold">שם החותם</Label>
                                    <Input
                                        id="signerName"
                                        value={signerName}
                                        onChange={(e) => setSignerName(e.target.value)}
                                        placeholder="שם מלא של החותם..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signature" className="font-semibold">חתימת לקוח</Label>
                                    <SignaturePad onSave={setSignatureData} />
                                </div>
                            </div>
                        </div>

                        </form>
                    </div>
                    <div className="border-t bg-white p-6">
                        <Button type="submit" form="worklog-form" className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6" disabled={isSubmitting}>
                            <Save className="w-5 h-5 ml-2" />
                            {isSubmitting ? 'שולח דיווח...' : 'שלח דיווח יומן עבודה'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
