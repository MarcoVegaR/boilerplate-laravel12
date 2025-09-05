import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HTMLAttributes, ReactNode } from 'react';

interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    onCancel?: () => void;
    cancelText?: string;
    submitText?: string;
    isSubmitting?: boolean;
    align?: 'left' | 'right' | 'center' | 'between';
}

export function FormActions({
    children,
    onCancel,
    cancelText = 'Cancelar',
    submitText = 'Guardar',
    isSubmitting = false,
    align = 'right',
    className,
    ...props
}: FormActionsProps) {
    const alignClass = {
        left: 'justify-start',
        right: 'justify-end',
        center: 'justify-center',
        between: 'justify-between',
    }[align];

    return (
        <div {...props} className={cn('flex gap-3', alignClass, className)}>
            {children ? (
                children
            ) : (
                <>
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                            {cancelText}
                        </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : submitText}
                    </Button>
                </>
            )}
        </div>
    );
}
