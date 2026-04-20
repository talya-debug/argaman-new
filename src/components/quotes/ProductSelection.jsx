import React, { useState, useEffect } from 'react';
import { QuoteLine } from '@/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, ShoppingCart, FileText, Zap } from 'lucide-react';
import { toast } from 'sonner';
import BtuMatchGauge from './BtuMatchGauge';

export default function ProductSelection({ quote, quoteLines, priceItems, onQuoteLineChange, onComplete }) {
  const [selectedSupplier, setSelectedSupplier] = useState(quote?.supplier_name || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    if (priceItems && Array.isArray(priceItems)) {
      let filtered = priceItems;

      if (selectedSupplier) {
        filtered = filtered.filter(item => item.supplier_name === selectedSupplier);
      }

      if (selectedCategory) {
        filtered = filtered.filter(item => item.category === selectedCategory);
      }

      if (selectedSubCategory) {
        filtered = filtered.filter(item => item.sub_category === selectedSubCategory);
      }

      if (searchTerm) {
        filtered = filtered.filter(item => 
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setFilteredItems(filtered);
    }
  }, [priceItems, selectedSupplier, selectedCategory, selectedSubCategory, searchTerm]);

  const suppliers = [...new Set(priceItems?.map(item => item.supplier_name) || [])];
  const categories = [...new Set(priceItems?.map(item => item.category) || [])];
  const subCategories = selectedCategory 
    ? [...new Set(priceItems?.filter(item => item.category === selectedCategory)?.map(item => item.sub_category) || [])]
    : [];

  const handleAddToQuote = async (priceItem) => {
    try {
      const lineTotal = priceItem.price_no_vat * 1; // Default quantity = 1
      
      await QuoteLine.create({
        quote_id: quote.id,
        price_item_id: priceItem.id,
        model_snapshot: priceItem.model,
        name_snapshot: priceItem.name,
        description_snapshot: priceItem.description,
        category_snapshot: priceItem.category,
        btu_snapshot: priceItem.btu,
        image_url_snapshot: priceItem.image_url,
        price_no_vat_snapshot: priceItem.price_no_vat,
        quantity: 1,
        line_total: lineTotal
      });

      toast.success(`${priceItem.name} נוסף להצעה`);
      onQuoteLineChange();
    } catch (error) {
      console.error('Error adding item to quote:', error);
      toast.error('שגיאה בהוספת הפריט');
    }
  };

  const handleRemoveFromQuote = async (lineId) => {
    try {
      await QuoteLine.delete(lineId);
      toast.success('פריט הוסר מההצעה');
      onQuoteLineChange();
    } catch (error) {
      console.error('Error removing item from quote:', error);
      toast.error('שגיאה בהסרת הפריט');
    }
  };

  const isInQuote = (priceItemId) => {
    return quoteLines?.some(line => line.price_item_id === priceItemId);
  };

  const getQuoteLineId = (priceItemId) => {
    return quoteLines?.find(line => line.price_item_id === priceItemId)?.id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#f0f0f0]">בניית הצעת מחיר</h1>
          <p className="text-[#a0a0b8] mt-1">בחר פריטים למחירון: {quote?.title}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onComplete()}>
            <FileText className="w-4 h-4 ml-2" />
            תצוגה מקדימה
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Left sidebar - Cart and BTU gauge */}
        <div className="space-y-6">
          {/* Shopping Cart */}
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
                סל הצעה ({quoteLines?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto">
              {!quoteLines || quoteLines.length === 0 ? (
                <div className="text-center text-[#6b6b80] py-4">
                  הסל ריק
                </div>
              ) : (
                quoteLines.map(line => (
                  <div key={line.id} className="flex items-center gap-2 p-2 bg-[#1a1a2e] rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{line.name_snapshot}</p>
                      <p className="text-xs text-[#a0a0b8]">כמות: {line.quantity}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleRemoveFromQuote(line.id)}
                      className="text-[#f87171] hover:bg-[rgba(248,113,113,0.1)] h-8 w-8 p-0"
                    >
                      ×
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* BTU Match Gauge */}
          <BtuMatchGauge quoteLines={quoteLines || []} />
        </div>

        {/* Main content - Filters and Products */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filters */}
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר ספק" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>כל הספקים</SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>כל הקטגוריות</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory} disabled={!selectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="תת-קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>כל התת-קטגוריות</SelectItem>
                    {subCategories.map(subCat => (
                      <SelectItem key={subCat} value={subCat}>{subCat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6b6b80] w-4 h-4" />
                  <Input
                    placeholder="חיפוש..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <Card key={item.id} className="shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-[#1e1e36] rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-[#6b6b80]">אין תמונה</span>
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-2">
                      <h3 className="font-bold text-[#f0f0f0]">{item.name}</h3>
                      <p className="text-sm text-[#a0a0b8]">{item.model}</p>
                      {item.description && (
                        <p className="text-xs text-[#a0a0b8] line-clamp-2">{item.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                        {item.sub_category && (
                          <Badge variant="outline" className="text-xs">
                            {item.sub_category}
                          </Badge>
                        )}
                        {item.btu > 0 && (
                          <Badge className="text-xs bg-[rgba(96,165,250,0.1)] text-blue-800">
                            <Zap className="w-3 h-3 ml-1" />
                            {item.btu.toLocaleString()} BTU
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center pt-2">
                        <span className="font-bold text-lg text-[#f0f0f0]">
                          ₪{item.price_no_vat?.toLocaleString()}
                        </span>
                        
                        {isInQuote(item.id) ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRemoveFromQuote(getQuoteLineId(item.id))}
                            className="text-[#f87171] border-red-200 hover:bg-[rgba(248,113,113,0.1)]"
                          >
                            הסר
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            onClick={() => handleAddToQuote(item)}
                            className="bg-[#c42b2b] hover:bg-[#991b1b]"
                          >
                            <Plus className="w-4 h-4 ml-1" />
                            הוסף
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#a0a0b8]">לא נמצאו פריטים בהתאם לסינון</p>
              <p className="text-sm text-[#6b6b80] mt-2">נסה לשנות את הקריטריונים או לבטל חלק מהסינונים</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}