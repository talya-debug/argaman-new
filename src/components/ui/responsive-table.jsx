import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * רכיב טבלה רספונסיבי - מציג טבלה בדסקטופ וכרטיסים במובייל
 *
 * Props:
 * - data: מערך הנתונים
 * - columns: מערך עמודות [{key, label, render}]
 * - onRowClick: פונקציה בלחיצה על שורה
 * - mobileCardRender: פונקציה לרינדור כרטיס מובייל (item, index) => JSX
 * - className: קלאס נוסף
 * - emptyMessage: הודעה כשאין נתונים
 */
export default function ResponsiveTable({
  data = [],
  columns = [],
  onRowClick,
  mobileCardRender,
  className = "",
  emptyMessage = "אין נתונים להצגה"
}) {
  const isMobile = useIsMobile();

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  // תצוגת כרטיסים במובייל
  if (isMobile && mobileCardRender) {
    return (
      <div className={`space-y-3 p-3 ${className}`}>
        {data.map((item, index) => mobileCardRender(item, index))}
      </div>
    );
  }

  // תצוגת טבלה בדסקטופ
  return (
    <div className={`overflow-x-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow className="bg-[#0f1117] border-b border-[#2d3348]">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className="text-right font-semibold text-slate-300"
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, rowIndex) => (
            <TableRow
              key={item.id || rowIndex}
              className="hover:bg-[#252836] transition-colors border-b border-[#2d3348] cursor-pointer"
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className="text-slate-200">
                  {col.render ? col.render(item) : item[col.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
