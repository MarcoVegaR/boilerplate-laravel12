# Permisos (backend y frontend)

Esta guía explica cómo se definen, siembran, consumen y testean los permisos.

## Arquitectura

- **Declaración**: Los permisos se declaran por módulo en `config/permissions/*.php`.
    - Ejemplos: `config/permissions/settings.php`, `config/permissions/users.php`.
    - Cada archivo exporta dos claves: `permissions` (lista llana de strings) y `descriptions` (mapa nombre => descripción).
- **Agregación**: `config/permissions.php` une todos los archivos del directorio `config/permissions/` y expone:
    - `guard`: actualmente `web`.
    - `permissions`: lista flat única de permisos.
    - `descriptions`: mapa permiso => descripción.
- **Seeder**: `Database\Seeders\PermissionsSeeder` crea/actualiza los `Permission` y el `Role` `admin` con **todos** los permisos.
    - `Database\Seeders\DatabaseSeeder` invoca el seeder de permisos y luego `UsersSeeder` (admin por defecto) y finalmente limpia el caché de permisos.
- **Protección de rutas**: Usa el middleware `can:<permiso>` en las rutas. Ver `routes/settings.php`.
- **Frontend (Inertia)**: `app/Http/Middleware/HandleInertiaRequests.php` comparte `auth.can` con un mapa permiso => booleano, para el `user` autenticado.

## Ejemplo de rutas protegidas

Archivo: `routes/settings.php`

```php
Route::get('settings/profile', [ProfileController::class, 'edit'])
    ->middleware('can:settings.profile.view')
    ->name('profile.edit');

Route::patch('settings/profile', [ProfileController::class, 'update'])
    ->middleware('can:settings.profile.update')
    ->name('profile.update');

Route::get('settings/appearance', function () {
    return Inertia::render('settings/appearance');
})->middleware('can:settings.appearance.view')
  ->name('appearance');
```

## Cómo agregar un nuevo módulo de permisos

1. **Crear archivo de módulo**: `config/permissions/<modulo>.php`
    ```php
    return [
        'permissions' => [
            '<modulo>.index',
            '<modulo>.view',
            '<modulo>.create',
            '<modulo>.update',
            '<modulo>.delete',
        ],
        'descriptions' => [
            '<modulo>.index' => 'Listar <modulo>',
            '<modulo>.view' => 'Ver <modulo>',
            // ...
        ],
    ];
    ```
2. **Sembrar**: Ejecuta `php artisan db:seed --class=PermissionsSeeder` (o `php artisan db:seed` si `DatabaseSeeder` ya lo llama).
3. **Proteger rutas**: agrega `->middleware('can:<permiso>')` en cada ruta del módulo.
4. **UI (React)**: usa `page.props.auth.can['<permiso>']` para condicionar botones/pantallas.
    ```tsx
    if (!page.props.auth.can['users.create']) return null;
    ```

## Cómo funciona `auth.can` en Inertia

Archivo: `app/Http/Middleware/HandleInertiaRequests.php`

```php
$permissions = (array) config('permissions.permissions', []);
$can = collect($permissions)->mapWithKeys(
    fn (string $perm) => [$perm => (bool) ($request->user()?->can($perm))]
)->all();

return [
    ...parent::share($request),
    'auth' => [
        'user' => $request->user(),
        'can' => $can,
    ],
];
```

## Tests incluidos

- `tests/Feature/Permissions/PermissionsBehaviorTest.php`:
    - **Sin permisos**: el usuario autenticado **no** puede acceder a las URLs protegidas (403).
    - **Admin**: el usuario con rol `admin` puede acceder (200 para GET, 302 para formularios).
- `tests/Feature/Infrastructure/InertiaSharedPropsTest.php`:
    - `auth.can` contiene **todas** las llaves de `config('permissions.permissions')` con valores booleanos.

Con estos tests, si agregas un permiso en `config/permissions/`, automáticamente quedará validado que el frontend reciba esa llave en `auth.can` y que las rutas que protejas se comporten según corresponda.
