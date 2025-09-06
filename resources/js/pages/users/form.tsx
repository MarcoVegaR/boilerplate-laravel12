import { ErrorSummary } from '@/components/form/ErrorSummary';
import { Field } from '@/components/form/Field';
import { FieldError } from '@/components/forms/field-error';
import { FormActions } from '@/components/forms/form-actions';
import { FormSection } from '@/components/forms/form-section';
import { RolePicker } from '@/components/pickers/role-picker';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useClientValidation } from '@/hooks/useClientValidation';
import { useFirstErrorFocus } from '@/hooks/useFirstErrorFocus';
import AppLayout from '@/layouts/app-layout';
import { makeUserSchema } from '@/lib/validation/schema-user';
import type { FormDataConvertible } from '@inertiajs/core';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ChevronRight, Info, Shield } from 'lucide-react';
import React, { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

export interface UserFormProps {
    mode: 'create' | 'edit';
    // The HandlesForm trait sends `model`; keep `initial` for backward-compatibility.
    model?: {
        id?: number;
        name?: string;
        email?: string;
        is_active?: boolean;
        roles_ids?: number[];
        roles?: Array<{ id: number; name: string }>;
        updated_at?: string | null;
    };
    initial?: {
        id?: number;
        name?: string;
        email?: string;
        is_active?: boolean;
        roles_ids?: number[];
        roles?: Array<{ id: number; name: string }>;
        updated_at?: string | null;
    };
    options: { roleOptions: Array<{ id: number; name: string }> };
    can?: Record<string, boolean>;
    onSaved?: () => void;
}

export interface UserFormData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    is_active: boolean;
    roles_ids: number[];
    _version: string | null;
    [key: string]: FormDataConvertible;
}

