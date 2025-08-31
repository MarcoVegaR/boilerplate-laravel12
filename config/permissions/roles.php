<?php

declare(strict_types=1);

return [
    'permissions' => [
        'roles.view',
        'roles.create',
        'roles.update',
        'roles.delete',
        'roles.restore',
        'roles.forceDelete',
        'roles.export',
    ],
    'descriptions' => [
        'roles.view' => 'Ver roles',
        'roles.create' => 'Crear roles',
        'roles.update' => 'Actualizar roles',
        'roles.delete' => 'Eliminar roles',
        'roles.restore' => 'Restaurar roles',
        'roles.forceDelete' => 'Eliminar permanentemente roles',
        'roles.export' => 'Exportar roles',
    ],
    // Configuración de roles para validaciones de eliminación
    'roles' => [
        // Lista de nombres de roles que no pueden eliminarse
        'protected' => [
            // 'admin', 'owner'
        ],
        'deletion' => [
            // Si está en true, bloquear eliminación cuando el rol tenga permisos asignados
            // a menos que se envíe force=true
            'block_if_has_permissions' => false,
            // Si está en true, requiere que el rol esté inactivo antes de permitir eliminar
            'require_inactive' => false,
            // Permisos críticos para considerar un rol como "administrador" a efectos
            // de no permitir borrar el último rol que otorgue estos permisos
            'critical_permissions' => [
                'roles.view',
                'roles.update',
                'roles.delete',
                'roles.export',
            ],
        ],
    ],
];
