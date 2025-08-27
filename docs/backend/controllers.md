# Controllers

## Base Controller para Index/Export

El sistema proporciona utilidades reutilizables para controladores que manejan operaciones de Index y Export con integración completa de **Policies**, **Services** e **Inertia.js**, optimizado para **TanStack Table v8** server-side.

### Arquitectura: Patrón de Orquestación

```
Controller → Policy → BaseIndexRequest → Service → Inertia
```

El controlador actúa como orquestador sin lógica de negocio:

1. **Policy**: Autoriza la operación (`viewAny`, `export`, `update`)
2. **BaseIndexRequest**: Valida y normaliza parámetros a `ListQuery`
3. **Service**: Ejecuta la lógica de negocio via `ServiceInterface`
4. **Inertia**: Devuelve respuesta optimizada para partial reloads

### HandlesIndexAndExport Trait

Trait reutilizable que proporciona 4 endpoints estándar:

```php
<?php

namespace App\Http\Controllers;

use App\Contracts\Services\ServiceInterface;
use App\Http\Controllers\Concerns\HandlesIndexAndExport;

class RolesController extends Controller
{
    use HandlesIndexAndExport;

    public function __construct(
        protected ServiceInterface $service
    ) {
    }

    protected function policyModel(): string
    {
        return \Spatie\Permission\Models\Role::class;
    }

    protected function view(): string
    {
        return 'Roles/Index';
    }

    protected function with(): array
    {
        return ['permissions']; // Eager loading
    }

    protected function withCount(): array
    {
        return ['users_count']; // Relation counts
    }

    protected function allowedExportFormats(): array
    {
        return ['csv', 'xlsx', 'pdf'];
    }
}
```

### BaseIndexController (Alternativa)

Clase abstracta que usa el trait internamente:

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\BaseIndexController;

class RolesController extends BaseIndexController
{
    protected function policyModel(): string
    {
        return \Spatie\Permission\Models\Role::class;
    }

    protected function view(): string
    {
        return 'Roles/Index';
    }

    // Hooks opcionales: with(), withCount(), allowedExportFormats()
}
```

### Endpoints Disponibles

#### 1. GET `/resource` (Index)

Lista recursos con paginación, búsqueda, filtros y ordenamiento.

**Ejemplo de Request:**

```http
GET /roles?q=admin&page=2&per_page=20&sort=name&dir=asc&filters[active]=true
```

**Respuesta optimizada para partial reloads:**

```json
{
    "component": "Roles/Index",
    "props": {
        "rows": [
            { "id": 1, "name": "Admin", "active": true },
            { "id": 2, "name": "Editor", "active": true }
        ],
        "meta": {
            "current_page": 2,
            "per_page": 20,
            "total": 45,
            "last_page": 3,
            "row_count": 45
        }
    }
}
```

#### 2. GET `/resource/export?format=csv|xlsx|pdf`

Exporta recursos con el formato especificado.

**Ejemplo:**

```http
GET /roles/export?format=xlsx&q=admin&filters[active]=true
```

**Respuesta:** `StreamedResponse` con headers de descarga apropiados.

#### 3. POST `/resource/bulk` (Operaciones masivas)

Ejecuta operaciones masivas: `delete`, `restore`, `forceDelete`, `setActive`.

**Body esperado:**

```json
{
    "action": "delete",
    "ids": [1, 2, 3],
    "uuids": ["uuid-1", "uuid-2"],
    "active": true
}
```

**Respuesta:**

```json
{
    "affected_ids": 3,
    "affected_uuids": 2
}
```

#### 4. GET `/resource/selected?ids[]=1&ids[]=2`

Lista un subconjunto específico de recursos por IDs (útil para selecciones).

**Ejemplo:**

```http
GET /roles/selected?ids[]=1&ids[]=3&perPage=25
```

### Configuración de Rutas Recomendadas

```php
<?php

// routes/web.php
use App\Http\Controllers\RolesController;

