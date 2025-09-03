<?php

declare(strict_types=1);

namespace App\Http\Requests;

/**
 * Request validation for showing a single role.
 *
 * Defines whitelisted relations, counts, and appends
 * that can be requested when viewing a role.
 *
 * @author Laravel Boilerplate
 */
class RoleShowRequest extends BaseShowRequest
{
    /**
     * Get the allowed relations for eager loading.
     *
     * @return array<string>
     */
    protected function allowedRelations(): array
    {
        return [
            'permissions',
        ];
    }

    /**
     * Get the allowed relations for counting.
     *
     * @return array<string>
     */
    protected function allowedCounts(): array
    {
        return [
            'permissions',
        ];
    }

    /**
     * Get the allowed attributes to append.
     *
     * @return array<string>
     */
    protected function allowedAppends(): array
    {
        return [];
    }
}
