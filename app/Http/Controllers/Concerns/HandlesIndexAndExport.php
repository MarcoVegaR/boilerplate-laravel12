<?php

declare(strict_types=1);

namespace App\Http\Controllers\Concerns;

use App\Contracts\Services\ServiceInterface;
use App\DTO\ListQuery;
use App\Exceptions\DomainActionException;
use App\Http\Requests\BaseIndexRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse as HttpStreamedResponse;

/**
 * Trait reusable para controladores con funcionalidad Index/Export usando Inertia.
 *
 * Proporciona métodos estándar para listado, export, operaciones masivas y
 * selecciones filtradas, integrando Policies, Services e Inertia con
 * optimización para partial reloads y TanStack Table v8 server-side.
 *
 * El controlador que use este trait debe:
 * - Inyectar ServiceInterface en la propiedad protected $service
 * - Implementar los hooks abstract/protected requeridos
 * - Registrar las rutas apropiadas (GET index, GET export, POST bulk, GET selected)
 *
 * @author Laravel Boilerplate
 *
 * @requires ServiceInterface $service Servicio inyectado en el constructor del controlador
 */
trait HandlesIndexAndExport
{
    /**
     * Devuelve el modelo para autorización con Policies.
     *
     * @return string Fully qualified class name del modelo (ej: \App\Models\User::class)
     */
    abstract protected function policyModel(): string;

    /**
     * Vista Inertia para renderizar el Index.
     *
     * @return string Nombre de la vista (ej: 'Roles/Index')
     */
    abstract protected function view(): string;

    /**
     * Relaciones a cargar eager para evitar N+1.
     *
     * @return array<string> Array de relaciones
     */
    protected function with(): array
    {
        return [];
    }

    /**
     * Conteos de relaciones a incluir para evitar N+1.
     *
     * @return array<string> Array de conteos de relaciones
     */
    protected function withCount(): array
    {
        return [];
    }

    /**
     * Formatos de export permitidos para este recurso.
     *
     * @return array<string> Formatos soportados
     */
    protected function allowedExportFormats(): array
    {
        return ['csv', 'xlsx', 'pdf'];
    }

    /**
     * GET /resource (Index)
     *
     * Lista recursos con paginación, búsqueda, filtros y ordenamiento.
     * Optimizado para partial reloads de Inertia (solo 'rows' y 'meta').
     *
     * @param  BaseIndexRequest  $request  Request validada con ListQuery
     * @return \Inertia\Response
     */
    public function index(BaseIndexRequest $request)
    {
        $this->authorize('viewAny', $this->policyModel());

        $dto = $request->toListQuery();
        $result = $this->service->list($dto, $this->with(), $this->withCount());

        // Devolver únicamente props que la UI necesita para partial reloads (rows/meta)
        return Inertia::render($this->view(), [
            'rows' => $result['rows'],
            'meta' => $result['meta'],
        ]);
    }

    /**
     * GET /resource/export?format=csv|xlsx|pdf
     *
     * Exporta recursos con formato especificado usando ExporterInterface.
     * Si la exportación falla, redirige al index con flash error.
     *
     * @param  BaseIndexRequest  $request  Request con filtros para export
     */
    public function export(BaseIndexRequest $request): HttpStreamedResponse|RedirectResponse
    {
        $this->authorize('export', $this->policyModel());

        try {
            $dto = $request->toListQuery();
            $format = strtolower((string) ($request->query('format', 'csv')));

            if (! in_array($format, $this->allowedExportFormats(), true)) {
                $format = 'csv';
            }

            return $this->service->export($dto, $format);
        } catch (DomainActionException $e) {
            return $this->fail($this->indexRouteName(), [], $e->getMessage());
        } catch (\Exception $e) {
            return $this->fail($this->indexRouteName(), [], 'Error durante la exportación. Inténtelo nuevamente.');
        }
    }

