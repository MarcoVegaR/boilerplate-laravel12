import { ConfirmAlert } from '@/components/dialogs/confirm-alert';
import { FieldError } from '@/components/forms/field-error';
import { FormActions } from '@/components/forms/form-actions';
import { FormSection } from '@/components/forms/form-section';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import AppLayout from '@/layouts/app-layout';
import type { FormDataConvertible } from '@inertiajs/core';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ChevronDown, ChevronRight, ChevronUp, Database, FileText, Info, Lock, Search, Settings, Shield, Users } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export interface Permission {
    value: number;
    label: string;
    name: string;
    guard: string;
}

// (moved layout assignment to bottom to match project pattern)

export interface RoleFormData {
    name: string;
    guard_name: string;
    is_active: boolean;
    permissions_ids: number[];
    _version?: string | null;
    [key: string]: FormDataConvertible;
}

export interface RoleFormProps {
    mode: 'create' | 'edit';
    initial?: {
        id?: number;
        name?: string;
        guard_name?: string;
        is_active?: boolean;
        permissions_ids?: number[];
        updated_at?: string;
    };
    // When used as an embedded component (e.g., RolePicker quick-create)
    options?: {
        guards: Array<{ value: string; label: string }>;
        permissions: Permission[];
    };
    // When rendered directly as a page by Inertia (HandlesForm), data may come flat
    guards?: Array<{ value: string; label: string }>;
    permissions?: Permission[];
    model?: {
        id?: number;
        name?: string;
        guard_name?: string;
        is_active?: boolean;
        permissions_ids?: number[];
        updated_at?: string;
    };
    can: Record<string, boolean>;
    onSaved?: () => void;
}

// Icon mapping for permission categories
const categoryIcons: Record<string, React.ElementType> = {
    roles: Shield,
    users: Users,
    settings: Settings,
    permissions: Lock,
    audit: FileText,
    default: Database,
};

const getCategoryIcon = (category: string) => {
    return categoryIcons[category.toLowerCase()] || categoryIcons.default;
};

// Color mapping for permission category icons
const categoryIconColors: Record<string, string> = {
    roles: 'text-blue-500 dark:text-blue-400',
    users: 'text-purple-500 dark:text-purple-400',
    settings: 'text-green-600 dark:text-green-400',
    permissions: 'text-amber-500 dark:text-amber-400',
    audit: 'text-rose-500 dark:text-rose-400',
    default: 'text-slate-500 dark:text-slate-400',
};

const getCategoryColor = (category: string) => {
    return categoryIconColors[category.toLowerCase()] || categoryIconColors.default;
};

// Category label translations (Spanish)
const categoryLabels: Record<string, string> = {
    settings: 'Configuración',
    users: 'Usuarios',
};

const getCategoryLabel = (category: string) => {
    const key = category.toLowerCase();
    return categoryLabels[key] ?? category;
};

