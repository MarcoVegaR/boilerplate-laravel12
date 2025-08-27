import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import * as React from 'react';

export interface TableToolbarProps {
    children?: React.ReactNode;
    globalFilter?: string;
    onGlobalFilterChange?: (value: string) => void;
    onExportClick?: () => void;
    className?: string;
    searchPlaceholder?: string;
}

export function TableToolbar({
    children,
    globalFilter = '',
    onGlobalFilterChange,
    onExportClick,
    className,
    searchPlaceholder = 'Buscar...',
}: TableToolbarProps) {
    const [searchValue, setSearchValue] = React.useState(globalFilter);

    React.useEffect(() => {
        setSearchValue(globalFilter);
    }, [globalFilter]);

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
        onGlobalFilterChange?.(value);
    };

    const handleClearSearch = () => {
        setSearchValue('');
        onGlobalFilterChange?.('');
    };

    return (
        <div className={cn('flex items-center justify-between gap-2 p-1', className)}>
            <div className="flex flex-1 items-center space-x-2">
                {/* Global Search */}
                {onGlobalFilterChange && (
                    <div className="relative flex max-w-sm items-center">
                        <Search className="text-muted-foreground absolute left-2 h-4 w-4" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="h-8 w-[150px] pl-8 lg:w-[250px]"
                        />
                        {searchValue && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 h-full px-2 py-0 hover:bg-transparent"
                                onClick={handleClearSearch}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}

                {/* Custom filters/components slot */}
                {children}
            </div>

            <div className="flex items-center space-x-2">
                {/* Export button */}
                {onExportClick && (
                    <Button variant="outline" size="sm" onClick={onExportClick}>
                        Exportar
                    </Button>
                )}
            </div>
        </div>
    );
}
