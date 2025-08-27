import { toast } from '@/lib/toast';
import { Table } from '@tanstack/react-table';
import { arrayToCsv, downloadCsv } from './csv-utils';
import { columnUtils } from './table-column-factory';

/**
 * Export utilities that work with table instance and column meta
 */

/**
 * Export visible columns as CSV using column meta for headers and formatting
 */
export function exportVisibleAsCSV<T>(table: Table<T>, filename: string = 'export.csv'): void {
    void toast.promise(
        new Promise<void>((resolve, reject) => {
            try {
                const visibleColumns = table.getVisibleFlatColumns();
                const exportableColumns = columnUtils.getExportableColumns(visibleColumns);

                if (exportableColumns.length === 0) {
                    reject(new Error('No exportable columns visible'));
                    return;
                }

                // Get headers from meta
                const headers = exportableColumns.map((col) => columnUtils.getExportHeader(col));

                // Get all rows (filtered)
                const rows = table.getFilteredRowModel().rows;

                // Format data using column meta
                const exportData = rows.map((row) => {
                    const rowData: Record<string, unknown> = {};

                    exportableColumns.forEach((col, index) => {
                        const value = row.getValue(col.id!);
                        const formattedValue = columnUtils.formatForExport(col, value, row.original);
                        rowData[headers[index]] = formattedValue;
                    });

                    return rowData;
                });

                const csvContent = arrayToCsv(exportData, headers);
                downloadCsv(csvContent, filename);
                resolve();
            } catch (error) {
                reject(error instanceof Error ? error : new Error('Error generating CSV'));
            }
        }),
        {
            loading: `Generando ${filename}...`,
            success: `CSV exportado: ${filename}`,
            error: 'Error al generar CSV',
        },
    );
}

/**
 * Export selected rows as CSV
 */
export function exportSelectedAsCSV<T>(table: Table<T>, filename: string = 'selected-export.csv'): void {
    void toast.promise(
        new Promise<void>((resolve, reject) => {
            try {
                const selectedRows = table.getSelectedRowModel().rows;

                if (selectedRows.length === 0) {
                    reject(new Error('No rows selected'));
                    return;
                }

                const visibleColumns = table.getVisibleFlatColumns();
                const exportableColumns = columnUtils.getExportableColumns(visibleColumns);

                if (exportableColumns.length === 0) {
                    reject(new Error('No exportable columns visible'));
                    return;
                }

                // Get headers from meta
                const headers = exportableColumns.map((col) => columnUtils.getExportHeader(col));

                // Format selected rows using column meta
                const exportData = selectedRows.map((row) => {
                    const rowData: Record<string, unknown> = {};

                    exportableColumns.forEach((col, index) => {
                        const value = row.getValue(col.id!);
                        const formattedValue = columnUtils.formatForExport(col, value, row.original);
                        rowData[headers[index]] = formattedValue;
                    });

                    return rowData;
                });

                const csvContent = arrayToCsv(exportData, headers);
                downloadCsv(csvContent, filename);
                resolve();
            } catch (error) {
                reject(error instanceof Error ? error : new Error('Error generating CSV'));
            }
        }),
        {
            loading: `Generando ${filename}...`,
            success: `CSV exportado: ${filename}`,
            error: 'Error al generar CSV',
        },
    );
}

/**
 * Export as JSON with column meta formatting
 */
export function exportVisibleAsJSON<T>(table: Table<T>, filename: string = 'export.json'): void {
    void toast.promise(
        new Promise<void>((resolve, reject) => {
            try {
                const visibleColumns = table.getVisibleFlatColumns();
                const exportableColumns = columnUtils.getExportableColumns(visibleColumns);

                if (exportableColumns.length === 0) {
                    reject(new Error('No exportable columns visible'));
                    return;
                }

                // Get all rows (filtered)
                const rows = table.getFilteredRowModel().rows;

                // Format data using column meta
                const exportData = rows.map((row) => {
                    const rowData: Record<string, unknown> = {};

                    exportableColumns.forEach((col) => {
                        const header = columnUtils.getExportHeader(col);
                        const value = row.getValue(col.id!);
                        const formattedValue = columnUtils.formatForExport(col, value, row.original);
                        rowData[header] = formattedValue;
                    });

                    return rowData;
                });

                const jsonContent = JSON.stringify(exportData, null, 2);
                const blob = new Blob([jsonContent], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
                link.style.display = 'none';

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setTimeout(() => URL.revokeObjectURL(url), 100);
                resolve();
            } catch (error) {
                reject(error instanceof Error ? error : new Error('Error generating JSON'));
            }
        }),
        {
            loading: `Generando ${filename}...`,
            success: `JSON exportado: ${filename}`,
            error: 'Error al generar JSON',
        },
    );
}

/**
 * Build export URL for server-side export with current table state
 */
export function buildServerExportUrl<T>(baseUrl: string, table: Table<T>, format: 'csv' | 'json' | 'pdf' = 'csv'): string {
    const url = new URL(baseUrl);

    // Add table state parameters
    const state = table.getState();

    // Sorting
    if (state.sorting.length > 0) {
        url.searchParams.set('sort', JSON.stringify(state.sorting));
    }

    // Global filter
    if (state.globalFilter) {
        url.searchParams.set('search', state.globalFilter);
    }

    // Column filters
    if (state.columnFilters.length > 0) {
        url.searchParams.set('filters', JSON.stringify(state.columnFilters));
    }

    // Selected rows
    const selectedIds = Object.keys(state.rowSelection).filter((id) => state.rowSelection[id]);
    if (selectedIds.length > 0) {
        url.searchParams.set('selected', JSON.stringify(selectedIds));
    }

    // Visible/exportable columns
    const visibleColumns = table.getVisibleFlatColumns();
    const exportableColumns = columnUtils.getExportableColumns(visibleColumns);
    const columnIds = exportableColumns.map((col) => col.id!).filter(Boolean);
    if (columnIds.length > 0) {
        url.searchParams.set('columns', JSON.stringify(columnIds));
    }

    // Format
    url.searchParams.set('format', format);

    return url.toString();
}
