import React, { useState } from 'react';
import { WorkLogEntry } from '@/entities';
import { uploadFile } from '@/api/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, X, Save, FileSignature } from 'lucide-react';
import SignaturePadComponent from '../ui/SignaturePad';

const dataURLtoFile = (dataurl, filename) => {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

export default function WorkLogForm({ projectId, onSubmit, onCancel }) {
    const [workDescription, setWorkDescription] = useState('');
    const [numberOfWorkers, setNumberOfWorkers] = useState(1);
    const [workingHours, setWorkingHours] = useState(9); // Default to 9 hours
    const [totalHours, setTotalHours] = useState(9);
    const [issuesOrShortages, setIssuesOrShortages] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [signatureData, setSignatureData] = useState(null);
    const [signerName, setSignerName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    React.useEffect(() => {
        setTotalHours(numberOfWorkers * workingHours);
    }, [numberOfWorkers, workingHours]);
    
    const handleMediaChange = (e) => {
        setMediaFiles([...mediaFiles, ...Array.from(e.target.files)]);
    };

    const removeMedia = (index) => {
        setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!workDescription) {
            toast.error("נא למלא תיאור עבודה.");
            return;
        }
        if (signatureData && !signerName) {
            toast.error("נא למלא את שם החותם.");
            return;
        }

        setIsSubmitting(true);
        try {
            const mediaUrls = await Promise.all(
                mediaFiles.map(file => uploadFile(file).then(res => res))
            );

            let signatureUrl = null;
            if (signatureData) {
                const signatureFile = dataURLtoFile(signatureData, `signature-${Date.now()}.png`);
                const res = await uploadFile(signatureFile);
                signatureUrl = res;
            }

            await WorkLogEntry.create({
                project_id: projectId,
                work_description: workDescription,
                number_of_workers: Number(numberOfWorkers),
                working_hours: Number(workingHours),
                total_hours: totalHours,
                issues_or_shortages: issuesOrShortages,
                image_urls: mediaUrls,
                client_signature_url: signatureUrl,
                client_signer_name: signerName
            });

            toast.success("דיווח יומן עבודה נשלח בהצלחה!");
            if(onSubmit) onSubmit();

        } catch (error) {
            console.error("Failed to submit work log:", error);
            toast.error("שגיאה בשליחת הדיווח.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <>
            <Card className="w-full border-0 shadow-none">
                <CardHeader className="text-center flex-shrink-0">
                    <CardTitle className="text-2xl font-bold text-slate-800">הוספת דיווח עבודה</CardTitle>
                    <CardDescription>מלא את פרטי העבודה שבוצעה היום בפרויקט.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="worklog-form" onSubmit={handleSubmit} className="space-y-6">
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
                            <div className="h-10 flex items-center justify-center bg-[#1e1e36] rounded-md border text-lg font-bold text-[#e0e0e0]">{totalHours}</div>
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

                    <div className="space-y-4">
                        <Label className="font-semibold">הוספת מדיה (תמונה או סרטון)</Label>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="media-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-[#1a1a2e] hover:bg-[#1e1e36]">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-4 text-[#a0a0b8]"/>
                                    <p className="mb-2 text-sm text-[#a0a0b8]"><span className="font-semibold">לחץ להעלאה</span> או גרור לכאן</p>
                                    <p className="text-xs text-[#6b6b80]">תמונות (JPG, PNG, HEIC) או סרטונים (MP4, MOV)</p>
                                </div>
                                <input id="media-upload" type="file" multiple className="hidden" onChange={handleMediaChange} accept="image/*,video/*,.heic"/>
                            </label>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {mediaFiles.map((file, index) => {
                                const isVideo = file.type.startsWith('video/');
                                return (
                                    <div key={index} className="relative">
                                        {isVideo ? (
                                            <video src={URL.createObjectURL(file)} className="h-20 w-20 object-cover rounded-md" />
                                        ) : (
                                            <img src={URL.createObjectURL(file)} alt="preview" className="h-20 w-20 object-cover rounded-md" />
                                        )}
                                        <button type="button" onClick={() => removeMedia(index)} className="absolute -top-1 -right-1 bg-[rgba(248,113,113,0.1)]0 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    <div className="space-y-4 rounded-lg border p-4">
                        <Label className="font-semibold flex items-center gap-2"><FileSignature className="w-5 h-5"/> חתימת לקוח</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="signerName">שם החותם *</Label>
                                <Input id="signerName" value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="שם מלא של הלקוח/נציג" />
                            </div>
                            <div className="space-y-2">
                                <Label>חתימה</Label>
                                <SignaturePadComponent onSave={setSignatureData} />
                            </div>
                        </div>
                    </div>
                    
                    </form>
                </CardContent>
            </Card>
            <div className="flex justify-end gap-3 p-6 bg-[#1a1a2e] border-t flex-shrink-0">
                <Button type="button" variant="outline" onClick={onCancel}>
                    ביטול
                </Button>
                <Button type="submit" form="worklog-form" className="bg-[#c42b2b] hover:bg-[#991b1b]" disabled={isSubmitting}>
                    <Save className="w-5 h-5 ml-2" />
                    {isSubmitting ? 'שולח...' : 'שמור דיווח'}
                </Button>
            </div>
        </>
    )
}