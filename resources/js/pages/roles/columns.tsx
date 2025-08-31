import { ConfirmAlert } from '@/components/dialogs/confirm-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import React from 'react';

export type TRole = {
    id: number;
    name: string;
    guard_name: string;
    permissions_count: number;
    permissions?: Array<{ id: number; name: string; description?: string }>;
    users_count: number;
    users?: string[];
    is_active: boolean;
    created_at: string;
};

function RoleActionsCell({ role }: { role: TRole }) {
    const [open, setOpen] = React.useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href={`/roles/${role.id}`} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/roles/${role.id}/edit`} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={() => {
                            // Defer to avoid focus conflicts with closing menu
                            setTimeout(() => setOpen(true), 100);
                        }}
                        className="text-red-600 focus:text-red-700 dark:text-red-400 dark:focus:text-red-300"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmAlert
                open={open}
                onOpenChange={setOpen}
                title="Eliminar Rol"
                description={`¿Está seguro de eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar"
                onConfirm={async () => {
                    await new Promise<void>((resolve, reject) => {
                        router.delete(`/roles/${role.id}`, {
                            preserveState: false,
                            preserveScroll: true,
                            onSuccess: () => resolve(),
                            onError: () => reject(new Error('delete_failed')),
                        });
                    });
                }}
                toastMessages={{
                    loading: `Eliminando "${role.name}"…`,
                    success: 'Rol eliminado',
                    error: 'No se pudo eliminar el rol',
                }}
            />
        </>
    );
}

export const columns: ColumnDef<TRole>[] = [
    {
        accessorKey: 'id',
        header: '#',
        meta: {
            exportable: true,
        },
        enableSorting: true,
    },
    {
        accessorKey: 'name',
        header: 'Nombre',
        meta: {
            exportable: true,
        },
        enableSorting: true,
        cell: ({ row, getValue }) => {
            const name = String(getValue() ?? '');
            const isActive = row.original.is_active;
            return (
                <div className="flex min-w-0 items-center gap-2">
                    <span
                        className={'h-2 w-2 shrink-0 rounded-full ' + (isActive ? 'bg-emerald-500' : 'bg-gray-400')}
                        aria-label={isActive ? 'Activo' : 'Inactivo'}
                        title={isActive ? 'Activo' : 'Inactivo'}
                    />
                    <span className="truncate" title={name}>
                        {name}
                    </span>
                </div>
            );
        },
    },
    {
        accessorKey: 'guard_name',
        header: 'Guard',
        meta: {
            exportable: true,
        },
        enableSorting: true,
    },
    {
        accessorKey: 'permissions',
        header: 'Permisos',
        meta: {
            exportable: true,
        },
        enableSorting: false,
        cell: ({ row }) => {
            const permissions = row.original.permissions || [];
            const count = row.original.permissions_count || 0;
            const allNames: string[] = permissions.map((perm) =>
                typeof perm === 'object' && perm?.description
                    ? String(perm.description)
                    : typeof perm === 'object' && perm?.name
                      ? String(perm.name)
                      : String(perm),
            );

            if (count === 0) {
                return <span className="text-muted-foreground">Sin permisos</span>;
            }

            // Show first 2 permissions and a count badge if more
            const displayPerms = permissions.slice(0, 2);
            const remaining = Math.max(0, count - displayPerms.length);

            return (
                <TooltipProvider>
                    <div className="flex max-w-[520px] flex-wrap items-center gap-1 overflow-hidden">
                        {displayPerms.map((perm, idx) => {
                            // Use description if available, fallback to name
                            const permDisplay =
                                typeof perm === 'object' && perm?.description
                                    ? String(perm.description)
                                    : typeof perm === 'object' && perm?.name
                                      ? String(perm.name)
                                      : String(perm);
                            return (
                                <Tooltip key={`perm-${row.original.id}-${idx}`}>
                                    <TooltipTrigger asChild>
                                        <Badge variant="secondary" className="max-w-[180px] truncate text-xs">
                                            {permDisplay}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>{permDisplay}</TooltipContent>
                                </Tooltip>
                            );
                        })}
                        {remaining > 0 && (
                            <Popover>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                            <Badge key={`more-${row.original.id}`} variant="outline" className="cursor-pointer text-xs">
                                                +{remaining}
                                            </Badge>
                                        </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Ver permisos restantes</TooltipContent>
                                </Tooltip>
                                <PopoverContent className="w-80">
                                    <div className="flex max-h-64 flex-wrap gap-1 overflow-auto">
                                        {allNames.map((name, i) => (
                                            <Badge key={`all-${row.original.id}-${i}`} variant="secondary" className="text-xs">
                                                {name}
                                            </Badge>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </TooltipProvider>
            );
        },
    },
    {
        accessorKey: 'users_count',
        header: 'Usuarios',
        meta: {
            exportable: true,
        },
        enableSorting: true,
        cell: ({ row, getValue }) => {
            const count = getValue() as number;
            const users = (row.original.users || []) as string[];

            if (count === 0) {
                return <span className="text-muted-foreground">Sin usuarios</span>;
            }

            const displayUsers = users.slice(0, 2);
            const remaining = Math.max(0, count - displayUsers.length);

            return (
                <TooltipProvider>
                    <div className="flex flex-wrap items-center justify-center gap-1">
                        {displayUsers.map((name, idx) => (
                            <Tooltip key={`user-${row.original.id}-${idx}`}>
                                <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="max-w-[180px] truncate text-xs">
                                        {name}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>{name}</TooltipContent>
                            </Tooltip>
                        ))}
                        {remaining > 0 && (
                            <Popover>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <PopoverTrigger asChild>
                                            <Badge key={`more-users-${row.original.id}`} variant="outline" className="cursor-pointer text-xs">
                                                +{remaining}
                                            </Badge>
                                        </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Ver usuarios restantes</TooltipContent>
                                </Tooltip>
                                <PopoverContent className="w-80">
                                    <div className="flex max-h-64 flex-wrap gap-1 overflow-auto">
                                        {users.length > 0 ? (
                                            users.map((name, i) => (
                                                <Badge key={`all-users-${row.original.id}-${i}`} variant="secondary" className="text-xs">
                                                    {name}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground text-sm">Sin usuarios</span>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </TooltipProvider>
            );
        },
    },
    {
        accessorKey: 'is_active',
        header: 'Estado',
        meta: {
            exportable: true,
        },
        enableSorting: true,
        cell: ({ getValue }) => {
            const isActive = getValue() as boolean;
            return (
                <Badge variant={isActive ? 'default' : 'destructive'} className="font-medium">
                    {isActive ? 'Activo' : 'Inactivo'}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: 'Creado',
        meta: {
            exportable: true,
        },
        enableSorting: true,
        cell: ({ getValue }) => {
            const value = getValue() as string;
            const d = new Date(value);
            const short = format(d, 'dd MMM yyyy', { locale: es });
            const full = format(d, 'PPpp', { locale: es });
            const relative = formatDistanceToNow(d, { locale: es, addSuffix: true });
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="whitespace-nowrap" title={full}>
                                {short}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="flex flex-col gap-0.5">
                                <span>{full}</span>
                                <span className="text-muted-foreground">{relative}</span>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        },
    },
    {
        id: 'actions',
        header: 'Acciones',
        meta: {
            exportable: false,
        },
        enableSorting: false,
        cell: ({ row }) => {
            const role = row.original;
            return <RoleActionsCell role={role} />;
        },
    },
];
