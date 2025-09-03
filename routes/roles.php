<?php

declare(strict_types=1);

use App\Http\Controllers\RolesController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/roles', [RolesController::class, 'index'])->name('roles.index');
    Route::get('/roles/export', [RolesController::class, 'export'])->name('roles.export');
    Route::post('/roles/bulk', [RolesController::class, 'bulk'])->name('roles.bulk');
    Route::get('/roles/selected', [RolesController::class, 'selected'])->name('roles.selected');
    Route::get('/roles/{role}', [RolesController::class, 'show'])->name('roles.show');
    Route::patch('/roles/{role}/active', [RolesController::class, 'setActive'])->name('roles.setActive');
    Route::delete('/roles/{role}', [RolesController::class, 'destroy'])->name('roles.destroy');
});
