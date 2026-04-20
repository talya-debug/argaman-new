import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Quote, QuoteLine, Lead, PriceItem, User } from '@/entities';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, FileText, Settings, Save, FileDown, Upload } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QuoteBuilder from '../components/quotes/QuoteBuilder';
import QuotePreview from '../components/quotes/QuotePreview';
import ExcelImportDialog from '../components/quotes/ExcelImportDialog';

export default function QuoteDetails() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const quoteId = searchParams.get('id');

    const [quote, setQuote] = useState(null);
    const [lead, setLead] = useState(null);
    const [allPriceItems, setAllPriceItems] = useState([]);
    const [quoteLines, setQuoteLines] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState('build');
    const [showPreview, setShowPreview] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);

    const fetchAllPriceItems = async () => {
        const BATCH_SIZE = 200;
        let allItems = [];
        let page = 0;

        while (true) {
            const items = await PriceItem.list('-created_date', BATCH_SIZE, page * BATCH_SIZE);
            allItems = [...allItems, ...items];
            if (items.length < BATCH_SIZE) break;
            page++;
        }

        return allItems;
    };

    const loadData = useCallback(async (id) => {
        if (!id) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            await User.me();
            const currentQuote = await Quote.get(id);

            // AUTO-FIX VAT TO 18% IF IT'S NOT
            if (currentQuote.vat_percentage !== 18) {
                await Quote.update(id, { vat_percentage: 18 });
                currentQuote.vat_percentage = 18;
            }

            setQuote(currentQuote);

            if (currentQuote.lead_id) {
                try {
                    const currentLead = await Lead.get(currentQuote.lead_id);
                    setLead(currentLead);
                } catch (leadError) {
                    console.warn(`Lead with ID ${currentQuote.lead_id} not found. It may have been deleted.`);
                    setLead(null);
                }
            }

            const allItems = await fetchAllPriceItems();
            setAllPriceItems(allItems);
            const uniqueSuppliers = [...new Set(allItems.map(item => item.supplier_name))];
            setSuppliers(uniqueSuppliers);

            setSelectedSupplier(currentQuote.supplier_name || null);

            let lines = await QuoteLine.filter({ quote_id: id });

            // Sort by order_index if exists, otherwise by created_date
            lines = lines.sort((a, b) => {
                if (a.order_index !== undefined && b.order_index !== undefined) {
                    return a.order_index - b.order_index;
                }
                return new Date(a.created_date) - new Date(b.created_date);
            });

            // Initialize order_index for existing lines that don't have it
            const needsOrderIndex = lines.some(line => line.order_index === undefined);
            if (needsOrderIndex) {
                const updatedLines = lines.map((line, index) => ({
                    ...line,
                    order_index: line.order_index !== undefined ? line.order_index : index
                }));

                // Save order_index for lines that don't have it
                await Promise.all(
                    updatedLines.map(line => {
                        if (line.id && line.order_index !== lines.find(l => l.id === line.id).order_index) {
                            return QuoteLine.update(line.id, { order_index: line.order_index });
                        }
                    })
                );

                setQuoteLines(updatedLines);
            } else {
                setQuoteLines(lines);
            }

        } catch (error) {
            console.error("Failed to load data:", error);
            toast.error("שגיאה בטעינת נתוני הצעת המחיר.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const initializeData = async () => {
            setIsLoading(true);
            try {
                const allItems = await fetchAllPriceItems();
                setAllPriceItems(allItems);
                const uniqueSuppliers = [...new Set(allItems.map(item => item.supplier_name).filter(Boolean))];
                setSuppliers(uniqueSuppliers);

                if (quoteId) {
                    await loadData(quoteId);
                }
            } catch (e) {
                console.error("Failed to initialize data:", e);
                toast.error("שגיאה בטעינת נתונים ראשוניים.");
            } finally {
                setIsLoading(false);
            }
        };

        initializeData();
    }, [quoteId, loadData]);

    const handleSelectSupplier = async (supplier) => {
        setSelectedSupplier(supplier);

        if (!quoteId) {
            console.warn("Quote ID is missing. Cannot persist supplier selection.");
            setQuote(prev => ({ ...prev, supplier_name: supplier }));
            return;
        }

        try {
            await Quote.update(quoteId, { supplier_name: supplier });
            setQuote(prev => ({ ...prev, supplier_name: supplier }));
        } catch (error) {
            console.error("Failed to update supplier:", error);
            toast.error("שגיאה בעדכון הספק.");
        }
    };

    const handleReorderLines = async (sourceIndex, destIndex) => {
        const reorderedLines = Array.from(quoteLines);
        const [removed] = reorderedLines.splice(sourceIndex, 1);
        reorderedLines.splice(destIndex, 0, removed);

        // Update order_index for all lines
        const updatedLines = reorderedLines.map((line, index) => ({
            ...line,
            order_index: index
        }));

        setQuoteLines(updatedLines);

        // Save order_index to database for all modified lines
        try {
            await Promise.all(
                updatedLines.map(line => {
                    if (line.id) {
                        return QuoteLine.update(line.id, { order_index: line.order_index });
                    }
                })
            );
        } catch (error) {
            console.error("Failed to update line order:", error);
            toast.error("שגיאה בעדכון סדר השורות");
        }
    };

    const handleAddItem = async (item) => {
        // Allow items with price 0 or greater
        if (item.price_no_vat < 0) {
            toast.error("מחיר לא יכול להיות שלילי");
            return;
        }

        let currentQuoteId = quoteId;

        if (!currentQuoteId) {
            try {
                const quoteNumber = `Q-${Date.now().toString().slice(-8)}`;

                const newQuoteData = {
                    client_name: 'לקוח חדש',
                    title: `הצעת מחיר ${quoteNumber}`,
                    quote_number: quoteNumber,
                    status: 'טיוטה',
                    vat_percentage: 18,
                    discount_percentage: 0,
                    subtotal: 0,
                    total: 0
                };

                if (selectedSupplier) {
                    newQuoteData.supplier_name = selectedSupplier;
                }

                const newQuote = await Quote.create(newQuoteData);

                currentQuoteId = newQuote.id;
                setQuote(newQuote);

                window.history.replaceState(null, '', `/QuoteDetails?id=${currentQuoteId}`);

            } catch (error) {
                console.error("Failed to create new quote:", error);
                toast.error("שגיאה ביצירת הצעת מחיר חדשה");
                return;
            }
        }

        const lineTotal = (item.price_no_vat || 0) * (item.quantity || 1);
        const maxOrderIndex = Math.max(...quoteLines.map(l => l.order_index || 0), -1);
        const newLine = {
            quote_id: currentQuoteId,
            price_item_id: item.id,
            model_snapshot: item.model,
            name_snapshot: item.name,
            description_snapshot: item.description,
            category_snapshot: item.category,
            sub_category_snapshot: item.sub_category,
            btu_snapshot: item.btu,
            image_url_snapshot: item.image_url,
            price_no_vat_snapshot: item.price_no_vat || 0,
            tipe_item_snapshot: item.tipe_item,
            quantity: item.quantity || 1,
            line_total: lineTotal,
            clause_number: item.clause_number || '',
            order_index: maxOrderIndex + 1
        };

        try {
            const createdLine = await QuoteLine.create(newLine);
            setQuoteLines(prev => [...prev, createdLine]);
        } catch(e) {
            console.error("Failed to add item:", e);
            toast.error("שגיאה בהוספת פריט");
        }
    };

    const handleRemoveItem = async (itemId) => {
        const lineToRemove = quoteLines.find(line => line.price_item_id === itemId);
        if (lineToRemove) {
            try {
                if (lineToRemove.id) {
                    await QuoteLine.delete(lineToRemove.id);
                    setQuoteLines(prev => prev.filter(line => line.id !== lineToRemove.id));
                } else {
                    setQuoteLines(prev => prev.filter(line => line.price_item_id !== itemId));
                }
            } catch(e) {
                console.error("Failed to remove item:", e);
                toast.error("שגיאה בהסרת פריט");
            }
        }
    };

    const handleUpdateLine = async (lineId, updates) => {
        const lineIndex = quoteLines.findIndex(line => (line.id || line.price_item_id) === lineId);
        if (lineIndex === -1) return;

        const originalLine = quoteLines[lineIndex];
        const updatedLine = { ...originalLine, ...updates };

        updatedLine.line_total = (updatedLine.price_no_vat_snapshot || 0) * (updatedLine.quantity || 1);

        const newQuoteLines = [...quoteLines];
        newQuoteLines[lineIndex] = updatedLine;
        setQuoteLines(newQuoteLines);

        if (originalLine.id) {
            try {
                await QuoteLine.update(originalLine.id, updatedLine);
            } catch (error) {
                console.error("Failed to update line:", error);
                toast.error("שגיאה בעדכון שורה");
                setQuoteLines(quoteLines);
            }
        }
    };

    const handleRemoveLine = async (lineId) => {
        const lineToRemove = quoteLines.find(line => (line.id || line.price_item_id) === lineId);
        if (!lineToRemove) return;

        setQuoteLines(prev => prev.filter(line => (line.id || line.price_item_id) !== lineId));

        if (lineToRemove.id) {
            try {
                await QuoteLine.delete(lineToRemove.id);
            } catch (error) {
                console.error("Failed to remove line:", error);
                toast.error("שגיאה בהסרת שורה");
            }
        }
    };

    const handleUpdateQuote = async (updates) => {
        const quoteIdToUpdate = quoteId || quote?.id;
        if (!quoteIdToUpdate) return;

        setQuote(prev => ({ ...prev, ...updates }));

        try {
            await Quote.update(quoteIdToUpdate, updates);
        } catch (error) {
            console.error("Failed to update quote metadata:", error);
            toast.error("שגיאה בעדכון פרטי ההצעה.");
        }
    };

    const handleSaveQuote = async () => {
        if (!quoteId && !quote?.id) {
            toast.error("לא ניתן לשמור הצעה ללא מזהה.");
            return;
        }

        setIsSaving(true);
        const subtotal = quoteLines.reduce((sum, line) => sum + (line.line_total || 0), 0);

        const discountType = quote?.discount_type || 'percentage';
        const discountAmount = discountType === 'fixed_amount'
            ? Math.min(quote?.discount_amount || 0, subtotal)
            : (subtotal * ((quote?.discount_percentage || 0) / 100));

        const subtotalAfterDiscount = subtotal - discountAmount;
        const vatPercentage = quote?.vat_percentage || 18;
        const vat = subtotalAfterDiscount * (vatPercentage / 100);
        const total = subtotalAfterDiscount + vat;

        try {
            const quoteIdToUpdate = quoteId || quote.id;
            const updatedQuoteData = {
                ...quote,
                subtotal: subtotalAfterDiscount,
                total,
                vat_percentage: vatPercentage,
                discount_type: quote?.discount_type || 'percentage',
                discount_percentage: quote?.discount_percentage || 0,
                discount_amount: quote?.discount_amount || 0,
                status: 'מוכנה',
                last_updated: new Date().toISOString()
            };

            await Quote.update(quoteIdToUpdate, updatedQuoteData);
            setQuote(prev => ({
                ...prev,
                subtotal: subtotalAfterDiscount,
                total,
                vat_percentage: vatPercentage,
                discount_type: quote?.discount_type || 'percentage',
                discount_percentage: quote?.discount_percentage || 0,
                discount_amount: quote?.discount_amount || 0,
                status: 'מוכנה'
            }));
        } catch (error) {
            console.error("Failed to save quote:", error);
            toast.error("שגיאה בשמירת ההצעה.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGeneratePDF = () => {
        setViewMode('preview');
        setShowPreview(true);

        setTimeout(async () => {
            const input = document.getElementById('pdf-preview-content');
            if (!input) {
                toast.error("שגיאה: תוכן PDF לא נמצא.");
                setShowPreview(false);
                return;
            }

            try {
                // A4 at 96dpi = 794px wide; scale:2 for crisp rendering
                const A4_PX_WIDTH  = 794;
                const A4_PX_HEIGHT = 1123; // 297mm at 96dpi

                const canvas = await html2canvas(input, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    width: A4_PX_WIDTH,
                    windowWidth: A4_PX_WIDTH,
                    scrollX: 0,
                    scrollY: 0,
                    x: 0,
                    y: 0,
                });

                const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
                const pdfW  = pdf.internal.pageSize.getWidth();   // px
                const pdfH  = pdf.internal.pageSize.getHeight();  // px

                const imgW = canvas.width;   // 794*2 = 1588
                const imgH = canvas.height;

                // Scale image so width fits exactly into one PDF page width
                const scale    = pdfW / imgW;
                const scaledH  = imgH * scale;
                const pageH    = pdfH;

                let yOffset = 0;   // offset into image (in scaled px)
                let pageIdx = 0;

                while (yOffset < scaledH) {
                    if (pageIdx > 0) pdf.addPage();

                    // Crop the canvas to just this page's slice
                    const srcY      = Math.round(yOffset / scale);           // unscaled
                    const srcHeight = Math.min(Math.round(pageH / scale), imgH - srcY); // unscaled

                    const pageCanvas = document.createElement('canvas');
                    pageCanvas.width  = imgW;
                    pageCanvas.height = Math.round(srcHeight);
                    pageCanvas.getContext('2d').drawImage(canvas, 0, srcY, imgW, srcHeight, 0, 0, imgW, srcHeight);

                    const sliceImg = pageCanvas.toDataURL('image/png');
                    pdf.addImage(sliceImg, 'PNG', 0, 0, pdfW, srcHeight * scale);

                    yOffset += pageH;
                    pageIdx++;
                }

                pdf.save(`quote-${quote?.quote_number || quote?.id || 'new'}.pdf`);
                setShowPreview(false);
            } catch (error) {
                console.error("Error generating PDF:", error);
                toast.error("שגיאה ביצירת PDF.");
                setShowPreview(false);
            }
        }, 600);
    };

    const handleImportSuccess = async (importedLines) => {
        let currentQuoteId = quoteId;

        // Create quote if it doesn't exist
        if (!currentQuoteId) {
            try {
                const quoteNumber = `Q-${Date.now().toString().slice(-8)}`;

                const newQuote = await Quote.create({
                    client_name: 'לקוח חדש',
                    title: `הצעת מחיר ${quoteNumber}`,
                    quote_number: quoteNumber,
                    status: 'טיוטה',
                    vat_percentage: 18,
                    discount_percentage: 0,
                    subtotal: 0,
                    total: 0
                });

                currentQuoteId = newQuote.id;
                setQuote(newQuote);
                window.history.replaceState(null, '', `/QuoteDetails?id=${currentQuoteId}`);
                toast.success(`הצעת מחיר ${quoteNumber} נוצרה עקב ייבוא.`);
            } catch (error) {
                console.error("Failed to create quote:", error);
                toast.error("שגיאה ביצירת הצעת מחיר.");
                return;
            }
        }

        // Add all imported lines
        const createdLines = [];
        const maxOrderIndex = Math.max(...quoteLines.map(l => l.order_index || 0), -1);
        for (let i = 0; i < importedLines.length; i++) {
        const line = importedLines[i];
        try {
        const isHeader = line.is_header === true;
        const newLine = {
            quote_id: currentQuoteId,
            price_item_id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Unique ID for imported items
            model_snapshot: line.description || '',
            name_snapshot: line.description || '',
            description_snapshot: line.notes || '',
            category_snapshot: line.section_name || (isHeader ? '' : 'ייבוא מאקסל'),
            price_no_vat_snapshot: isHeader ? 0 : (line.unit_price || 0),
            quantity: isHeader ? 0 : (line.quantity || 1),
            line_total: isHeader ? 0 : ((line.unit_price || 0) * (line.quantity || 1)),
            clause_number: line.section_name || '',
            is_header: isHeader,
            order_index: maxOrderIndex + i + 1
        };

                const created = await QuoteLine.create(newLine);
                createdLines.push(created);
            } catch (error) {
                console.error("Failed to create quote line:", error);
                toast.error(`שגיאה בהוספת פריט "${line.description}" מהייבוא.`);
            }
        }

        setQuoteLines(prev => [...prev, ...createdLines]);
        setShowImportDialog(false);
        if (createdLines.length > 0) {
            toast.success(`${createdLines.length} פריטים יובאו בהצלחה!`);
        } else {
            toast.info("לא יובאו פריטים חדשים.");
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <Skeleton className="h-10 w-1/3 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-96 w-full md:col-span-2" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`bg-[#1a1a2e] min-h-screen p-4 md:p-8 ${showPreview ? 'hidden' : ''}`} dir="rtl">
                <div className="max-w-screen-2xl mx-auto">
                    <header className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-[#f0f0f0]">{quote?.title || 'הצעת מחיר חדשה'}</h1>
                            <p className="text-[#a0a0b8]">עבור: {lead?.name || 'לקוח חדש'}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={() => setShowImportDialog(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                <Upload className="w-4 h-4 ml-2"/>
                                ייבוא מ-CSV
                            </Button>
                            <Button variant="ghost" onClick={() => navigate(createPageUrl("Leads"))}>
                                <ArrowRight className="w-4 h-4 ml-2"/>
                                חזרה ללידים
                            </Button>
                            <Button
                                variant={viewMode === 'build' ? 'default' : 'outline'}
                                onClick={() => setViewMode('build')}
                                className={viewMode === 'build' ? "bg-[#c42b2b] text-white" : ""}
                            >
                                <Settings className="w-4 h-4 ml-2"/>
                                בניית הצעה
                            </Button>
                            <Button
                                variant={viewMode === 'preview' ? 'default' : 'outline'}
                                onClick={() => setViewMode('preview')}
                            >
                                <FileText className="w-4 h-4 ml-2"/>
                                תצוגה מקדימה
                            </Button>
                        </div>
                    </header>

                    {viewMode === 'build' ? (
                        <QuoteBuilder
                            suppliers={suppliers}
                            selectedSupplier={selectedSupplier}
                            onSelectSupplier={handleSelectSupplier}
                            priceItems={allPriceItems}
                            quoteLines={quoteLines}
                            onAddItem={handleAddItem}
                            onRemoveItem={handleRemoveItem}
                            onUpdateLine={handleUpdateLine}
                            onRemoveLine={handleRemoveLine}
                            onReorderLines={handleReorderLines}
                            onSaveQuote={handleSaveQuote}
                            onGeneratePDF={handleGeneratePDF}
                            leadRequiredBtu={lead?.required_btu || 0}
                            isSaving={isSaving}
                            quote={quote}
                            onUpdateQuote={handleUpdateQuote}
                        />
                    ) : (
                        <div className="space-y-6">
                            <QuotePreview quote={quote} quoteLines={quoteLines} lead={lead} />

                            <div className="flex justify-center gap-4">
                                <Button
                                    onClick={handleSaveQuote}
                                    className="bg-green-600 hover:bg-green-700 px-8 py-3"
                                    disabled={isSaving || (!quoteId && !quote?.id)}
                                >
                                    <Save className="w-5 h-5 ml-2" />
                                    {isSaving ? 'שומר...' : 'שמור הצעה'}
                                </Button>

                                <Button
                                    onClick={handleGeneratePDF}
                                    className="bg-[#c42b2b] hover:bg-[#991b1b] px-8 py-3"
                                    disabled={quoteLines.length === 0}
                                >
                                    <FileDown className="w-5 h-5 ml-2" />
                                    הפק PDF
                                </Button>

                                <Button
                                    onClick={() => setViewMode('build')}
                                    variant="outline"
                                    className="px-8 py-3"
                                >
                                    <Settings className="w-5 h-5 ml-2" />
                                    תיקון הצעה
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {showPreview && (
                <div
                    id="pdf-preview-content"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '794px',
                        maxWidth: '794px',
                        background: '#fff',
                        zIndex: -1,
                        pointerEvents: 'none',
                        overflow: 'visible',
                    }}
                >
                    <QuotePreview quote={quote} quoteLines={quoteLines} lead={lead} />
                </div>
            )}

            <ExcelImportDialog
                isOpen={showImportDialog}
                onClose={() => setShowImportDialog(false)}
                onImportSuccess={handleImportSuccess}
            />
        </>
    );
}
