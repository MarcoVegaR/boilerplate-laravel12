<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Contracts\Services\RoleServiceInterface;
use App\Http\Requests\DeleteBulkRolesRequest;
use App\Http\Requests\DeleteRolesRequest;
use App\Http\Requests\RoleIndexRequest;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

/**
 * Controller for Role management operations.
 *
 * @author Laravel Boilerplate
 */
class RolesController extends BaseIndexController
{
    /**
     * Create a new controller instance.
     *
     * @param  RoleServiceInterface  $roleService
     */
    private RoleServiceInterface $roleService;

    public function __construct(RoleServiceInterface $roleService)
    {
        parent::__construct($roleService);
        $this->roleService = $roleService;
    }

    /**
     * Display a listing of the resource.
     *
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function index(Request $request): \Inertia\Response
    {
        $response = parent::index($request);

        $extras = $this->roleService->getIndexExtras();
        $response->with('stats', $extras['stats'] ?? []);
        $response->with('availablePermissions', $extras['availablePermissions'] ?? []);

        return $response;
    }

    /**
     * Get the policy model class.
     */
    protected function policyModel(): string
    {
        return \Spatie\Permission\Models\Role::class;
    }

    /**
     * Get the view name for index.
     */
    protected function view(): string
    {
        return 'roles/index';
    }

    /**
     * Get additional data to include in the view.
     *
     * @return array<string>
     */
    protected function with(): array
    {
        return ['permissions'];
    }

    /**
     * Get relationships to count.
     *
     * @return array<string>
     */
    protected function withCount(): array
    {
        return [];
    }

    /**
     * Get the index route name.
     */
    protected function indexRouteName(): string
    {
        return 'roles.index';
    }

    /**
     * Get allowed export formats.
     *
     * @return array<string>
     */
    protected function allowedExportFormats(): array
    {
        return ['csv', 'xlsx', 'json'];
    }

    /**
     * Get the index request class.
     */
    protected function indexRequestClass(): string
    {
        return RoleIndexRequest::class;
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return \Illuminate\Http\RedirectResponse
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function destroy(DeleteRolesRequest $request, Role $role)
    {
        $this->authorize('delete', $role);

        $roleName = $role->name;
        $this->roleService->deleteSafely($role);

        return redirect()->route('roles.index')
            ->with('success', "El rol '{$roleName}' ha sido eliminado correctamente.");
    }

    /**
     * Handle bulk actions for roles.
     *
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    public function bulk(Request $request): \Illuminate\Http\RedirectResponse
    {
        $action = $request->input('action');

        // Delegate non-delete actions to the parent implementation
        if ($action !== 'delete') {
            return parent::bulk($request);
        }

        // Authorization for bulk delete
        $this->authorize('bulk', [Role::class, 'delete']);

        // Convert to FormRequest to run centralized validations
        $validatedRequest = DeleteBulkRolesRequest::createFrom($request);
        $validatedRequest->setContainer(app());
        $validatedRequest->setRedirector(app('redirect'));
        $validatedRequest->validateResolved();

        // Centralized validations in the request
        [$deletable, $skipped] = array_values($validatedRequest->getDeletableRolesAndSkipped());

        $deletedCount = 0;
        foreach ($deletable as $role) {
            $this->roleService->deleteSafely($role);
            $deletedCount++;
        }

        $skippedCount = count($skipped);

        if ($skippedCount > 0) {
            return redirect()->route('roles.index')
                ->with('warning', "Se eliminaron {$deletedCount} rol(es). Se omitieron {$skippedCount} rol(es) por validaciones de eliminación.");
        }

        return redirect()->route('roles.index')
            ->with('success', "Se eliminaron {$deletedCount} rol(es) correctamente.");
    }
}
