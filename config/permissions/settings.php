<?php

return [
    'permissions' => [
        // Settings
        'settings.profile.view',
        'settings.profile.update',
        // 'settings.profile.delete', // disabled: users cannot delete their own account
        'settings.password.update',
        'settings.appearance.view',
    ],

    'descriptions' => [
        'settings.profile.view' => 'Ver perfil',
        'settings.profile.update' => 'Actualización de Perfil',
        // 'settings.profile.delete' => 'Eliminar cuenta', // disabled
        'settings.password.update' => 'Actualización de Password',
        'settings.appearance.view' => 'Ver Apariencia',
    ],
];
