import {
    ColumnDef,
    ColumnFiltersState,
    OnChangeFn,
    RowSelectionState,
    SortingState,
    Table,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { BulkActionBar } from './BulkActionBar';
import { ColumnVisibilityMenu } from './ColumnVisibilityMenu';
import { SortableHeader } from './SortableHeader';
import { TableToolbar } from './TableToolbar';

export type PaginationMode = 'offset' | 'simple' | 'cursor' | 'server';

export interface DataTableProps<TData = unknown> {
    // Core data and columns
    columns: ColumnDef<TData, unknown>[];
    data: TData[];

    // Pagination (manual)
    rowCount?: number;
    pageIndex: number;
    pageSize: number;
    onPageChange: (index: number) => void;
    onPageSizeChange: (size: number) => void;

    // Sorting (manual)
    sorting: SortingState;
    onSortingChange: OnChangeFn<SortingState>;

    // Filtering (manual)
    globalFilter?: string;
    onGlobalFilterChange?: (filter: string) => void;
    columnFilters?: ColumnFiltersState;
    onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;

    // Column visibility (controlled)
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;

    // Row selection (controlled)
    rowSelection?: RowSelectionState;
    onRowSelectionChange?: OnChangeFn<RowSelectionState>;

    // UI customization
    isLoading?: boolean;
    emptyState?: React.ReactNode;
    toolbar?: React.ReactNode;
    onExportClick?: (table: Table<TData>) => void;
    onDeleteSelectedClick?: () => void;
    paginationMode?: PaginationMode;
    getRowId?: (originalRow: TData, index: number) => string;
    enableRowSelection?: boolean;
    enableColumnVisibility?: boolean;
    enableGlobalFilter?: boolean;
    permissions?: Record<string, boolean>;
    className?: string;
}

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

export function DataTable<TData>({
    columns,
    data,
    rowCount = data.length,
    pageIndex,
    pageSize,
    onPageChange,
    onPageSizeChange,
    sorting,
    onSortingChange,
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    columnVisibility,
    onColumnVisibilityChange,
    rowSelection,
    onRowSelectionChange,
    isLoading = false,
    emptyState,
    toolbar,
    onExportClick,
    onDeleteSelectedClick,
    paginationMode: _paginationMode = 'server',
    getRowId,
    enableRowSelection = true,
    enableColumnVisibility = true,
    enableGlobalFilter = true,
    permissions = {},
    className,
}: DataTableProps<TData>) {
    const pageCount = Math.ceil(rowCount / pageSize);

    // Add selection column if enabled
    const tableColumns = React.useMemo(() => {
        if (!enableRowSelection) return columns;

        const selectionColumn: ColumnDef<TData, unknown> = {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Seleccionar todos"
                />
            ),
            cell: ({ row }) => (
                <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Seleccionar fila" />
            ),
            enableSorting: false,
            enableHiding: false,
            size: 40,
        };

        return [selectionColumn, ...columns];
    }, [columns, enableRowSelection]);

    const table = useReactTable({
        data,
        columns: tableColumns,
        state: {
            sorting,
            columnVisibility: columnVisibility || {},
            rowSelection: rowSelection || {},
            pagination: { pageIndex, pageSize },
            globalFilter,
            columnFilters: columnFilters || [],
        },
        pageCount,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        enableRowSelection: enableRowSelection,
        onSortingChange,
        onColumnVisibilityChange,
        onRowSelectionChange,
        onPaginationChange: (updater) => {
            const newPagination = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
            onPageChange(newPagination.pageIndex);
            onPageSizeChange(newPagination.pageSize);
        },
        onGlobalFilterChange,
        onColumnFiltersChange,
        getCoreRowModel: getCoreRowModel(),
        getRowId,
    });

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedCount = selectedRows.length;

    // Extract permissions
    const { canCreate: _canCreate, canEdit: _canEdit, canDelete: _canDelete, canExport, canBulkDelete } = permissions || {};

    // Column visibility options for menu
    const columnVisibilityOptions = React.useMemo(
        () =>
            table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => ({
                    id: column.id,
                    label: typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
                    canHide: column.getCanHide(),
                })),
        [table],
    );

    if (isLoading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <div className="text-muted-foreground">Cargando...</div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center">
                {emptyState || <div className="text-muted-foreground text-center">No hay datos disponibles</div>}
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <TableToolbar
                    globalFilter={globalFilter}
                    onGlobalFilterChange={enableGlobalFilter ? onGlobalFilterChange : undefined}
                    onExportClick={canExport && onExportClick ? () => onExportClick(table) : undefined}
                >
                    {toolbar}
                </TableToolbar>

                {enableColumnVisibility && (
                    <ColumnVisibilityMenu
                        columns={columnVisibilityOptions}
                        columnVisibility={columnVisibility || {}}
                        onColumnVisibilityChange={onColumnVisibilityChange || (() => {})}
                    />
                )}
            </div>

            {/* Bulk Action Bar */}
            {enableRowSelection && (
                <BulkActionBar
                    selectedCount={selectedCount}
                    onDeleteSelected={canBulkDelete ? onDeleteSelectedClick : undefined}
                    onClearSelection={() => table.toggleAllRowsSelected(false)}
                />
            )}

            {/* Table */}
            <div className="rounded-md border">
                <table className="w-full">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b">
                                {headerGroup.headers.map((header) => {
                                    const sortDirection = header.column.getIsSorted();
                                    const canSort = header.column.getCanSort();

                                    return (
                                        <SortableHeader
                                            key={header.id}
                                            sortDirection={sortDirection || false}
                                            onSort={canSort ? () => header.column.toggleSorting() : undefined}
                                            className={cn(
                                                'text-muted-foreground h-12 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0',
                                                header.column.getCanHide() && !header.column.getIsVisible() && 'hidden',
                                            )}
                                        >
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </SortableHeader>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"
                                    data-state={row.getIsSelected() && 'selected'}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="p-3 align-middle [&:has([role=checkbox])]:pr-0">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={tableColumns.length} className="h-24 text-center">
                                    {emptyState || 'No hay resultados.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Filas por página</p>
                        <Select value={`${pageSize}`} onValueChange={(value) => onPageSizeChange(Number(value))}>
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {DEFAULT_PAGE_SIZES.map((size) => (
                                    <SelectItem key={size} value={`${size}`}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Página {pageIndex + 1} de {pageCount}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => onPageChange(0)} disabled={pageIndex === 0}>
                            <span className="sr-only">Ir a la primera página</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="h-8 w-8 p-0" onClick={() => onPageChange(pageIndex - 1)} disabled={pageIndex === 0}>
                            <span className="sr-only">Ir a la página anterior</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => onPageChange(pageIndex + 1)}
                            disabled={pageIndex >= pageCount - 1}
                        >
                            <span className="sr-only">Ir a la página siguiente</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => onPageChange(pageCount - 1)}
                            disabled={pageIndex >= pageCount - 1}
                        >
                            <span className="sr-only">Ir a la última página</span>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="text-muted-foreground text-xs">{selectedCount > 0 && `${selectedCount} de ${rowCount} fila(s) seleccionada(s).`}</div>
            </div>
        </div>
    );
}
