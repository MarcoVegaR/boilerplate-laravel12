<?php

declare(strict_types=1);

use App\Http\Controllers\RolesController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/roles', [RolesController::class, 'index'])->name('roles.index');
    Route::get('/roles/create', [RolesController::class, 'create'])->name('roles.create');
    Route::post('/roles', [RolesController::class, 'store'])->name('roles.store');
    Route::get('/roles/export', [RolesController::class, 'export'])->name('roles.export');
    Route::post('/roles/bulk', [RolesController::class, 'bulk'])->name('roles.bulk');
    Route::get('/roles/selected', [RolesController::class, 'selected'])->name('roles.selected');
    Route::get('/roles/{role}', [RolesController::class, 'show'])->name('roles.show');
    Route::get('/roles/{role}/edit', [RolesController::class, 'edit'])->name('roles.edit');
    Route::put('/roles/{role}', [RolesController::class, 'update'])->name('roles.update');
    Route::patch('/roles/{role}/active', [RolesController::class, 'setActive'])->name('roles.setActive');
    Route::delete('/roles/{role}', [RolesController::class, 'destroy'])->name('roles.destroy');
});
