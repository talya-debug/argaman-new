import React, { useState, useEffect } from 'react';
import { Project, WorkLogEntry } from '@/entities';
import { uploadFile } from '@/api/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, X, Save, CheckCircle } from 'lucide-react';
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
                imageFiles.map(file => uploadFile(file).then(res => res.url))
            );

            let signatureUrl = null;
            if (signatureData) {
                const signatureFile = dataURLtoFile(signatureData, `signature-${Date.now()}.png`);
                const sigResult = await uploadFile(signatureFile);
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

            const projectName = projects.find(p => p.id === selectedProject)?.name || 'הפרויקט';
            setSavedProjectName(projectName);
            setShowSuccessScreen(true);

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

    const cardStyle = {
        background: 'var(--dark-card)',
        border: '1px solid var(--dark-border)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    };

    const labelStyle = { color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, display: 'block', marginBottom: 6 };
    const inputWrapStyle = { display: 'flex', flexDirection: 'column', gap: 4 };

    if (showSuccessScreen) {
        return (
            <div style={{ padding: 24, minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ ...cardStyle, maxWidth: 600, width: '100%', textAlign: 'center', padding: 48 }} dir="rtl">
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#22c55e18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <CheckCircle size={36} style={{ color: '#22c55e' }} />
                    </div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>תודה!</h2>
                    <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: '0 0 24px' }}>הפרטים נשמרו בהצלחה</p>

                    <div style={{ background: 'var(--dark)', borderRadius: 12, padding: 20, textAlign: 'right' }}>
                        <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>פרויקט:</strong> {savedProjectName}</p>
                        <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>תאריך:</strong> {new Date().toLocaleDateString('he-IL')}</p>
                        <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>עובדים:</strong> {numberOfWorkers}</p>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>סה"כ שעות:</strong> {totalHours}</p>
                    </div>

                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 24 }}>חוזרים לטופס אוטומטית בעוד מספר שניות...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px 16px', minHeight: '100vh', background: 'var(--dark)' }}>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                <div style={cardStyle} dir="rtl">
                    {/* כותרת */}
                    <div style={{ background: 'var(--argaman)', padding: '24px 32px', textAlign: 'center' }}>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>דיווח יומן עבודה יומי</h1>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }}>מלא את פרטי העבודה שבוצעה היום בפרויקט</p>
                    </div>

                    {/* טופס */}
                    <div style={{ padding: '32px 32px 16px' }}>
                        <form id="worklog-form" onSubmit={handleSubmit}>
                            <div style={inputWrapStyle}>
                                <label style={labelStyle}>שייך לפרויקט *</label>
                                <Select value={selectedProject} onValueChange={setSelectedProject}>
                                    <SelectTrigger><SelectValue placeholder="בחר פרויקט מהרשימה..." /></SelectTrigger>
                                    <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
                                <div style={inputWrapStyle}>
                                    <label style={labelStyle}>מספר עובדים</label>
                                    <Input type="number" value={numberOfWorkers} onChange={(e) => setNumberOfWorkers(Number(e.target.value))} min="1" />
                                </div>
                                <div style={inputWrapStyle}>
                                    <label style={labelStyle}>שעות עבודה</label>
                                    <Input type="number" value={workingHours} onChange={(e) => setWorkingHours(Number(e.target.value))} min="1" />
                                </div>
                                <div style={inputWrapStyle}>
                                    <label style={labelStyle}>סה"כ שעות</label>
                                    <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)', borderRadius: 8, border: '1px solid var(--dark-border)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{totalHours}</div>
                                </div>
                            </div>

                            <div style={{ ...inputWrapStyle, marginTop: 20 }}>
                                <label style={labelStyle}>מה בוצע היום? *</label>
                                <Textarea value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} placeholder="פרט את העבודות שבוצעו, כולל מיקומים..." required rows={5} />
                            </div>

                            <div style={{ ...inputWrapStyle, marginTop: 20 }}>
                                <label style={labelStyle}>תקלות / חוסרים</label>
                                <Textarea value={issuesOrShortages} onChange={(e) => setIssuesOrShortages(e.target.value)} placeholder="פרט כל בעיה, עיכוב או נושא שדורש התייחסות..." rows={3} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                                <div style={inputWrapStyle}>
                                    <label style={labelStyle}>העלה תמונות</label>
                                    <label htmlFor="images-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120, border: '2px dashed var(--dark-border)', borderRadius: 10, cursor: 'pointer', background: 'var(--dark)', transition: 'border-color 0.15s' }}>
                                        <Upload size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>לחץ להעלאה</span>
                                        <input id="images-upload" type="file" multiple style={{ display: 'none' }} onChange={handleImageChange} />
                                    </label>
                                    {imageFiles.length > 0 && (
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                                            {imageFiles.map((file, index) => (
                                                <div key={index} style={{ position: 'relative' }}>
                                                    <img src={URL.createObjectURL(file)} alt="preview" style={{ height: 56, width: 56, objectFit: 'cover', borderRadius: 8 }} />
                                                    <button type="button" onClick={() => removeImage(index)} style={{ position: 'absolute', top: -6, right: -6, background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={inputWrapStyle}>
                                        <label style={labelStyle}>שם החותם</label>
                                        <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="שם מלא של החותם..." />
                                    </div>
                                    <div style={inputWrapStyle}>
                                        <label style={labelStyle}>חתימת לקוח</label>
                                        <SignaturePad onSave={setSignatureData} />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* כפתור שליחה */}
                    <div style={{ padding: '16px 32px 32px' }}>
                        <Button type="submit" form="worklog-form" disabled={isSubmitting} style={{ width: '100%', height: 48, fontSize: 16, background: 'var(--argaman)', color: '#fff' }}>
                            <Save size={18} style={{ marginLeft: 8 }} />
                            {isSubmitting ? 'שולח דיווח...' : 'שלח דיווח יומן עבודה'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