    /**
     * POST /resource/bulk (operaciones masivas comunes del Index)
     *
     * Ejecuta operaciones masivas: delete, restore, forceDelete, setActive.
     * Soporta tanto IDs como UUIDs para flexibilidad del modelo.
     * Redirige con mensaje flash de éxito/error.
     *
     * Expected body: {
     *   action: 'delete'|'restore'|'forceDelete'|'setActive',
     *   ids?: number[],
     *   uuids?: string[],
     *   active?: boolean
     * }
     */
    public function bulk(Request $request): RedirectResponse
    {
        $this->authorize('update', $this->policyModel());

        $request->validate([
            'action' => 'required|in:delete,restore,forceDelete,setActive',
            'ids' => 'array|nullable',
            'ids.*' => 'integer|min:1',
            'uuids' => 'array|nullable',
            'uuids.*' => 'string|uuid',
            'active' => 'boolean|nullable',
        ]);

        $action = $request->string('action')->value();
        $ids = $request->array('ids', []);
        $uuids = $request->array('uuids', []);
        $active = $request->boolean('active', true);

        if (empty($ids) && empty($uuids)) {
            return $this->fail($this->indexRouteName(), [], 'Se requieren IDs o UUIDs para la operación');
        }

        try {
            // Ejecutar operación bulk correspondiente
            $count = match ($action) {
                'delete' => $this->service->bulkDeleteByIds($ids) + $this->service->bulkDeleteByUuids($uuids),
                'restore' => $this->service->bulkRestoreByIds($ids) + $this->service->bulkRestoreByUuids($uuids),
                'forceDelete' => $this->service->bulkForceDeleteByIds($ids) + $this->service->bulkForceDeleteByUuids($uuids),
                'setActive' => $this->service->bulkSetActiveByIds($ids, $active) + $this->service->bulkSetActiveByUuids($uuids, $active),
            };

            $actionMessages = [
                'delete' => 'eliminados',
                'restore' => 'restaurados',
                'forceDelete' => 'eliminados permanentemente',
                'setActive' => $active ? 'activados' : 'desactivados',
            ];

            $message = sprintf('%d registro(s) %s exitosamente', $count, $actionMessages[$action]);

            return $this->ok($this->indexRouteName(), [], $message);
        } catch (DomainActionException $e) {
            return $this->fail($this->indexRouteName(), [], $e->getMessage());
        } catch (\Exception $e) {
            return $this->fail($this->indexRouteName(), [], 'Error durante la operación masiva. Inténtelo nuevamente.');
        }
    }

    /**
     * GET /resource/selected?ids[]=1&ids[]=2... (obtener recursos por IDs)
     *
     * Lista un subconjunto específico de recursos por IDs (útil para mostrar selecciones).
     * Siempre ordenado por id DESC.
     *
     * @return \Inertia\Response
     */
    public function selected(Request $request)
    {
        $this->authorize('viewAny', $this->policyModel());

        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
            'perPage' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $ids = $validated['ids'];
        $perPage = (int) ($validated['perPage'] ?? 15);

        $result = $this->service->listByIdsDesc($ids, $perPage, $this->with(), $this->withCount());

        return Inertia::render($this->view(), [
            'rows' => $result['rows'],
            'meta' => $result['meta'],
        ]);
    }

    // Helper methods para redirects con flash messages

    /**
     * Redirigir con mensaje de éxito
     *
     * @param  string  $routeName  Nombre de la ruta de destino
     * @param  array<string, mixed>  $params  Parámetros de la ruta
     * @param  string|null  $message  Mensaje flash de éxito
     */
    protected function ok(string $routeName, array $params = [], ?string $message = null): RedirectResponse
    {
        $redirect = redirect()->route($routeName, $params);

        if ($message !== null) {
            $redirect->with('success', $message);
        }

        return $redirect;
    }

    /**
     * Redirigir con mensaje de error
     *
     * @param  string  $routeName  Nombre de la ruta de destino
     * @param  array<string, mixed>  $params  Parámetros de la ruta
     * @param  string|null  $message  Mensaje flash de error
     */
    protected function fail(string $routeName, array $params = [], ?string $message = null): RedirectResponse
    {
        $redirect = redirect()->route($routeName, $params);

        if ($message !== null) {
            $redirect->with('error', $message);
        }

        return $redirect;
    }

    /**
     * Nombre de la ruta del index para redirects
     *
     * @return string Nombre de la ruta (ej: 'users.index')
     */
    abstract protected function indexRouteName(): string;
}