export default function UserForm({ mode, model, initial, options, can, onSaved }: UserFormProps) {
    const firstErrorRef = useRef<HTMLInputElement>(null);

    // Prefer `model` from backend; fallback to `initial`
    type WithRoles = { roles?: Array<{ id: number; name: string }>; roles_ids?: number[] };
    const initialModel = (model ?? initial) as (UserFormProps['model'] & WithRoles) | undefined;

    // Derive roles_ids from initialModel.roles if roles_ids not provided
    const initialRolesIds = React.useMemo(() => {
        if (initialModel?.roles_ids && Array.isArray(initialModel.roles_ids)) return initialModel.roles_ids;
        const roles = initialModel?.roles as Array<{ id: number }> | undefined;
        if (Array.isArray(roles)) return roles.map((r) => r.id);
        return [] as number[];
    }, [initialModel]);

    const form = useForm<UserFormData>({
        name: initialModel?.name ?? '',
        email: initialModel?.email ?? '',
        password: '',
        password_confirmation: '',
        is_active: initialModel?.is_active ?? true,
        roles_ids: initialRolesIds,
        _version: mode === 'edit' ? (initialModel?.updated_at ?? null) : null,
    });

    // Unsaved changes tracking (compare initial vs current)
    const initialData = useMemo(
        () => ({
            name: initialModel?.name ?? '',
            email: initialModel?.email ?? '',
            is_active: initialModel?.is_active ?? true,
            roles_ids: initialRolesIds,
        }),
        [initialModel, initialRolesIds],
    );

    useUnsavedChanges(form.data, initialData, true, {
        excludeKeys: ['_token', '_method', '_version', 'password', 'password_confirmation'],
        ignoreUnderscored: true,
        confirmMessage: '¿Estás seguro de salir? Los cambios no guardados se perderán.',
    });

    // Client-side validation (Zod) with the same pattern used by roles
    const schema = useMemo(() => makeUserSchema(mode), [mode]);
    const { validateOnBlur, validateOnSubmit, errorsClient, mergeErrors } = useClientValidation(schema, () => form.data);
    const { focusFirstError } = useFirstErrorFocus();

    // Merge server and client errors
    const errors = mergeErrors(form.errors, errorsClient);

    // Cancel -> go back to users index
    const handleCancel = () => {
        router.visit(route('users.index'));
    };

    const sanitizeRoles = (ids: number[]) =>
        Array.from(
            new Set(
                (ids || []).map((v) => (typeof v === 'string' ? Number(v) : v)).filter((v) => Number.isFinite(v) && Number.isInteger(v) && v >= 0),
            ),
        );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateOnSubmit()) {
            focusFirstError(errorsClient);
            toast.error('Por favor, corrige los errores antes de continuar');
            return;
        }

        form.transform((data) => ({
            ...data,
            roles_ids: sanitizeRoles(data.roles_ids as number[]),
            is_active: !!data.is_active,
        }));

        if (mode === 'create') {
            form.post(route('users.store'), {
                onSuccess: () => onSaved?.(),
                onError: (serverErrors) => {
                    toast.error('Error al crear el usuario');
                    focusFirstError(serverErrors);
                },
            });
        } else {
            const id = Number(initialModel?.id);
            if (!Number.isInteger(id)) {
                toast.error('ID de usuario inválido');
                return;
            }
            form.put(route('users.update', { user: id }), {
                onSuccess: () => onSaved?.(),
                onError: (serverErrors) => {
                    toast.error('Error al actualizar el usuario');
                    focusFirstError(serverErrors);
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

    // Map roles for RolePicker
    const rolePickerOptions = (options?.roleOptions || []).map((r) => ({ id: r.id, name: r.name, guard_name: 'web', is_active: true }));

    return (
        <>
            <Head title={mode === 'create' ? 'Crear Usuario' : 'Editar Usuario'} />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
                {/* Breadcrumb Ribbon */}
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
                                            href="/users"
                                            className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        >
                                            Usuarios
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
                                            {initialModel?.id ? (
                                                <BreadcrumbItem>
                                                    <Link
                                                        href={route('users.show', { user: initialModel.id })}
                                                        className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                    >
                                                        {initialModel?.name ?? 'Usuario'}
                                                    </Link>
                                                </BreadcrumbItem>
                                            ) : null}
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
                            {/* Error summary */}
                            {Object.keys(errors).length > 0 && <ErrorSummary errors={errors} className="mb-4" />}

                            <FormSection title="Información básica" description="Datos principales del usuario">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* Name */}
                                    <Field id="name" label="Nombre" required error={errors.name}>
                                        <Input
                                            ref={firstErrorRef}
                                            name="name"
                                            type="text"
                                            value={form.data.name}
                                            onChange={(e) => form.setData('name', e.target.value)}
                                            onBlur={() => validateOnBlur('name')}
                                            placeholder="Ej: Juan Pérez"
                                            maxLength={100}
                                        />
                                    </Field>

                                    {/* Email */}
                                    <Field id="email" label="Email" required error={errors.email}>
                                        <Input
                                            name="email"
                                            type="email"
                                            value={form.data.email}
                                            onChange={(e) => form.setData('email', e.target.value)}
                                            onBlur={() => validateOnBlur('email')}
                                            placeholder="Ej: usuario@dominio.com"
                                            maxLength={150}
                                        />
                                    </Field>

                                    {/* Password */}
                                    <Field id="password" label="Contraseña" required={mode === 'create'} error={errors.password}>
                                        <Input
                                            name="password"
                                            type="password"
                                            value={form.data.password}
                                            onChange={(e) => form.setData('password', e.target.value)}
                                            onBlur={() => validateOnBlur('password')}
                                            placeholder={mode === 'create' ? 'Mínimo 8 caracteres' : 'Dejar vacío para no cambiar'}
                                        />
                                    </Field>

                                    {/* Password confirmation */}
                                    <Field
                                        id="password_confirmation"
                                        label="Confirmar contraseña"
                                        required={mode === 'create'}
                                        error={errors.password_confirmation}
                                    >
                                        <Input
                                            name="password_confirmation"
                                            type="password"
                                            value={form.data.password_confirmation}
                                            onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                            onBlur={() => validateOnBlur('password_confirmation')}
                                            placeholder={mode === 'create' ? 'Repetir contraseña' : 'Repetir si cambiaste la contraseña'}
                                        />
                                    </Field>
                                </div>

                                {/* Active status (only in edit, same pattern as roles) */}
                                {mode === 'edit' && (
                                    <Field id="is_active" label="Estado activo" error={errors.is_active} className="md:col-span-2">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                name="is_active"
                                                checked={form.data.is_active}
                                                onCheckedChange={(checked) => {
                                                    form.setData('is_active', checked);
                                                    validateOnBlur('is_active');
                                                }}
                                                disabled={form.processing}
                                                aria-describedby="active-description"
                                            />
                                            <Label htmlFor="is_active" className="cursor-pointer">
                                                {form.data.is_active ? 'Usuario activo' : 'Usuario inactivo'}
                                            </Label>
                                        </div>
                                    </Field>
                                )}

                                {mode === 'edit' && (can ?? {})['users.setActive'] === false && (
                                    <p className="text-muted-foreground mt-2 text-sm">
                                        <Info className="mr-1 inline h-3 w-3" />
                                        No tienes permisos para cambiar el estado del usuario
                                    </p>
                                )}

                                {mode === 'edit' && initialModel?.updated_at && (
                                    <>
                                        <input type="hidden" name="_version" value={initialModel.updated_at ?? ''} />
                                        <p className="text-muted-foreground mt-2 text-xs">
                                            Última actualización: {new Date(initialModel.updated_at as string).toLocaleString('es-ES')}
                                        </p>
                                    </>
                                )}
                            </FormSection>

                            {/* Roles */}
                            <FormSection title="Roles" description="Asigna los roles que tendrá este usuario">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                        <Shield className="mr-1 inline h-4 w-4" /> Roles asignados
                                    </Label>
                                    <RolePicker
                                        multiple
                                        value={form.data.roles_ids}
                                        onChange={(val) => form.setData('roles_ids', (val as number[]) ?? [])}
                                        options={rolePickerOptions}
                                        allowCreate={false}
                                        canCreate={false}
                                    />
                                    {errors.roles_ids && <FieldError message={errors.roles_ids} />}
                                </div>
                            </FormSection>

                            <p className="text-muted-foreground text-xs">
                                <span className="text-destructive">*</span> Campo obligatorio
                            </p>

                            <FormActions
                                onCancel={handleCancel}
                                isSubmitting={form.processing}
                                submitText={mode === 'create' ? 'Crear usuario' : 'Actualizar usuario'}
                            />
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

// Apply App layout so the sidebar/header are present like roles
UserForm.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
