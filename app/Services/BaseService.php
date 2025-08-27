<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Repositories\RepositoryInterface;
use App\Contracts\Services\ServiceInterface;
use App\DTO\ListQuery;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Psr\Container\ContainerInterface;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * BaseService - Implementación base abstracta para servicios de aplicación
 *
 * Orquesta el acceso al repositorio, maneja transacciones, exportación,
 * y proporciona hooks extensibles para servicios concretos.
 */
abstract class BaseService implements ServiceInterface
{
    public function __construct(
        protected RepositoryInterface $repo,
        protected ContainerInterface $container
    ) {}

    // --- Listado (Index) ---

    public function list(ListQuery $query, array $with = [], array $withCount = []): array
    {
        $paginator = $this->repo->paginate($query, $with, $withCount);

        return $this->makeListResult($paginator);
    }

    public function listByIdsDesc(array $ids, int $perPage, array $with = [], array $withCount = []): array
    {
        $paginator = $this->repo->paginateByIdsDesc($ids, $perPage, $with, $withCount);

        return $this->makeListResult($paginator);
    }

    // --- Export ---

    public function export(ListQuery $query, string $format, ?array $columns = null, ?string $filename = null): StreamedResponse
    {
        $cols = $columns ?? $this->defaultExportColumns();
        $file = $filename ?? $this->defaultExportFilename($format, $query);

        // Generador perezoso para filas (evita cargar todo en memoria)
        $rowsIterable = $this->exportRows($query, $cols);

        $exporter = $this->resolveExporter($format);
        $response = $exporter->stream($rowsIterable, $cols);

        // Adjuntar filename si el exporter lo soporta o setear header en BaseService
        $response->headers->set('Content-Disposition', 'attachment; filename="'.$file.'"');

        return $response;
    }

    // --- Lecturas puntuales ---

    public function getById(int|string $id, array $with = []): ?Model
    {
        return $this->repo->getById($id, $with);
    }

    public function getOrFailById(int|string $id, array $with = []): Model
    {
        return $this->repo->getOrFailById($id, $with);
    }

    public function getByUuid(string $uuid, array $with = []): ?Model
    {
        return $this->repo->getByUuid($uuid, $with);
    }

    public function getOrFailByUuid(string $uuid, array $with = []): Model
    {
        return $this->repo->getOrFailByUuid($uuid, $with);
    }

    // --- Escritura ---

    public function create(array $attributes): Model
    {
        return $this->transaction(fn () => $this->repo->create($attributes));
    }

    public function createMany(array $rows): Collection
    {
        return $this->transaction(fn () => $this->repo->createMany($rows));
    }

    public function update(Model|int|string $modelOrId, array $attributes): Model
    {
        return $this->transaction(fn () => $this->repo->update($modelOrId, $attributes));
    }

    public function upsert(array $rows, array $uniqueBy, array $updateColumns): int
    {
        return $this->transaction(fn () => $this->repo->upsert($rows, $uniqueBy, $updateColumns));
    }

    // --- Borrado / restauración ---

    public function delete(Model|int|string $modelOrId): bool
    {
        return $this->repo->delete($modelOrId);
    }

    public function forceDelete(Model|int|string $modelOrId): bool
    {
        return $this->repo->forceDelete($modelOrId);
    }

    public function restore(Model|int|string $modelOrId): bool
    {
        return $this->repo->restore($modelOrId);
    }

    // --- Estado común ---

    public function setActive(Model|int|string $modelOrId, bool $active): Model
    {
        return $this->transaction(fn () => $this->repo->setActive($modelOrId, $active));
    }

    // --- Operaciones MASIVAS ---

    public function bulkDeleteByIds(array $ids): int
    {
        return $this->repo->bulkDeleteByIds($ids);
    }

    public function bulkForceDeleteByIds(array $ids): int
    {
        return $this->repo->bulkForceDeleteByIds($ids);
    }

    public function bulkRestoreByIds(array $ids): int
    {
        return $this->repo->bulkRestoreByIds($ids);
    }

