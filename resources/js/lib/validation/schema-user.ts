/**
 * Zod validation schema for User forms
 */

import { z } from 'zod';
import { MAX_NAME, MESSAGES, MIN_PASSWORD } from './validation.config';
import { email, isoDate, numericIdArray, requiredBoolean, stringRequired } from './zod-kit';

export const userSchemaBase = z.object({
    name: stringRequired('Nombre', MAX_NAME),
    email: email('Email'),
    is_active: requiredBoolean('Activo'),
    roles_ids: numericIdArray('Roles'),
    _version: isoDate(),
});

export type UserFormBaseData = z.infer<typeof userSchemaBase>;

export function makeUserSchema(mode: 'create' | 'edit') {
    const passwordSchema =
        mode === 'create' ? z.string().min(MIN_PASSWORD, MESSAGES.min('Contraseña', MIN_PASSWORD)) : z.string().optional().or(z.literal(''));

    const passwordConfirmationSchema = z.string().optional().or(z.literal(''));

    return userSchemaBase
        .extend({
            password: passwordSchema,
            password_confirmation: passwordConfirmationSchema,
        })
        .superRefine((data, ctx) => {
            type WithPasswords = { password?: string; password_confirmation?: string };
            const { password, password_confirmation: confirmation } = data as WithPasswords;

            // In create, password must be present and match confirmation
            if (mode === 'create') {
                if (!password || password.length < MIN_PASSWORD) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: MESSAGES.min('Contraseña', MIN_PASSWORD),
                        path: ['password'],
                    });
                }
                if ((password || '') !== (confirmation || '')) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: MESSAGES.confirmed('contraseña'),
                        path: ['password_confirmation'],
                    });
                }
            }

            // In edit, only validate confirmation if password provided
            if (mode === 'edit' && password && password.length > 0) {
                if ((password || '') !== (confirmation || '')) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: MESSAGES.confirmed('contraseña'),
                        path: ['password_confirmation'],
                    });
                }
            }
        });
}