Route::prefix('roles')->name('roles.')->group(function () {
    Route::get('/', [RolesController::class, 'index'])->name('index');
    Route::get('/export', [RolesController::class, 'export'])->name('export');
    Route::post('/bulk', [RolesController::class, 'bulk'])->name('bulk');
    Route::get('/selected', [RolesController::class, 'selected'])->name('selected');
});
```

### Integración Frontend con Inertia.js

#### Partial Reloads Optimizados

El controlador devuelve **solo** `rows` y `meta` para maximizar eficiencia:

```typescript
// En tu componente React/Vue
const reloadData = () => {
    router.reload({
        only: ['rows', 'meta'], // Solo recargar datos
        preserveState: true, // Mantener estado del componente
        preserveScroll: true, // Mantener posición de scroll
    });
};
```

#### Integración con TanStack Table v8 Server-Side

```typescript
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';

const MyTable = ({ rows, meta }) => {
    const table = useReactTable({
        data: rows,
        columns,
        getCoreRowModel: getCoreRowModel(),

        // Server-side pagination
        manualPagination: true,
        pageCount: Math.ceil(meta.row_count / meta.per_page), // Calcular en frontend

        // Server-side sorting
        manualSorting: true,

        // Server-side filtering
        manualFiltering: true,

        state: {
            pagination: {
                pageIndex: meta.current_page - 1,
                pageSize: meta.per_page,
            },
        },
    });
};
```

### BaseIndexRequest Personalizada

Crea FormRequests específicos extendiendo `BaseIndexRequest`:

```php
<?php

namespace App\Http\Requests;

class RolesIndexRequest extends BaseIndexRequest
{
    protected function allowedSorts(): array
    {
        return ['id', 'name', 'created_at', 'updated_at'];
    }

    protected function filterRules(): array
    {
        return [
            'filters.active' => ['nullable', 'boolean'],
            'filters.created_between' => ['nullable', 'array'],
            'filters.created_between.from' => ['nullable', 'date'],
            'filters.created_between.to' => ['nullable', 'date', 'after_or_equal:filters.created_between.from'],
            'filters.permission_ids' => ['nullable', 'array'],
            'filters.permission_ids.*' => ['integer', 'exists:permissions,id'],
        ];
    }

    protected function maxPerPage(): int
    {
        return 50; // Override if needed
    }
}
```

### Políticas de Autorización

El trait usa las siguientes abilities que deben implementarse en tu Policy:

```php
<?php

namespace App\Policies;

use App\Models\User;

class RolePolicy extends BaseResourcePolicy
{
    protected function abilityPrefix(): string
    {
        return 'roles';
    }

    // Implementar abilities requeridas:
    // - roles.viewAny (para index y selected)
    // - roles.export (para export)
    // - roles.update (para bulk operations)
}
```

### Ejemplo Completo de Controlador

```php
<?php

namespace App\Http\Controllers;

use App\Contracts\Services\ServiceInterface;
use App\Http\Controllers\Concerns\HandlesIndexAndExport;
use App\Http\Requests\RolesIndexRequest;

class RolesController extends Controller
{
    use HandlesIndexAndExport;

    public function __construct(
        protected ServiceInterface $service
    ) {
    }

    // Sobrescribir el tipo de Request si necesario
    public function index(RolesIndexRequest $request)
    {
        return parent::index($request);
    }

    public function export(RolesIndexRequest $request)
    {
        return parent::export($request);
    }

    protected function policyModel(): string
    {
        return \Spatie\Permission\Models\Role::class;
    }

    protected function view(): string
    {
        return 'Roles/Index';
    }

    protected function with(): array
    {
        return ['permissions'];
    }

    protected function withCount(): array
    {
        return ['users_count'];
    }

    protected function allowedExportFormats(): array
    {
        return ['csv', 'xlsx'];
    }
}
```

### Ventajas del Patrón

- **🔒 Autorización centralizada** via Policies
- **✅ Validación consistente** via BaseIndexRequest
- **⚡ Optimización Inertia** con partial reloads
- **🔄 Reutilización** via trait o herencia
- **📊 Integración TanStack** server-side completa
- **🧪 Testeable** con mocks y políticas controladas
- **📈 Escalable** sin lógica duplicada entre controladores

### Testing

Ver `tests/Feature/Controllers/HandlesIndexAndExportTest.php` para ejemplos completos de testing con mocks de ServiceInterface y políticas temporales.