    public function bulkSetActiveByIds(array $ids, bool $active): int
    {
        return $this->repo->bulkSetActiveByIds($ids, $active);
    }

    public function bulkDeleteByUuids(array $uuids): int
    {
        return $this->repo->bulkDeleteByUuids($uuids);
    }

    public function bulkForceDeleteByUuids(array $uuids): int
    {
        return $this->repo->bulkForceDeleteByUuids($uuids);
    }

    public function bulkRestoreByUuids(array $uuids): int
    {
        return $this->repo->bulkRestoreByUuids($uuids);
    }

    public function bulkSetActiveByUuids(array $uuids, bool $active): int
    {
        return $this->repo->bulkSetActiveByUuids($uuids, $active);
    }

    // --- Concurrencia / Transacciones ---

    public function transaction(callable $callback)
    {
        return DB::transaction($callback);
    }

    public function withPessimisticLockById(int|string $id, callable $callback)
    {
        return $this->repo->withPessimisticLockById($id, $callback);
    }

    public function withPessimisticLockByUuid(string $uuid, callable $callback)
    {
        return $this->repo->withPessimisticLockByUuid($uuid, $callback);
    }

    // --- Hooks/protegidos (sobrescribibles por servicios concretos) ---

    /**
     * Mapea un Model a array para 'rows'; por defecto attributesToArray()
     */
    protected function toRow(Model $model): array
    {
        return $model->attributesToArray();
    }

    /**
     * Columnas por defecto si no se pasan en export(); cada servicio concreto puede sobrescribir
     */
    protected function defaultExportColumns(): array
    {
        return ['id', 'created_at', 'updated_at'];
    }

    /**
     * Nombre por defecto para archivo de exportación
     */
    protected function defaultExportFilename(string $format, ListQuery $query): string
    {
        $modelClass = strtolower(class_basename($this->repoModelClass()));
        $timestamp = date('Ymd_His');

        return "{$modelClass}_export_{$timestamp}.{$format}";
    }

    /**
     * Tamaño de página para streaming export (evita agotar memoria)
     */
    protected function exportPageSize(): int
    {
        return 1000;
    }

    /**
     * Generador que itera sobre las filas de export de forma paginada
     */
    protected function exportRows(ListQuery $query, array $columns): \Generator
    {
        $page = 1;
        $pageSize = $this->exportPageSize();

        do {
            // Crear nueva query con paginación específica para export
            $exportQuery = new ListQuery(
                q: $query->q,
                page: $page,
                perPage: $pageSize,
                sort: $query->sort,
                dir: $query->dir,
                filters: $query->filters
            );

            $paginator = $this->repo->paginate($exportQuery);

            foreach ($paginator->items() as $item) {
                $row = $this->toRow($item);

                // Filtrar solo las columnas solicitadas
                if (! empty($columns)) {
                    $row = array_intersect_key($row, array_flip($columns));
                }

                yield $row;
            }

            $page++;
        } while ($page <= $paginator->lastPage());
    }

    /**
     * Convierte un paginator a formato ['rows', 'meta']
     */
    protected function makeListResult(LengthAwarePaginator $paginator): array
    {
        return [
            'rows' => array_map(
                fn (Model $item) => $this->toRow($item),
                $paginator->items()
            ),
            'meta' => [
                'currentPage' => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'lastPage' => $paginator->lastPage(),
            ],
        ];
    }

    /**
     * Resuelve el exporter para el formato dado
     */
    protected function resolveExporter(string $format): \App\Contracts\Exports\ExporterInterface
    {
        return $this->container->get('exporter.'.$format);
    }

    /**
     * Devuelve el FQCN del modelo del repositorio (para generar filename)
     * Los servicios concretos pueden sobrescribir esto si es necesario
     */
    protected function repoModelClass(): string
    {
        // Por defecto, intentamos derivar del repositorio
        // Los servicios concretos deberían sobrescribir esto
        return 'Model';
    }
}
