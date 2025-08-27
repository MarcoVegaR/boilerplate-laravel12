<?php

declare(strict_types=1);

namespace App\Contracts\Services;

use App\DTO\ListQuery;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * ServiceInterface - Contrato común para servicios de aplicación
 *
 * Orquesta el acceso al repositorio, expone métodos de listado en shape ['rows','meta'],
 * operaciones CRUD, masivas, export, y utilidades de concurrencia.
 */
interface ServiceInterface
{
    // --- Listado (Index) ---

    /**
     * Devuelve ['rows' => array, 'meta' => array] a partir de un paginator del repositorio
     *
     * @param  ListQuery  $query  Query parameters for filtering, sorting, pagination
     * @param  array  $with  Relations to eager load
     * @param  array  $withCount  Relation counts to include
     * @return array Shape: ['rows' => array, 'meta' => array]
     */
    public function list(ListQuery $query, array $with = [], array $withCount = []): array;

    /**
     * Igual que list(), pero para un subconjunto de IDs, siempre orden id DESC
     *
     * @param  array  $ids  Array of IDs to filter by
     * @param  int  $perPage  Number of items per page
     * @param  array  $with  Relations to eager load
     * @param  array  $withCount  Relation counts to include
     * @return array Shape: ['rows' => array, 'meta' => array]
     */
    public function listByIdsDesc(array $ids, int $perPage, array $with = [], array $withCount = []): array;

    // --- Export ---

    /**
     * Exporta con formato (csv|xlsx|pdf) usando ExporterInterface.
     *
     * @param  ListQuery  $query  Query parameters for export
     * @param  string  $format  Export format (csv|xlsx|pdf)
     * @param  array|null  $columns  Columnas visibles (SSOT UI) o null -> usa defaultExportColumns()
     * @param  string|null  $filename  Nombre sugerido, o null -> usa defaultExportFilename()
     */
    public function export(ListQuery $query, string $format, ?array $columns = null, ?string $filename = null): StreamedResponse;

    // --- Lecturas puntuales ---

    /**
     * Get model by ID
     *
     * @param  array  $with  Relations to eager load
     */
    public function getById(int|string $id, array $with = []): ?Model;

    /**
     * Get model by ID or fail with exception
     *
     * @param  array  $with  Relations to eager load
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function getOrFailById(int|string $id, array $with = []): Model;

    /**
     * Get model by UUID
     *
     * @param  array  $with  Relations to eager load
     */
    public function getByUuid(string $uuid, array $with = []): ?Model;

    /**
     * Get model by UUID or fail with exception
     *
     * @param  array  $with  Relations to eager load
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function getOrFailByUuid(string $uuid, array $with = []): Model;

    // --- Escritura ---

    /**
     * Create new model
     */
    public function create(array $attributes): Model;

    /**
     * Create multiple models
     *
     * @param  array  $rows  Array of attribute arrays
     */
    public function createMany(array $rows): Collection;

    /**
     * Update model by instance or ID
     */
    public function update(Model|int|string $modelOrId, array $attributes): Model;

    /**
     * Upsert multiple rows
     *
     * @return int Number of affected rows
     */
    public function upsert(array $rows, array $uniqueBy, array $updateColumns): int;

    // --- Borrado / restauración ---

    /**
     * Delete model (soft delete if applicable)
     */
    public function delete(Model|int|string $modelOrId): bool;

    /**
     * Force delete model (hard delete)
     */
    public function forceDelete(Model|int|string $modelOrId): bool;

    /**
     * Restore soft deleted model
     */
    public function restore(Model|int|string $modelOrId): bool;

    // --- Estado común ---

    /**
     * Set active status for model
     */
    public function setActive(Model|int|string $modelOrId, bool $active): Model;

    // --- Operaciones MASIVAS ---

    /**
     * Bulk soft delete by IDs
     *
     * @return int Number of affected rows
     */
    public function bulkDeleteByIds(array $ids): int;

    /**
     * Bulk force delete by IDs
     *
     * @return int Number of affected rows
     */
    public function bulkForceDeleteByIds(array $ids): int;

    /**
     * Bulk restore by IDs
     *
     * @return int Number of affected rows
     */
    public function bulkRestoreByIds(array $ids): int;

    /**
     * Bulk set active status by IDs
     *
     * @return int Number of affected rows
     */
    public function bulkSetActiveByIds(array $ids, bool $active): int;

    /**
     * Bulk soft delete by UUIDs
     *
     * @return int Number of affected rows
     */
    public function bulkDeleteByUuids(array $uuids): int;

    /**
     * Bulk force delete by UUIDs
     *
     * @return int Number of affected rows
     */
    public function bulkForceDeleteByUuids(array $uuids): int;

    /**
     * Bulk restore by UUIDs
     *
     * @return int Number of affected rows
     */
    public function bulkRestoreByUuids(array $uuids): int;

    /**
     * Bulk set active status by UUIDs
     *
     * @return int Number of affected rows
     */
    public function bulkSetActiveByUuids(array $uuids, bool $active): int;

    // --- Concurrencia / Transacciones ---

    /**
     * Ejecuta el callback dentro de una transacción de DB
     *
     * @return mixed
     */
    public function transaction(callable $callback);

    /**
     * Ejecuta el callback con lock pesimista sobre el registro por ID
     *
     * @return mixed
     */
    public function withPessimisticLockById(int|string $id, callable $callback);

    /**
     * Ejecuta el callback con lock pesimista sobre el registro por UUID
     *
     * @return mixed
     */
    public function withPessimisticLockByUuid(string $uuid, callable $callback);
}
