import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Upload, FileSpreadsheet, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';

// Field mapping configuration - Hebrew column names to system fields
const FIELD_MAPPINGS = {
    // Description field (REQUIRED)
    'תיאור': 'description',
    'שם פריט': 'description',
    'תיאור פריט': 'description',
    'פריט': 'description',
    'שם': 'description',
    'תאור': 'description',
    'תיאור פריט/עבודה': 'description',

    // Unit field (OPTIONAL)
    'יחידה': 'unit',
    'סוג יחידה': 'unit',
    'יח': 'unit',
    "יח'": 'unit',
    'יחידת מידה': 'unit',
    'מידה': 'unit',

    // Quantity field (REQUIRED)
    'כמות': 'quantity',
    'כמות נדרשת': 'quantity',
    'כמ': 'quantity',
    'כמות מבוקשת': 'quantity',

    // Unit price field (OPTIONAL)
    'מחיר יחידה': 'unit_price',
    'מחיר': 'unit_price',
    'מחיר ליחידה': 'unit_price',
    'מחיר יח': 'unit_price',
    "מחיר יח'": 'unit_price',

    // Total price (OPTIONAL, always calculated)
    'סהכ': 'total_price',
    'סכום כולל': 'total_price',
    'סה"כ': 'total_price',
    'סך הכל': 'total_price',
    "סה״כ": 'total_price',

    // Notes (OPTIONAL)
    'הערות': 'notes',
    'הערה': 'notes',
    'הערות נוספות': 'notes',
    'הערה/תיאור': 'notes',

    // Section/clause (OPTIONAL - free text)
    'סעיף': 'section_name',
    'מבנה': 'section_name',
    'קטגוריה': 'section_name',
    'פרק': 'section_name',
    'מס סעיף': 'section_name',
    'מספר סעיף': 'section_name',
};

