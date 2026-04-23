import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowRight, Trash2, FileDown, Save, Check, Plus, Minus, PlusCircle, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Enhanced BTU Gauge component with correct utilization calculation
function IndoorOutdoorBtuGauge({ quoteLines }) {
    const btuData = useMemo(() => {
        let indoorTotal = 0;
        let outdoorTotal = 0;
        
        if (!quoteLines || quoteLines.length === 0) {
            return { indoorBtu: 0, outdoorBtu: 0 };
        }
        
        quoteLines.forEach(line => {
            const tipeItem = line.tipe_item_snapshot;
            const btu = parseFloat(line.btu_snapshot) || 0;
            const quantity = parseFloat(line.quantity) || 1;
            const totalBtu = btu * quantity;
            
            console.log(`Item: ${line.model_snapshot}, tipe_item: ${tipeItem}, BTU: ${btu}, quantity: ${quantity}, total: ${totalBtu}`);
            
            if (tipeItem === 'מאייד') {
                indoorTotal += totalBtu;
            } else if (tipeItem === 'מעבה') {
                outdoorTotal += totalBtu;
            } else {
                // Fallback logic if tipe_item is missing
                const category = (line.category_snapshot || '').toLowerCase();
                const model = (line.model_snapshot || '').toLowerCase();
                
                if (category.includes('מאייד') || category.includes('evaporator') ||
                    model.includes('קסטה') || model.includes('קיר') || model.includes('תקרה') || 
                    model.includes('cassette') || model.includes('wall') || model.includes('ceiling')) {
                    indoorTotal += totalBtu;
                } else if (category.includes('vrf') || category.includes('מעבה') || category.includes('condenser') ||
                          model.includes('vrf') || model.includes('outdoor') || model.includes('חיצונית')) {
                    outdoorTotal += totalBtu;
                }
            }
        });
        
        console.log(`Total Indoor BTU: ${indoorTotal}, Total Outdoor BTU: ${outdoorTotal}`);
        
        return { 
            indoorBtu: Math.round(indoorTotal), 
            outdoorBtu: Math.round(outdoorTotal) 
        };
    }, [quoteLines]);

    // Calculate utilization: (Sum of indoor BTUs / Outdoor BTU) * 100
    const utilization = btuData.outdoorBtu > 0 ? Math.round((btuData.indoorBtu / btuData.outdoorBtu) * 100) : 0;
    
    // Color coding and status messages based on new ranges
    let colorClass, statusText, statusColor, statusMessage;
    if (btuData.outdoorBtu === 0) {
        colorClass = '[&>*]:bg-gray-300';
        statusText = 'אין מעבה';
        statusColor = 'text-gray-600';
        statusMessage = 'בחר מעבה כדי לחשב ניצול';
    } else if (utilization >= 0 && utilization <= 70) {
        colorClass = '[&>*]:bg-green-600';
        statusText = 'ניצול תקין';
        statusColor = 'text-green-600';
        statusMessage = 'ניצול המעבה תקין, ניתן להוסיף מאיידים נוספים.';
    } else if (utilization > 70 && utilization <= 100) {
        colorClass = '[&>*]:bg-orange-500';
        statusText = 'ניצול גבוה';
        statusColor = 'text-orange-600';
        statusMessage = 'ניצול המעבה קרוב למקסימום, יש לשקול הוספת מאיידים בזהירות.';
    } else { // utilization > 100
        colorClass = '[&>*]:bg-red-600';
        statusText = 'חריגה (Overload)';
        statusColor = 'text-red-500';
        statusMessage = 'סך תפוקת המאיידים גבוה מתפוקת המעבה. יש להסיר מאיידים או להחליף מעבה.';
    }
    
    const progressValue = Math.min(utilization, 130);

    return (
        <Card className="shadow-lg border-0 mb-6">
            <CardHeader>
                <CardTitle className="text-lg">התאמת תפוקת מאיידים</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-base font-medium">
                        <span>ניצול מעבה</span>
                        <span className={`font-bold ${statusColor}`}>{utilization}% - {statusText}</span>
                    </div>
                    <Progress 
                        value={progressValue} 
                        max={130}
                        className={`h-4 ${colorClass}`} 
                    />
                    <div className="flex justify-between text-sm text-gray-500 pt-2">
                        <span>סה"כ מאיידים: {btuData.indoorBtu.toLocaleString()} BTU</span>
                        <span>תפוקת מעבה: {btuData.outdoorBtu.toLocaleString()} BTU</span>
                    </div>
                    <div className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                        {statusMessage}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Add Manual Item Dialog Component
function AddManualItemDialog({ onAddItem }) {
    const [isOpen, setIsOpen] = useState(false);
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState(0);
    const [clauseNumber, setClauseNumber] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!itemName.trim()) {
            toast.error("יש למלא שם פריט");
            return;
        }

        if (quantity <= 0) {
            toast.error("יש להזין כמות גדולה מ-0");
            return;
        }

        if (unitPrice < 0) {
            toast.error("מחיר יחידה לא יכול להיות שלילי");
            return;
        }

        const manualItem = {
            id: 'manual-' + Date.now(),
            model: itemName,
            name: itemName,
            price_no_vat: unitPrice,
            btu: 0,
            quantity: quantity,
            category: 'פריט ידני',
            sub_category: '',
            supplier_name: 'פריט ידני',
            tipe_item: 'אבזר',
            clause_number: clauseNumber
        };

        onAddItem(manualItem);
        
        // Reset form
        setItemName('');
        setQuantity(1);
        setUnitPrice(0);
        setClauseNumber('');
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700">
                    <PlusCircle className="w-4 h-4 ml-2" />
                    הוסף פריט ידני
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-white shadow-xl rounded-lg" dir="rtl">
                <div className="bg-white p-1 rounded-lg">
                    <DialogHeader className="bg-purple-50 p-4 rounded-t-lg border-b">
                        <DialogTitle className="text-slate-800 text-lg font-bold">הוספת פריט ידני להצעה</DialogTitle>
                    </DialogHeader>

                    <div className="p-6 bg-white">
                        <form onSubmit={handleSubmit} className="space-y-6 text-slate-800">
                            <div>
                                <Label htmlFor="clause-number" className="text-gray-700 font-semibold">מספר סעיף (אופציונלי)</Label>
                                <Input
                                    id="clause-number"
                                    value={clauseNumber}
                                    onChange={(e) => setClauseNumber(e.target.value)}
                                    placeholder="לדוגמה: A1, 1.2.3..."
                                    className="text-right bg-white border-gray-300 mt-2"
                                />
                            </div>

                            <div>
                                <Label htmlFor="item-name" className="text-gray-700 font-semibold">שם הפריט *</Label>
                                <Input
                                    id="item-name"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    placeholder="לדוגמה: עבודת התקנה, הובלה, אביזר מיוחד..."
                                    className="text-right bg-white border-gray-300 mt-2"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="quantity" className="text-gray-700 font-semibold">כמות *</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                                        className="text-right bg-white border-gray-300 mt-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="unit-price" className="text-gray-700 font-semibold">
                                        מחיר יחידה (₪) *
                                    </Label>
                                    <Input
                                        id="unit-price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                                        className="text-right bg-white border-gray-300 mt-2"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">ניתן להזין 0 לפריטים ללא חיוב</p>
                                </div>
                            </div>

                            <div className={`p-4 rounded-lg border ${unitPrice === 0 ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}`}>
                                <div className="flex justify-between items-center">
                                    <Label className="text-sm font-semibold text-gray-700">סכום כולל</Label>
                                    {unitPrice === 0 && (
                                        <Badge className="bg-blue-50 text-blue-600 text-xs">ללא חיוב</Badge>
                                    )}
                                </div>
                                <p className="text-2xl font-bold text-purple-600">₪{(quantity * unitPrice).toLocaleString()}</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    ביטול
                                </Button>
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                                    הוסף פריט
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Enhanced Shopping Cart with working quantity controls and drag & drop reordering
function ShoppingCart({ quoteLines, onUpdateLine, onRemoveLine, onAddManualItem, discount, onDiscountChange, quote, onUpdateQuote, onReorderLines }) {
    const subtotal = quoteLines.reduce((sum, line) => sum + ((line.price_no_vat_snapshot || 0) * (line.quantity || 1)), 0);
    
    const discountType = quote?.discount_type || 'percentage';
    const discountAmount = discountType === 'fixed_amount' 
        ? Math.min(quote?.discount_amount || 0, subtotal)
        : (subtotal * (discount?.percentage || 0) / 100);
    
    const total = subtotal - discountAmount;
    
    const handleQuantityChange = (lineId, newQuantity) => {
        const quantity = Math.max(1, parseInt(newQuantity, 10) || 1);
        onUpdateLine(lineId, { quantity });
    };

    const incrementQuantity = (lineId, currentQuantity) => {
        handleQuantityChange(lineId, (currentQuantity || 1) + 1);
    };

    const decrementQuantity = (lineId, currentQuantity) => {
        if ((currentQuantity || 1) > 1) {
            handleQuantityChange(lineId, (currentQuantity || 1) - 1);
        }
    };

    const handleClauseNumberChange = (lineId, newClauseNumber) => {
        onUpdateLine(lineId, { clause_number: newClauseNumber });
    };

    const handlePriceChange = (lineId, newPrice) => {
        const price = Math.max(0, parseFloat(newPrice) || 0);
        onUpdateLine(lineId, { price_no_vat_snapshot: price });
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        
        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;
        
        if (sourceIndex === destIndex) return;
        
        onReorderLines(sourceIndex, destIndex);
    };

    const handleMoveUp = (index) => {
        if (index === 0) return;
        onReorderLines(index, index - 1);
    };

    const handleMoveDown = (index) => {
        if (index === quoteLines.length - 1) return;
        onReorderLines(index, index + 1);
    };
    
    return (
        <Card className="shadow-lg border-0">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">סל הצעת מחיר ({(quoteLines || []).length} פריטים)</CardTitle>
                    <AddManualItemDialog onAddItem={onAddManualItem} />
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-3">
                    {!quoteLines || quoteLines.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>הסל ריק</p>
                            <p className="text-sm">בחר פריטים מהמחירון או הוסף פריט ידני</p>
                        </div>
                    ) : (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="quote-lines">
                                {(provided) => (
                                    <div 
                                        className="space-y-3"
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                    >
                                        {quoteLines.map((line, index) => {
                                            const lineIdentifier = line.id || line.price_item_id;
                                            const isManualItem = lineIdentifier && lineIdentifier.toString().startsWith('manual-');
                                            const linePrice = (line.price_no_vat_snapshot || 0);
                                            const lineTotal = linePrice * (line.quantity || 1);
                                            const isZeroPrice = linePrice === 0;
                                            
                                            return (
                                            <Draggable key={lineIdentifier} draggableId={String(lineIdentifier)} index={index}>
                                                {(provided, snapshot) => (
                                                <div 
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`p-4 border rounded-lg ${isManualItem ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'} ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''}`}
                                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                                                <GripVertical className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                    onClick={() => handleMoveUp(index)}
                                                    disabled={index === 0}
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                                    onClick={() => handleMoveDown(index)}
                                                    disabled={index === quoteLines.length - 1}
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex-1 mr-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-semibold text-base">{line.model_snapshot}</h4>
                                                {isManualItem && (
                                                    <Badge className="bg-purple-100 text-purple-700 text-xs">פריט ידני</Badge>
                                                )}
                                                {isZeroPrice && (
                                                    <Badge className="bg-blue-50 text-blue-600 text-xs">ללא חיוב</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {line.sub_category_snapshot ? 
                                                    `${line.category_snapshot} - ${line.sub_category_snapshot}` : 
                                                    line.category_snapshot
                                                }
                                            </p>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => onRemoveLine(lineIdentifier)} 
                                            className="text-red-500 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    
                                    {/* Clause Number Field */}
                                    <div className="mb-3">
                                        <Label className="text-xs text-gray-500 mb-1 block">מספר סעיף</Label>
                                        <Input
                                            type="text"
                                            value={line.clause_number || ''}
                                            onChange={(e) => handleClauseNumberChange(lineIdentifier, e.target.value)}
                                            placeholder="הזן מספר סעיף (אופציונלי)"
                                            className="h-8 text-sm"
                                        />
                                    </div>

                                    {/* Price Per Unit Field */}
                                    <div className="mb-3">
                                        <Label className="text-xs text-gray-500 mb-1 block">מחיר ליחידה (ניתן לעריכה)</Label>
                                        <Input
                                            type="number"
                                            value={linePrice}
                                            onChange={(e) => handlePriceChange(lineIdentifier, e.target.value)}
                                            placeholder="0.00"
                                            className="h-8 text-sm"
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">כמות:</span>
                                                <div className="flex items-center border rounded">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => decrementQuantity(lineIdentifier, line.quantity)}
                                                        disabled={(line.quantity || 1) <= 1}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <Input 
                                                        type="number" 
                                                        value={line.quantity || 1} 
                                                        onChange={(e) => handleQuantityChange(lineIdentifier, e.target.value)} 
                                                        className="w-16 h-8 text-center border-0 focus-visible:ring-0" 
                                                        min="1" 
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => incrementQuantity(lineIdentifier, line.quantity)}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {line.btu_snapshot && (
                                                <Badge variant="outline" className="text-sm">
                                                    {((line.btu_snapshot || 0) * (line.quantity || 1)).toLocaleString()} BTU
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm text-gray-500">₪{linePrice.toLocaleString()} × {line.quantity || 1}</p>
                                            <p className={`font-bold ${isZeroPrice ? 'text-gray-400' : 'text-[#B8922E]'}`}>
                                                ₪{lineTotal.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                                </div>
                                                )}
                                            </Draggable>
                                        )})}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}
                </ScrollArea>
                {quoteLines && quoteLines.length > 0 && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="flex justify-between items-center text-base">
                            <span>סכום ביניים:</span>
                            <span className="font-semibold">₪{subtotal.toLocaleString()}</span>
                        </div>
                        
                        {/* Discount Input */}
                        <div className="border-t pt-3">
                            <Label className="text-sm text-gray-500 mb-2 block">הנחה כללית</Label>
                            <div className="flex items-center gap-2 mb-2">
                                <Select 
                                    value={discountType} 
                                    onValueChange={(value) => onUpdateQuote({ discount_type: value })}
                                >
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">אחוז (%)</SelectItem>
                                        <SelectItem value="fixed_amount">סכום (₪)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={discountType === 'fixed_amount' ? (quote?.discount_amount || 0) : (discount?.percentage || 0)}
                                    onChange={(e) => {
                                        const value = parseFloat(e.target.value) || 0;
                                        if (discountType === 'fixed_amount') {
                                            onUpdateQuote({ discount_amount: Math.max(0, Math.min(subtotal, value)) });
                                        } else {
                                            onDiscountChange({ percentage: Math.max(0, Math.min(100, value)) });
                                        }
                                    }}
                                    placeholder="0"
                                    className="h-9 text-sm"
                                    min="0"
                                    max={discountType === 'fixed_amount' ? subtotal : 100}
                                    step={discountType === 'fixed_amount' ? "0.01" : "0.1"}
                                />
                                <span className="text-sm text-gray-500 w-6">
                                    {discountType === 'percentage' ? '%' : '₪'}
                                </span>
                            </div>
                        </div>

                        {discountAmount > 0 && (
                            <div className="flex justify-between items-center text-sm text-orange-600">
                                <span>
                                    הנחה {discountType === 'percentage' ? `(${discount?.percentage || 0}%)` : ''}:
                                </span>
                                <span className="font-semibold">-₪{discountAmount.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-lg font-bold border-t pt-3">
                            <span>סה"כ (לפני מע"מ):</span>
                            <span className="text-[#B8922E]">₪{total.toLocaleString()}</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function QuoteBuilder({ 
    suppliers, 
    selectedSupplier, 
    onSelectSupplier, 
    priceItems,
    quoteLines, 
    onAddItem, 
    onRemoveItem, 
    onUpdateLine, 
    onRemoveLine,
    onReorderLines,
    onSaveQuote, 
    onGeneratePDF,
    isSaving,
    quote,
    onUpdateQuote
}) {
    const [currentStep, setCurrentStep] = useState('supplier');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [quoteNotes, setQuoteNotes] = useState(quote?.notes || '');
    const [discount, setDiscount] = useState({ percentage: quote?.discount_percentage || 0 });

    // Debug logging
    console.log('QuoteBuilder received:', {
        suppliers,
        selectedSupplier,
        priceItemsLength: priceItems?.length,
        quoteLinesLength: quoteLines?.length
    });

    // Get unique suppliers from data
    const activeSuppliers = useMemo(() => {
        if (!priceItems || priceItems.length === 0) {
            console.log('No price items available');
            return [];
        }
        const supplierNames = [...new Set(priceItems.map(item => item.supplier_name))].filter(name => name);
        console.log('Available suppliers:', supplierNames);
        return supplierNames;
    }, [priceItems]);
    
    // Get categories for selected supplier
    const supplierCategories = useMemo(() => {
        if (!selectedSupplier || !priceItems) return [];
        const categories = [...new Set(priceItems
            .filter(item => item.supplier_name === selectedSupplier)
            .map(item => item.category)
        )];
        return categories.filter(cat => cat);
    }, [selectedSupplier, priceItems]);

    // Get subcategories for selected category
    const categorySubCategories = useMemo(() => {
        if (!selectedSupplier || !selectedCategory || !priceItems) return [];
        const subCategories = [...new Set(priceItems
            .filter(item => item.supplier_name === selectedSupplier && item.category === selectedCategory)
            .map(item => item.sub_category)
            .filter(sub => sub)
        )];
        return subCategories;
    }, [selectedSupplier, selectedCategory, priceItems]);

    // Get items for current selection
    const currentItems = useMemo(() => {
        if (!selectedSupplier || !selectedCategory || !priceItems) return [];
        
        return priceItems.filter(item => {
            const supplierMatch = item.supplier_name === selectedSupplier;
            const categoryMatch = item.category === selectedCategory;
            const subCategoryMatch = selectedSubCategory ? item.sub_category === selectedSubCategory : true;
            
            return supplierMatch && categoryMatch && subCategoryMatch;
        });
    }, [selectedSupplier, selectedCategory, selectedSubCategory, priceItems]);

    const selectedItemIds = useMemo(() => {
        if (!quoteLines) return new Set();
        return new Set(quoteLines.filter(line => line.price_item_id).map(line => line.price_item_id));
    }, [quoteLines]);

    const handleSupplierSelect = (supplier) => {
        onSelectSupplier(supplier);
        setSelectedCategory(null);
        setSelectedSubCategory(null);
        setCurrentStep('category'); // ✅ FIX: Move to category step after selecting supplier
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        setSelectedSubCategory(null);
        
        const subCatsForSelected = [...new Set(priceItems
            .filter(item => item.supplier_name === selectedSupplier && item.category === category)
            .map(item => item.sub_category)
            .filter(sub => sub)
        )];

        const hasSubCategories = subCatsForSelected.length > 0;
        setCurrentStep(hasSubCategories ? 'subcategory' : 'items');
    };

    const handleSubCategorySelect = (subCategory) => {
        setSelectedSubCategory(subCategory);
        setCurrentStep('items');
    };

    const handleItemToggle = (item) => {
        // The previous check for `!item.price_no_vat || item.price_no_vat === 0` is removed.
        // Items with price_no_vat = 0 are now allowed to be added, consistent with manual items.
        if (selectedItemIds.has(item.id)) {
            onRemoveItem(item.id);
        } else {
            onAddItem(item);
        }
    };

    // Navigation handlers
    const handleBackToSuppliers = () => {
        setCurrentStep('supplier');
        setSelectedCategory(null);
        setSelectedSubCategory(null);
    };

    const handleBackToCategories = () => {
        setCurrentStep('category');
        setSelectedSubCategory(null);
    };

    const handleBackToSubCategories = () => {
        setCurrentStep('subcategory');
        setSelectedSubCategory(null);
    };

    // Render different steps
    const renderStep = () => {
        switch (currentStep) {
            case 'supplier':
                return (
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl">בחר ספק</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {activeSuppliers.map((supplier) => (
                                    <Button
                                        key={supplier}
                                        variant={selectedSupplier === supplier ? "default" : "outline"}
                                        className={`h-24 text-lg font-semibold transition-all ${
                                            selectedSupplier === supplier 
                                                ? 'bg-[#D4A843] text-white shadow-lg ring-2 ring-[#B8922E]'
                                                : 'bg-white border-gray-200 hover:bg-[rgba(184,146,46,0.08)] hover:border-[#D4A843] text-gray-900'
                                        }`}
                                        onClick={() => handleSupplierSelect(supplier)}
                                    >
                                        {selectedSupplier === supplier && (
                                            <Check className="w-5 h-5 ml-2" />
                                        )}
                                        {supplier}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                );

            case 'category':
                return (
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-xl">בחר קטגוריה - {selectedSupplier}</CardTitle>
                            <Button variant="outline" onClick={handleBackToSuppliers}>
                                <ArrowRight className="w-4 h-4 ml-2" />
                                חזרה לספקים
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {supplierCategories.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {supplierCategories.map((category) => (
                                        <Button
                                            key={category}
                                            variant="outline"
                                            className="h-16 text-base font-medium p-4 hover:bg-[rgba(184,146,46,0.08)] hover:border-[#D4A843]"
                                            onClick={() => handleCategorySelect(category)}
                                        >
                                            {category}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-8 text-gray-500">
                                    <p>אין קטגוריות זמינות עבור ספק זה</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );

            case 'subcategory':
                return (
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-xl">בחר תת-קטגוריה - {selectedCategory}</CardTitle>
                            <Button variant="outline" onClick={handleBackToCategories}>
                                <ArrowRight className="w-4 h-4 ml-2" />
                                חזרה לקטגוריות
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {categorySubCategories.map((subCategory) => (
                                    <Button
                                        key={subCategory}
                                        variant="outline"
                                        className="h-16 text-base font-medium p-4 hover:bg-[rgba(184,146,46,0.08)] hover:border-[#D4A843]"
                                        onClick={() => handleSubCategorySelect(subCategory)}
                                    >
                                        {subCategory}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                );

            case 'items':
                return (
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-xl">
                                בחר פריטים - {selectedSupplier} &gt; {selectedCategory}
                                {selectedSubCategory && ` > ${selectedSubCategory}`}
                            </CardTitle>
                            <Button variant="outline" onClick={categorySubCategories.length > 0 ? handleBackToSubCategories : handleBackToCategories}>
                                <ArrowRight className="w-4 h-4 ml-2" />
                                חזרה
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[500px]">
                                <div className="grid gap-3">
                                    {currentItems.length > 0 ? currentItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                                selectedItemIds.has(item.id)
                                                    ? 'bg-[rgba(184,146,46,0.08)] border-[#B8922E] shadow-md'
                                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                            }`}
                                            onClick={() => handleItemToggle(item)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={selectedItemIds.has(item.id)}
                                                        disabled={!item.price_no_vat && item.price_no_vat !== 0} // Allow items with price 0 to be selected
                                                        className="pointer-events-none"
                                                    />
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{item.model}</h4>
                                                        {item.btu && (
                                                            <Badge variant="outline" className="mt-1 text-xs">
                                                                {item.btu.toLocaleString()} BTU
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-[#B8922E]">
                                                        {(item.price_no_vat || item.price_no_vat === 0) ? // Correctly display 0 price
                                                            `₪${item.price_no_vat.toLocaleString()}` : 
                                                            'ללא מחיר'
                                                        }
                                                    </p>
                                                    {selectedItemIds.has(item.id) && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Check className="w-4 h-4 text-green-500" />
                                                            <span className="text-xs text-green-600">נבחר</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center p-8 text-gray-500">
                                            <p>לא נמצאו פריטים תחת בחירה זו.</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <IndoorOutdoorBtuGauge quoteLines={quoteLines || []} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {renderStep()}
                </div>

                <div>
                    <ShoppingCart 
                        quoteLines={quoteLines || []}
                        onUpdateLine={onUpdateLine}
                        onRemoveLine={onRemoveLine}
                        onAddManualItem={onAddItem}
                        discount={discount}
                        quote={quote}
                        onUpdateQuote={onUpdateQuote}
                        onReorderLines={onReorderLines}
                        onDiscountChange={(newDiscount) => {
                            setDiscount(newDiscount);
                            if (onUpdateQuote) {
                                onUpdateQuote({ discount_percentage: newDiscount.percentage });
                            }
                        }}
                    />
                    
                    {(quoteLines?.length || 0) > 0 && (
                        <>
                            <Card className="shadow-lg border-0 mt-4">
                                <CardHeader>
                                    <CardTitle className="text-base">תנאים והערות ללקוח</CardTitle>
                                    <p className="text-xs text-gray-500 mt-1">יוצגו בהצעת המחיר ללקוח</p>
                                </CardHeader>
                                <CardContent>
                                    <textarea
                                        value={quote?.notes_to_client || ''}
                                        onChange={(e) => {
                                            if (onUpdateQuote) {
                                                onUpdateQuote({ notes_to_client: e.target.value });
                                            }
                                        }}
                                        placeholder="תנאים והערות להצעת המחיר (יוצגו ללקוח)&#10;&#10;ברירת מחדל:&#10;• ההצעה תקפה למשך 30 יום מתאריך ההצעה&#10;• המחירים אינם כוללים עבודות בניין או חשמל&#10;• ההצעה כוללת התקנה מקצועית ואחריות לשנה&#10;• תנאי תשלום: 50% במתן צו התחלת עבודה, יתרה בסיום"
                                        className="w-full p-3 border border-gray-300 rounded-lg text-right resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px]"
                                        rows={8}
                                    />
                                </CardContent>
                            </Card>
                            
                            <Card className="shadow-lg border-0 mt-4">
                                <CardHeader>
                                    <CardTitle className="text-base">הערות פנימיות</CardTitle>
                                    <p className="text-xs text-gray-500 mt-1">לא יוצגו ללקוח</p>
                                </CardHeader>
                                <CardContent>
                                    <textarea
                                        value={quoteNotes}
                                        onChange={(e) => {
                                            setQuoteNotes(e.target.value);
                                            if (onUpdateQuote) {
                                                onUpdateQuote({ notes: e.target.value });
                                            }
                                        }}
                                        placeholder="הערות פנימיות (אופציונלי)"
                                        className="w-full p-3 border border-gray-300 rounded-lg text-right resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={4}
                                    />
                                </CardContent>
                            </Card>
                        </>
                    )}
                    
                    <div className="mt-6 space-y-3">
                        <Button 
                            onClick={onSaveQuote} 
                            className="w-full bg-green-600 hover:bg-green-700 text-lg py-3"
                            disabled={(quoteLines?.length || 0) === 0 || isSaving}
                        >
                            <Save className="w-5 h-5 ml-2" />
                            {isSaving ? 'שומר...' : 'שמור הצעה'}
                        </Button>
                        <Button 
                            onClick={onGeneratePDF} 
                            variant="outline" 
                            className="w-full text-lg py-3"
                            disabled={(quoteLines?.length || 0) === 0}
                        >
                            <FileDown className="w-5 h-5 ml-2" />
                            הפק הצעת מחיר
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}