export default function RoleForm(props: RoleFormProps) {
    const { mode, onSaved } = props; // _can is currently unused
    // Accept both 'initial' and 'model' (from Inertia HandlesForm)
    const initial = props.initial ?? props.model;
    // Resolve options from either nested 'options' or flat props
    const resolvedOptions = {
        guards: props.options?.guards ?? props.guards ?? [],
        permissions: props.options?.permissions ?? props.permissions ?? [],
    };
    const firstErrorRef = useRef<HTMLInputElement>(null);
    const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
    const resumeNavRef = useRef<null | (() => void)>(null);

    const form = useForm<RoleFormData>({
        name: initial?.name ?? '',
        guard_name: initial?.guard_name ?? 'web',
        is_active: initial?.is_active ?? true,
        permissions_ids: initial?.permissions_ids ?? [],
        _version: mode === 'edit' ? (initial?.updated_at ?? null) : null,
    });

    // Track unsaved changes
    const initialData = {
        name: initial?.name ?? '',
        guard_name: initial?.guard_name ?? 'web',
        is_active: initial?.is_active ?? true,
        permissions_ids: initial?.permissions_ids ?? [],
    };

    const { clearUnsavedChanges } = useUnsavedChanges(form.data, initialData, !form.processing, {
        ignoreUnderscored: true,
        onConfirm: (resume) => {
            resumeNavRef.current = resume;
            setLeaveConfirmOpen(true);
        },
    });

    // Filter permissions by selected guard
    const [permSearch, setPermSearch] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

    // Group permissions by category
    const groupedPermissions = useMemo(() => {
        const guardPermissions = (resolvedOptions.permissions || [])
            .filter((permission) => permission.guard === form.data.guard_name)
            .filter((p) => (permSearch.trim() === '' ? true : p.label.toLowerCase().includes(permSearch.toLowerCase())));

        const groups = new Map<string, Permission[]>();

        guardPermissions.forEach((permission) => {
            // Extract category from permission name (e.g., "roles.create" -> "roles")
            const category = permission.name.split('.')[0] || 'general';

            if (!groups.has(category)) {
                groups.set(category, []);
            }
            groups.get(category)!.push(permission);
        });

        // Convert to array and sort by category name
        return Array.from(groups.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, perms]) => ({
                category,
                permissions: perms.sort((a, b) => a.label.localeCompare(b.label)),
                icon: getCategoryIcon(category),
                color: getCategoryColor(category),
                selectedCount: perms.filter((p) => form.data.permissions_ids.includes(p.value)).length,
                totalCount: perms.length,
            }));
    }, [resolvedOptions.permissions, form.data.guard_name, form.data.permissions_ids, permSearch]);

    // Handle expand/collapse all
    const handleExpandAll = () => {
        setExpandedGroups(groupedPermissions.map((g) => g.category));
    };

    const handleCollapseAll = () => {
        setExpandedGroups([]);
    };

    // Handle select all in a group
    const handleSelectGroup = (category: string) => {
        const group = groupedPermissions.find((g) => g.category === category);
        if (!group) return;

        const groupIds = group.permissions.map((p) => p.value);
        const merged = Array.from(new Set([...form.data.permissions_ids, ...groupIds]));
        form.setData('permissions_ids', merged);
    };

    // Handle deselect all in a group
    const handleDeselectGroup = (category: string) => {
        const group = groupedPermissions.find((g) => g.category === category);
        if (!group) return;

        const groupIds = new Set(group.permissions.map((p) => p.value));
        const remaining = form.data.permissions_ids.filter((id) => !groupIds.has(id));
        form.setData('permissions_ids', remaining);
    };

    // Handle guard change
    const handleGuardChange = (newGuard: string) => {
        form.setData('guard_name', newGuard);

        // Clear permissions that don't belong to the new guard
        const validPermissionIds = (resolvedOptions.permissions || []).filter((p) => p.guard === newGuard).map((p) => p.value);

        const filteredIds = form.data.permissions_ids.filter((id) => validPermissionIds.includes(id));

        if (filteredIds.length !== form.data.permissions_ids.length) {
            form.setData('permissions_ids', filteredIds);
        }

        // Reload permissions for the new guard
        router.reload({
            only: ['permissions'],
            data: { guard_name: newGuard },
        });
    };

    // Handle permission toggle
    const togglePermission = (permissionId: number) => {
        const current = form.data.permissions_ids;
        const updated = current.includes(permissionId) ? current.filter((id) => id !== permissionId) : [...current, permissionId];

        form.setData('permissions_ids', updated);
    };

    // Handle cancel
    const handleCancel = () => {
        router.visit(route('roles.index'), {
            preserveScroll: true,
        });
    };

    // Handle submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // We are submitting (non-GET). Ensure the unsaved changes guard does not interfere
        clearUnsavedChanges();

        // Frontend sanitization: ensure permissions_ids are valid integers and deduplicated
        const sanitizedPermissions = Array.from(
            new Set(
                (form.data.permissions_ids || [])
                    .map((v) => (typeof v === 'string' ? Number(v) : v))
                    .filter((v) => Number.isFinite(v) && Number.isInteger(v) && v >= 0),
            ),
        );
        // Use transform so we don't rely on async state updates before submit
        form.transform((data) => ({
            ...data,
            permissions_ids: sanitizedPermissions,
            is_active: !!data.is_active,
        }));

        if (mode === 'create') {
            form.post(route('roles.store'), {
                onSuccess: () => {
                    if (onSaved) {
                        onSaved();
                    }
                },
                onError: (errors) => {
                    toast.error('Error al crear el rol');
                    // Focus first error field
                    setTimeout(() => {
                        const firstError = Object.keys(errors)[0];
                        const element = document.querySelector(`[name="${firstError}"]`);
                        if (element instanceof HTMLElement) {
                            element.focus();
                        }
                    }, 100);
                },
            });
        } else {
            const roleId = Number(initial?.id);
            if (!Number.isInteger(roleId)) {
                toast.error('ID de rol inválido.');
                return;
            }
            form.put(route('roles.update', roleId), {
                onSuccess: () => {
                    if (onSaved) {
                        onSaved();
                    }
                },
                onError: (errors) => {
                    toast.error('Error al actualizar el rol');
                    // Focus first error field
                    setTimeout(() => {
                        const firstError = Object.keys(errors)[0];
                        const element = document.querySelector(`[name="${firstError}"]`);
                        if (element instanceof HTMLElement) {
                            element.focus();
                        }
                    }, 100);
                },
            });
        }
    };

    // Focus first error on validation errors
    useEffect(() => {
        if (Object.keys(form.errors).length > 0) {
            firstErrorRef.current?.focus();
        }
    }, [form.errors]);

    return (
        <TooltipProvider delayDuration={200}>
            <Head title={mode === 'create' ? 'Crear Rol' : 'Editar Rol'} />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
                {/* Breadcrumb Ribbon (match index/show style) */}
                <div className="border-b border-gray-200 bg-white/50 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/50">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="py-4">
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <Link
                                            href="/dashboard"
                                            className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            Inicio
                                        </Link>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator>
                                        <ChevronRight className="h-3 w-3 text-gray-400" />
                                    </BreadcrumbSeparator>
                                    <BreadcrumbItem>
                                        <Link
                                            href="/roles"
                                            className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            Roles
                                        </Link>
                                    </BreadcrumbItem>
                                    {mode === 'create' ? (
                                        <>
                                            <BreadcrumbSeparator>
                                                <ChevronRight className="h-3 w-3 text-gray-400" />
                                            </BreadcrumbSeparator>
                                            <BreadcrumbItem>
                                                <BreadcrumbPage className="font-medium text-gray-900 dark:text-gray-100">Crear</BreadcrumbPage>
                                            </BreadcrumbItem>
                                        </>
                                    ) : (
                                        <>
                                            <BreadcrumbSeparator>
                                                <ChevronRight className="h-3 w-3 text-gray-400" />
                                            </BreadcrumbSeparator>
                                            <BreadcrumbItem>
                                                <Link
                                                    href={route('roles.show', initial?.id)}
                                                    className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                >
                                                    {initial?.name ?? 'Rol'}
                                                </Link>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator>
                                                <ChevronRight className="h-3 w-3 text-gray-400" />
                                            </BreadcrumbSeparator>
                                            <BreadcrumbItem>
                                                <BreadcrumbPage className="font-medium text-gray-900 dark:text-gray-100">Editar</BreadcrumbPage>
                                            </BreadcrumbItem>
                                        </>
                                    )}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </div>
                </div>
                <div className="py-8">
                    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                        <form onSubmit={handleSubmit} className="bg-card space-y-6 rounded-2xl border p-6 shadow-sm lg:p-7">
                            <FormSection title="Información básica" description="Define el nombre y el guard del rol">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* Name field */}
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="flex items-center gap-2">
                                            Nombre del rol <span className="text-destructive">*</span>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span
                                                        tabIndex={0}
                                                        role="button"
                                                        aria-label="Ayuda: nombre del rol"
                                                        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex h-4 w-4 items-center justify-center rounded focus-visible:ring-2 focus-visible:outline-none"
                                                    >
                                                        <Info className="h-3 w-3" />
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" align="start" className="max-w-xs">
                                                    <p>
                                                        Nombre tal como aparecerá en el sistema (p. ej., Administrador, Editor). Debe ser único y
                                                        claro.
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </Label>
                                        <Input
                                            ref={form.errors.name ? firstErrorRef : null}
                                            id="name"
                                            name="name"
                                            type="text"
                                            value={form.data.name}
                                            onChange={(e) => form.setData('name', e.target.value)}
                                            maxLength={100}
                                            required
                                            disabled={form.processing}
                                            aria-invalid={!!form.errors.name}
                                            aria-describedby={form.errors.name ? 'name-error' : undefined}
                                        />
                                        {form.errors.name && <FieldError id="name-error" message={form.errors.name} />}
                                    </div>

                                    {/* Guard field */}
                                    <div className="space-y-2">
                                        <Label htmlFor="guard_name" className="flex items-center gap-2">
                                            Guard <span className="text-destructive">*</span>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span
                                                        tabIndex={0}
                                                        role="button"
                                                        aria-label="Ayuda: guard del rol"
                                                        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex h-4 w-4 items-center justify-center rounded focus-visible:ring-2 focus-visible:outline-none"
                                                    >
                                                        <Info className="h-3 w-3" />
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" align="start" className="max-w-xs">
                                                    <p>
                                                        Ámbito de autenticación del rol. "web" para usuarios del sistema; "api" para integraciones o
                                                        clientes externos.
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </Label>
                                        <Select value={form.data.guard_name} onValueChange={handleGuardChange} disabled={form.processing}>
                                            <SelectTrigger
                                                id="guard_name"
                                                aria-invalid={!!form.errors.guard_name}
                                                aria-describedby={form.errors.guard_name ? 'guard-error' : undefined}
                                            >
                                                <SelectValue placeholder="Selecciona un guard" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {resolvedOptions.guards.map((guard) => (
                                                    <SelectItem key={guard.value} value={guard.value}>
                                                        {guard.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {form.errors.guard_name && <FieldError id="guard-error" message={form.errors.guard_name} />}
                                    </div>
                                </div>

                                {/* Active status (only in edit) */}
                                {mode === 'edit' && (
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="is_active"
                                                checked={form.data.is_active}
                                                onCheckedChange={(checked) => form.setData('is_active', checked)}
                                                disabled={form.processing}
                                                aria-describedby="active-description"
                                            />
                                            <Label htmlFor="is_active" className="cursor-pointer">
                                                Rol activo
                                            </Label>
                                        </div>
                                        <p id="active-description" className="text-muted-foreground text-sm">
                                            Los roles inactivos no pueden ser asignados a nuevos usuarios
                                        </p>
                                    </>
                                )}
                            </FormSection>

                            <FormSection title="Permisos" description="Asigna los permisos específicos que tendrá este rol en el sistema">
                                {groupedPermissions.length === 0 ? (
                                    <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
                                        <Lock className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="text-muted-foreground mt-2 text-sm">No hay permisos disponibles para el guard seleccionado</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Search and controls */}
                                        <div className="sticky top-0 z-10 -mx-4 -mt-4 bg-white p-4 dark:bg-gray-800">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                                    <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-medium">
                                                        {form.data.permissions_ids.length} /{' '}
                                                        {groupedPermissions.reduce((acc, g) => acc + g.totalCount, 0)}
                                                    </Badge>
                                                    <span>seleccionados</span>
                                                    <span aria-hidden="true">·</span>
                                                    <Button type="button" variant="ghost" size="sm" onClick={handleExpandAll} className="gap-1">
                                                        <ChevronDown className="h-3 w-3" />
                                                        Expandir todos
                                                    </Button>
                                                    <span aria-hidden="true">·</span>
                                                    <Button type="button" variant="ghost" size="sm" onClick={handleCollapseAll} className="gap-1">
                                                        <ChevronUp className="h-3 w-3" />
                                                        Colapsar todos
                                                    </Button>
                                                </div>
                                                <div className="relative w-full sm:w-72">
                                                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                                    <Input
                                                        placeholder="Buscar permisos"
                                                        value={permSearch}
                                                        onChange={(e) => setPermSearch(e.target.value)}
                                                        className="pl-9"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Grouped permissions accordion */}
                                        <Accordion
                                            type="multiple"
                                            value={expandedGroups}
                                            onValueChange={setExpandedGroups}
                                            className="w-full space-y-2"
                                        >
                                            {groupedPermissions.map((group) => {
                                                const Icon = group.icon;
                                                const isFullySelected = group.selectedCount === group.totalCount;
                                                const groupState: boolean | 'indeterminate' = isFullySelected
                                                    ? true
                                                    : group.selectedCount > 0
                                                      ? 'indeterminate'
                                                      : false;

                                                return (
                                                    <AccordionItem
                                                        key={group.category}
                                                        value={group.category}
                                                        className="bg-card rounded-xl border px-4 shadow-sm"
                                                    >
                                                        <AccordionTrigger className="hover:no-underline">
                                                            <div className="flex w-full items-center justify-between pr-4">
                                                                <div className="flex items-center gap-3">
                                                                    <Icon className={`h-4 w-4 ${group.color}`} />
                                                                    <span className="text-sm font-medium capitalize">
                                                                        {getCategoryLabel(group.category)}
                                                                    </span>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="ml-2 rounded-full px-2.5 py-0.5 text-xs font-medium"
                                                                    >
                                                                        {group.selectedCount} / {group.totalCount}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="flex items-center justify-end gap-2 pt-4 pb-2">
                                                                <Checkbox
                                                                    id={`select-group-${group.category}`}
                                                                    checked={groupState}
                                                                    onCheckedChange={(value) => {
                                                                        if (value) {
                                                                            handleSelectGroup(group.category);
                                                                        } else {
                                                                            handleDeselectGroup(group.category);
                                                                        }
                                                                    }}
                                                                    disabled={form.processing}
                                                                    className="data-[state=checked]:border-primary data-[state=checked]:bg-primary focus-visible:ring-primary/50 mt-0.5 border-2 border-slate-400 shadow-sm hover:border-slate-500 dark:border-slate-500 dark:hover:border-slate-400"
                                                                />
                                                                <Label
                                                                    htmlFor={`select-group-${group.category}`}
                                                                    className="cursor-pointer text-xs font-medium sm:text-sm"
                                                                >
                                                                    Seleccionar todos
                                                                </Label>
                                                            </div>
                                                            <div className="grid gap-3 pb-2 sm:grid-cols-2">
                                                                {group.permissions.map((permission) => (
                                                                    <div key={permission.value} className="flex items-start space-x-2">
                                                                        <Checkbox
                                                                            id={`permission-${permission.value}`}
                                                                            checked={form.data.permissions_ids.includes(permission.value)}
                                                                            onCheckedChange={() => togglePermission(permission.value)}
                                                                            disabled={form.processing}
                                                                            className="data-[state=checked]:border-primary data-[state=checked]:bg-primary focus-visible:ring-primary/50 mt-0.5 border-2 border-slate-400 shadow-sm hover:border-slate-500 dark:border-slate-500 dark:hover:border-slate-400"
                                                                        />
                                                                        <Label
                                                                            htmlFor={`permission-${permission.value}`}
                                                                            className="flex-1 cursor-pointer text-sm leading-relaxed font-normal"
                                                                        >
                                                                            <span className="block">{permission.label}</span>
                                                                        </Label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                );
                                            })}
                                        </Accordion>
                                    </div>
                                )}
                                {form.errors.permissions_ids && <FieldError message={form.errors.permissions_ids} />}
                            </FormSection>
                            <p className="text-muted-foreground text-xs">
                                <span className="text-destructive">*</span> Campo obligatorio
                            </p>
                            <FormActions
                                onCancel={handleCancel}
                                isSubmitting={form.processing}
                                submitText={mode === 'create' ? 'Crear rol' : 'Actualizar rol'}
                            />
                        </form>
                    </div>
                </div>
            </div>
            {/* Confirm navigation away with unsaved changes */}
            <ConfirmAlert
                open={leaveConfirmOpen}
                onOpenChange={(open) => {
                    setLeaveConfirmOpen(open);
                    if (!open) {
                        // Clear any pending navigation callback when dialog closes
                        resumeNavRef.current = null;
                    }
                }}
                title="Tienes cambios sin guardar"
                description="Si sales ahora, perderás los cambios no guardados."
                confirmLabel="Salir sin guardar"
                cancelLabel="Cancelar"
                confirmDestructive
                onConfirm={() => {
                    setLeaveConfirmOpen(false);
                    const resume = resumeNavRef.current;
                    resumeNavRef.current = null;
                    resume?.();
                }}
            />
        </TooltipProvider>
    );
}

// Apply the App layout so the sidebar/header are present when this component is used as an Inertia page
// This mirrors the pattern used in roles/index.tsx
RoleForm.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
