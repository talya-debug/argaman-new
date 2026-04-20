import { Project, QuoteLine, ProgressEntry } from '@/entities';

/**
 * פונקציה שמחליפה את base44.functions.invoke('getBOQExportData')
 * מביאה את כל הנתונים הנדרשים לייצוא כתב כמויות
 */
export async function getBOQExportData({ projectId }) {
    try {
        const project = await Project.get(projectId);

        let quoteLines = [];
        if (project.quote_id) {
            quoteLines = await QuoteLine.filter({ quote_id: project.quote_id }, 'order_index', 2000);
        }

        // שליפת כל רשומות ההתקדמות לפרויקט
        let progressEntries = [];
        let pgSkip = 0;
        while (true) {
            const pgBatch = await ProgressEntry.filter({ project_id: projectId }, '-entry_date', 200, pgSkip);
            progressEntries = progressEntries.concat(pgBatch);
            if (pgBatch.length < 200) break;
            pgSkip += 200;
        }

        return {
            data: {
                project,
                quoteLines,
                progressEntries,
                success: true
            }
        };
    } catch (error) {
        return {
            data: {
                error: error.message,
                success: false
            }
        };
    }
}