export default function ExcelImportDialog({ isOpen, onClose, onImportSuccess }) {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type - CSV only
            if (!selectedFile.name.match(/\.csv$/i) && selectedFile.type !== 'text/csv') {
                toast.error("יש להעלות קובץ CSV בלבד");
                return;
            }
            
            setFile(selectedFile);
            setImportResult(null);
        }
    };

    const normalizeColumnName = (columnName) => {
        if (!columnName) return '';
        return columnName.trim().toLowerCase();
    };

    const parseCSV = (text) => {
        // CRITICAL: Parse CSV properly - respect quoted fields with newlines
        const result = [];
        let currentRow = [];
        let currentCell = '';
        let inQuotes = false;
        let i = 0;

        while (i < text.length) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote - add one quote to cell
                    currentCell += '"';
                    i += 2;
                    continue;
                } else {
                    // Toggle quote mode
                    inQuotes = !inQuotes;
                    i++;
                    continue;
                }
            }

            if (!inQuotes && char === ',') {
                // End of cell
                currentRow.push(currentCell.trim());
                currentCell = '';
                i++;
                continue;
            }

            if (!inQuotes && (char === '\n' || char === '\r')) {
                // End of row - only if not inside quotes
                if (currentCell || currentRow.length > 0) {
                    currentRow.push(currentCell.trim());
                    result.push(currentRow);
                    currentRow = [];
                    currentCell = '';
                }
                // Skip \r\n or \n\r combinations
                if ((char === '\r' && nextChar === '\n') || (char === '\n' && nextChar === '\r')) {
                    i += 2;
                } else {
                    i++;
                }
                continue;
            }

            // Regular character - add to current cell
            currentCell += char;
            i++;
        }

        // Don't forget last cell and row
        if (currentCell || currentRow.length > 0) {
            currentRow.push(currentCell.trim());
            result.push(currentRow);
        }

        if (result.length < 2) return { headers: [], rows: [] };

        const headers = result[0];
        const rows = result.slice(1).map(values => {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            return row;
        });

        console.log(`📊 Parsed CSV: ${headers.length} columns, ${rows.length} rows`);
        console.log('Headers:', headers);

        return { headers, rows };
    };

    const mapRowToQuoteLine = (row) => {
        const mappedRow = {
            description: null,
            unit: '',  // Default to empty string instead of null
            quantity: null,
            unit_price: null,  // null to distinguish from explicit 0
            total_price: null,
            notes: '',
            section_name: '',  // Default to empty string for section
            is_header: false,  // Flag for header rows
            unmappedFields: []
        };

        Object.keys(row).forEach((key) => {
            const value = row[key];
            
            // Skip completely empty values, but allow 0
            if (value === null || value === undefined || value === '') return;
            
            const normalizedKey = normalizeColumnName(key);
            
            // Try to find a mapping
            let isMapped = false;
            for (const [mappingKey, systemField] of Object.entries(FIELD_MAPPINGS)) {
                if (normalizeColumnName(mappingKey) === normalizedKey) {
                    // Clean numeric values (remove commas, currency symbols, spaces, quotes, RTL marks)
                    if (systemField === 'quantity' || systemField === 'unit_price' || systemField === 'total_price') {
                        const cleanedValue = value.toString()
                            .replace(/[,₪\s'"״״\u200F\u200E\u202A\u202B\u202C]/g, '')  // Remove commas, currency, spaces, quotes, RTL/LTR marks, embedding controls
                            .replace(/[\u0591-\u05C7]/g, '')  // Remove Hebrew vowel marks
                            .trim();
                        // Only set if not empty after cleaning and is a valid number
                        if (cleanedValue && cleanedValue !== '' && cleanedValue !== '-' && !isNaN(parseFloat(cleanedValue))) {
                            mappedRow[systemField] = cleanedValue;
                        }
                    } else {
                        // For text fields, accept as is (trim only)
                        mappedRow[systemField] = value.toString().trim();
                    }
                    isMapped = true;
                    break;
                }
            }
            
            // If not mapped, add to unmapped fields
            if (!isMapped) {
                mappedRow.unmappedFields.push({
                    name: key,
                    value: value
                });
            }
        });

        // Merge unmapped fields into notes
        if (mappedRow.unmappedFields.length > 0) {
            const unmappedNotes = mappedRow.unmappedFields
                .map(field => `${field.name}: ${field.value}`)
                .join('; ');
            
            if (mappedRow.notes) {
                mappedRow.notes += '; ' + unmappedNotes;
            } else {
                mappedRow.notes = unmappedNotes;
            }
        }

        return mappedRow;
    };

    const isHeaderRow = (row) => {
        // A header row has description but NO quantity, unit, or unit_price
        const hasDescription = row.description && row.description.toString().trim() !== '';

        const quantityStr = row.quantity ? row.quantity.toString().trim() : '';
        const quantityNum = parseFloat(quantityStr);
        const hasNoQuantity = !quantityStr || quantityStr === '' || isNaN(quantityNum);

        const unitPriceStr = row.unit_price ? row.unit_price.toString().trim() : '';
        const unitPriceNum = parseFloat(unitPriceStr);
        const hasNoUnitPrice = !unitPriceStr || unitPriceStr === '' || isNaN(unitPriceNum);

        const unitStr = row.unit ? row.unit.toString().trim() : '';
        const hasNoUnit = !unitStr || unitStr === '';

        // It's a header if it has description but all numeric/unit fields are empty
        return hasDescription && hasNoQuantity && hasNoUnitPrice && hasNoUnit;
    };

    const validateRow = (row, rowIndex) => {
        const errors = [];

        // Check if this is a header row (description only, no quantity/price/unit)
        if (isHeaderRow(row)) {
            // Header rows are valid - no errors
            row.is_header = true;
            return errors;
        }

        // For regular rows: description and quantity are required

        // Check description (REQUIRED)
        if (!row.description || row.description.toString().trim() === '') {
            errors.push(`שורה ${rowIndex}: חסר תיאור פריט (ערך: "${row.description}")`);
        }

        // Check quantity (REQUIRED for non-header rows) - must be a valid number >= 0
        const quantityStr = row.quantity ? row.quantity.toString().trim() : '';
        const quantity = parseFloat(quantityStr);

        if (!quantityStr || quantityStr === '' || isNaN(quantity) || quantity < 0) {
            errors.push(`שורה ${rowIndex}: כמות לא תקינה או חסרה (ערך מקורי: "${row.quantity}", אחרי ניקוי: "${quantityStr}", מספר: ${quantity})`);
        }

        // Unit is OPTIONAL - no validation needed
        // Unit price is OPTIONAL - will default to 0 if missing
        // Section is OPTIONAL - free text, no validation

        return errors;
    };

    const handleImport = async () => {
        if (!file) {
            toast.error("יש לבחור קובץ");
            return;
        }

        setIsProcessing(true);
        
        try {
            // Read CSV file
            const text = await file.text();
            const { headers, rows } = parseCSV(text);
            
            if (rows.length === 0) {
                toast.error("הקובץ ריק או לא מכיל נתונים");
                setIsProcessing(false);
                return;
            }
            
            const successfulLines = [];
            const failedLines = [];
            const unmappedColumns = new Set();

            console.log(`🔍 Processing ${rows.length} rows from CSV...`);

            // Process each row
            rows.forEach((row, index) => {
                // Skip completely empty rows
                const hasAnyData = Object.values(row).some(val => val && val.toString().trim() !== '');
                if (!hasAnyData) {
                    console.log(`⏭️ Row ${index + 2}: Skipped (completely empty)`);
                    return;
                }

                const mappedRow = mapRowToQuoteLine(row);

                console.log(`🔎 Row ${index + 2} mapped:`, {
                    section: mappedRow.section_name,
                    description: mappedRow.description?.substring(0, 50),
                    unit: mappedRow.unit,
                    quantity: mappedRow.quantity,
                    unit_price: mappedRow.unit_price
                });

                // Track unmapped columns
                mappedRow.unmappedFields.forEach(field => {
                    unmappedColumns.add(field.name);
                });

                // Validate the row
                const errors = validateRow(mappedRow, index + 2);

                if (errors.length > 0) {
                    console.log(`❌ Row ${index + 2} FAILED:`, errors);
                    failedLines.push({
                        rowNumber: index + 2,
                        errors: errors,
                        data: mappedRow,
                        originalRow: row  // Keep original for debugging
                    });
                } else {
                    // Check if this is a header row
                    if (mappedRow.is_header) {
                        const headerLine = {
                            description: mappedRow.description.toString().trim(),
                            unit: '',
                            quantity: 0,
                            unit_price: 0,
                            total_price: 0,
                            notes: mappedRow.notes || '',
                            section_name: mappedRow.section_name ? mappedRow.section_name.toString().trim() : '',
                            is_header: true  // Mark as header row
                        };
                        console.log(`📌 Row ${index + 2} imported as HEADER:`, headerLine);
                        successfulLines.push(headerLine);
                    } else {
                        // Convert to final format - regular item row
                        const quoteLine = {
                            description: mappedRow.description.toString().trim(),
                            unit: mappedRow.unit ? mappedRow.unit.toString().trim() : 'יח\'',  // Default to יח' if missing
                            quantity: parseFloat(mappedRow.quantity),
                            unit_price: mappedRow.unit_price ? parseFloat(mappedRow.unit_price) : 0,  // Default to 0
                            notes: mappedRow.notes || '',
                            section_name: mappedRow.section_name ? mappedRow.section_name.toString().trim() : '',
                            is_header: false
                        };

                        // ALWAYS calculate total (ignore total_price from file)
                        quoteLine.total_price = quoteLine.quantity * quoteLine.unit_price;

                        console.log(`✅ Row ${index + 2} imported:`, quoteLine);
                        successfulLines.push(quoteLine);
                    }
                }
            });
            
            // Set import result - show ALL failed lines, not just 10
            const result_data = {
                successCount: successfulLines.length,
                failedCount: failedLines.length,
                unmappedColumns: Array.from(unmappedColumns),
                failedLines: failedLines,  // Show ALL failed lines
                totalFailed: failedLines.length
            };
            
            setImportResult(result_data);
            
            // If we have successful lines, call the success handler
            if (successfulLines.length > 0) {
                onImportSuccess(successfulLines);
            } else {
                toast.error("לא נמצאו שורות תקינות לייבוא");
            }
            
        } catch (error) {
            console.error("Import error:", error);
            toast.error("שגיאה בעיבוד הקובץ");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setImportResult(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl bg-white shadow-xl rounded-lg max-h-[80vh] overflow-y-auto" dir="rtl">
                <div className="bg-white p-1 rounded-lg">
                    <DialogHeader className="bg-purple-50 p-4 rounded-t-lg border-b">
                        <DialogTitle className="text-slate-800 text-lg font-bold flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5" />
                            ייבוא הצעת מחיר מ-CSV
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="p-6 bg-white space-y-6">
                        {/* Excel to CSV Instructions */}
                        <Alert className="bg-amber-50 border-amber-200">
                            <Info className="w-4 h-4 text-amber-600" />
                            <AlertDescription className="text-sm text-gray-700 mt-2">
                                <strong>📊 כיצד להמיר Excel ל-CSV:</strong>
                                <ol className="list-decimal list-inside mt-2 space-y-1 mr-2">
                                    <li>פתח את קובץ ה-Excel</li>
                                    <li>לחץ על <strong>קובץ → שמור בשם</strong></li>
                                    <li>בחר בסוג קובץ: <strong>CSV (מופרד בפסיקים) (*.csv)</strong></li>
                                    <li>לחץ שמור והעלה את הקובץ כאן</li>
                                </ol>
                            </AlertDescription>
                        </Alert>

                        {/* Instructions */}
                        <Alert className="bg-blue-50 border-blue-200">
                            <AlertDescription className="text-sm text-gray-700">
                                <strong>דרישות הקובץ:</strong>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li><strong>שדות חובה:</strong> תיאור פריט + כמות בלבד</li>
                                    <li><strong>שדות אופציונליים:</strong> יחידת מידה, מחיר יחידה, סעיף, הערות</li>
                                    <li>מחיר יחידה ריק יקלט כ-0 (ללא חיוב)</li>
                                    <li>יחידת מידה ריקה מותרת (טקסט חופשי: מ', יח', ק"ג וכו')</li>
                                    <li>סעיף הוא טקסט חופשי (נקודות, מקפים, אותיות ומספרים)</li>
                                    <li>עמודות שלא מזוהות יישמרו אוטומטית בהערות</li>
                                    <li>השורה הראשונה בקובץ צריכה להכיל כותרות עמודות</li>
                                </ul>
                            </AlertDescription>
                        </Alert>

                        {/* File upload */}
                        {!importResult && (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="csv-file" className="text-gray-700 font-semibold">
                                        בחר קובץ CSV
                                    </Label>
                                    <Input
                                        id="csv-file"
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileChange}
                                        className="mt-2 bg-white border-gray-300"
                                    />
                                    {file && (
                                        <p className="text-sm text-green-600 mt-2">
                                            ✓ נבחר: {file.name}
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button type="button" variant="outline" onClick={handleClose}>
                                        ביטול
                                    </Button>
                                    <Button 
                                        onClick={handleImport}
                                        disabled={!file || isProcessing}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Upload className="w-4 h-4 ml-2 animate-spin" />
                                                מעבד קובץ...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4 ml-2" />
                                                ייבא נתונים
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Import results */}
                        {importResult && (
                            <div className="space-y-4">
                                {/* Success summary */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-green-600">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span className="font-semibold">שורות שיובאו</span>
                                        </div>
                                        <p className="text-3xl font-bold text-green-800 mt-2">
                                            {importResult.successCount}
                                        </p>
                                    </div>

                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-red-500">
                                            <XCircle className="w-5 h-5" />
                                            <span className="font-semibold">שורות שנדחו</span>
                                        </div>
                                        <p className="text-3xl font-bold text-red-800 mt-2">
                                            {importResult.failedCount}
                                        </p>
                                    </div>
                                </div>

                                {/* Unmapped columns */}
                                {importResult.unmappedColumns.length > 0 && (
                                    <Alert className="bg-yellow-50 border-yellow-200">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                        <AlertDescription className="text-sm text-gray-700 mt-2">
                                            <strong>עמודות שנשמרו בהערות:</strong>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {importResult.unmappedColumns.map((col, index) => (
                                                    <span key={index} className="bg-yellow-50 text-yellow-800 px-2 py-1 rounded text-xs">
                                                        {col}
                                                    </span>
                                                ))}
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Failed lines */}
                                {importResult.failedLines.length > 0 && (
                                    <Alert className="bg-red-50 border-red-200">
                                        <AlertDescription className="text-sm text-gray-700">
                                            <strong>שגיאות בייבוא ({importResult.totalFailed} שורות):</strong>
                                            <div className="mt-2 max-h-96 overflow-y-auto space-y-3 text-xs">
                                                {importResult.failedLines.map((failed, index) => (
                                                    <div key={index} className="border-r-4 border-red-400 pr-3 py-2 bg-white rounded">
                                                        <div className="font-bold text-red-800 mb-1">
                                                            שורה {failed.rowNumber}:
                                                        </div>
                                                        <div className="text-red-500 mb-2">
                                                            {failed.errors.map((err, i) => (
                                                                <div key={i}>• {err}</div>
                                                            ))}
                                                        </div>
                                                        {failed.originalRow && (
                                                            <div className="text-gray-500 bg-white p-2 rounded mt-1">
                                                                <strong>נתונים מקוריים:</strong>
                                                                {Object.entries(failed.originalRow).slice(0, 6).map(([key, val]) => (
                                                                    <div key={key} className="truncate">
                                                                        <span className="font-semibold">{key}:</span> "{val}"
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button onClick={handleClose} className="bg-[#D4A843] hover:bg-[#B8922E] text-white">
                                        סיום
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}