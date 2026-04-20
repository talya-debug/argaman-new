import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookUser, Plus, User, Clock, Image as ImageIcon, FileSignature, ZoomIn, X } from "lucide-react";
import WorkLogForm from './WorkLogForm';

export default function WorkLog({ projectId, workLogEntries, onWorkLogAdded }) {
    const [showForm, setShowForm] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedSignature, setSelectedSignature] = useState(null);

    const handleWorkLogSubmitted = () => {
        setShowForm(false);
        if (onWorkLogAdded) onWorkLogAdded();
    };

    return (
        <Card className="shadow-lg" dir="rtl">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <BookUser className="w-5 h-5" />
                        יומן עבודה
                    </CardTitle>
                    <Dialog open={showForm} onOpenChange={setShowForm}>
                        <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700">
                                <Plus className="w-4 h-4 ml-2" />
                                הוסף דיווח חדש
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl bg-[#1a1a2e] shadow-xl max-h-[90vh] flex flex-col" dir="rtl">
                            <div className="overflow-y-auto flex-1 min-h-0">
                                <WorkLogForm 
                                    projectId={projectId} 
                                    onSubmit={handleWorkLogSubmitted}
                                    onCancel={() => setShowForm(false)}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {workLogEntries.length === 0 ? (
                    <div className="text-center py-12 text-[#a0a0b8]">
                        <BookUser className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p className="text-lg font-medium mb-2">אין דיווחי עבודה עדיין</p>
                        <p className="text-sm">לחץ על "הוסף דיווח חדש" כדי להתחיל לתעד את העבודה</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#1a1a2e]">
                                    <TableHead className="text-right font-semibold">תיאור עבודה</TableHead>
                                    <TableHead className="text-right font-semibold">מדווח</TableHead>
                                    <TableHead className="text-right font-semibold">תאריך ושעה</TableHead>
                                    <TableHead className="text-right font-semibold">עובדים</TableHead>
                                    <TableHead className="text-right font-semibold">שעות</TableHead>
                                    <TableHead className="text-right font-semibold">סה״כ שעות</TableHead>
                                    <TableHead className="text-right font-semibold">מדיה</TableHead>
                                    <TableHead className="text-right font-semibold">חתימה</TableHead>
                                    <TableHead className="text-right font-semibold">בעיות/תקלות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workLogEntries.map(entry => (
                                    <TableRow key={entry.id} className="hover:bg-slate-25">
                                        <TableCell className="text-right max-w-xs">
                                            <p className="text-sm line-clamp-3 whitespace-pre-wrap">{entry.work_description}</p>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <span className="text-sm font-medium">{entry.created_by}</span>
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${entry.created_by}`} />
                                                    <AvatarFallback className="text-xs">{entry.created_by ? entry.created_by.substring(0, 2) : 'U'}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <div className="text-right">
                                                    <p className="font-medium text-sm">
                                                        {format(new Date(entry.created_date), 'dd/MM/yyyy', { locale: he })}
                                                    </p>
                                                    <p className="text-xs text-[#a0a0b8]">
                                                        {format(new Date(entry.created_date), 'HH:mm', { locale: he })}
                                                    </p>
                                                </div>
                                                <Clock className="w-4 h-4 text-[#6b6b80]" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <span className="font-medium">{entry.number_of_workers}</span>
                                                <User className="w-4 h-4 text-[#6b6b80]" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-medium">{entry.working_hours}h</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="bg-[rgba(96,165,250,0.1)] px-2 py-1 rounded-full w-fit ml-auto">
                                                <span className="font-bold text-blue-800">{entry.total_hours}h</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                           {entry.image_urls && entry.image_urls.length > 0 ? (
                                               <div className="flex items-center justify-end gap-1">
                                                   <div className="flex gap-1 ml-2">
                                                       {entry.image_urls.slice(0, 3).map((url, idx) => {
                                                           const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.MP4') || url.includes('.MOV');
                                                           return (
                                                               <button 
                                                                   key={idx} 
                                                                   onClick={() => setSelectedImage(url)}
                                                                   className="relative group"
                                                               >
                                                                   {isVideo ? (
                                                                       <video 
                                                                           src={url} 
                                                                           className="w-8 h-8 object-cover rounded border hover:scale-110 transition-transform" 
                                                                       />
                                                                   ) : (
                                                                       <img 
                                                                           src={url} 
                                                                           className="w-8 h-8 object-cover rounded border hover:scale-110 transition-transform" 
                                                                           alt={`תמונה ${idx + 1}`} 
                                                                       />
                                                                   )}
                                                                   <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                                                                       <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                   </div>
                                                               </button>
                                                           );
                                                       })}
                                                       {entry.image_urls.length > 3 && (
                                                           <div className="w-8 h-8 bg-slate-200 rounded border flex items-center justify-center text-xs">
                                                               +{entry.image_urls.length - 3}
                                                           </div>
                                                       )}
                                                   </div>
                                                   <span className="text-sm text-[#4ade80] font-medium">{entry.image_urls.length}</span>
                                                   <ImageIcon className="w-4 h-4 text-[#4ade80]" />
                                               </div>
                                           ) : (
                                               <span className="text-[#6b6b80] text-sm">-</span>
                                           )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                           {entry.client_signature_url ? (
                                               <button 
                                                   onClick={() => setSelectedSignature({ url: entry.client_signature_url, name: entry.client_signer_name })}
                                                   className="flex items-center justify-end gap-1 text-[#4ade80] hover:text-[#4ade80] w-full group"
                                               >
                                                   <div className="flex flex-col items-end">
                                                       <span className="text-xs font-medium">{entry.client_signer_name || 'צפה בחתימה'}</span>
                                                       <img 
                                                           src={entry.client_signature_url} 
                                                           className="h-8 w-20 object-contain border rounded bg-[#1a1a2e] mt-1" 
                                                           alt="חתימה" 
                                                       />
                                                   </div>
                                                   <FileSignature className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                               </button>
                                           ) : (
                                               <span className="text-[#6b6b80] text-sm">-</span>
                                           )}
                                        </TableCell>
                                        <TableCell className="text-right max-w-xs">
                                            {entry.issues_or_shortages ? (
                                                <div className="bg-[rgba(248,113,113,0.1)] border border-red-200 rounded p-2">
                                                    <p className="text-sm text-red-800 line-clamp-2 whitespace-pre-wrap">{entry.issues_or_shortages}</p>
                                                </div>
                                            ) : (
                                                <span className="text-[#4ade80] text-sm font-medium">ללא בעיות</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>

            {/* Media Preview Dialog */}
            <Dialog open={selectedImage !== null} onOpenChange={(open) => !open && setSelectedImage(null)}>
                <DialogContent className="max-w-4xl bg-[#1a1a2e]" dir="rtl">
                    <DialogHeader className="relative">
                        <DialogTitle>תצוגת מדיה</DialogTitle>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute left-2 top-2"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-4 bg-[#1a1a2e] rounded-lg">
                        {selectedImage && (() => {
                            const isVideo = selectedImage.includes('.mp4') || selectedImage.includes('.mov') || selectedImage.includes('.MP4') || selectedImage.includes('.MOV');
                            return isVideo ? (
                                <video 
                                    src={selectedImage} 
                                    controls
                                    className="max-w-full max-h-[70vh] rounded-lg shadow-lg" 
                                />
                            ) : (
                                <img 
                                    src={selectedImage} 
                                    alt="תמונה מוגדלת" 
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" 
                                />
                            );
                        })()}
                    </div>
                    <div className="flex justify-center gap-2">
                        <Button onClick={() => setSelectedImage(null)}>סגור</Button>
                        <Button asChild variant="outline">
                            <a href={selectedImage} download target="_blank" rel="noopener noreferrer">
                                הורד
                            </a>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Signature Preview Dialog */}
            <Dialog open={selectedSignature !== null} onOpenChange={(open) => !open && setSelectedSignature(null)}>
                <DialogContent className="max-w-2xl bg-[#1a1a2e]" dir="rtl">
                    <DialogHeader className="relative">
                        <DialogTitle>חתימת לקוח</DialogTitle>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute left-2 top-2"
                            onClick={() => setSelectedSignature(null)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedSignature && (
                            <>
                                {selectedSignature.name && (
                                    <div className="text-center">
                                        <p className="text-sm text-[#a0a0b8]">חותם: <span className="font-bold text-slate-800">{selectedSignature.name}</span></p>
                                    </div>
                                )}
                                <div className="flex items-center justify-center p-6 bg-[#1a1a2e] rounded-lg border-2 border-[rgba(255,255,255,0.08)]">
                                    <img 
                                        src={selectedSignature.url} 
                                        alt="חתימה מוגדלת" 
                                        className="max-w-full max-h-[40vh] object-contain" 
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex justify-center gap-2">
                        <Button onClick={() => setSelectedSignature(null)}>סגור</Button>
                        <Button asChild variant="outline">
                            <a href={selectedSignature?.url} download target="_blank" rel="noopener noreferrer">
                                הורד חתימה
                            </a>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}