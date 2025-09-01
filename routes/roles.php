<?php

declare(strict_types=1);

use App\Http\Controllers\RolesController;
use Illuminate\Support\Facades\Route;

Route::prefix('roles')
    ->name('roles.')
    ->middleware(['auth'])
    ->group(function () {
        Route::get('/', [RolesController::class, 'index'])->name('index');
        Route::get('/export', [RolesController::class, 'export'])
            ->name('export')
            ->middleware('throttle:exports');
        Route::post('/bulk', [RolesController::class, 'bulk'])
            ->name('bulk')
            ->middleware('throttle:bulk');
        Route::get('/selected', [RolesController::class, 'selected'])->name('selected');
        Route::patch('/{role}/active', [RolesController::class, 'setActive'])->name('setActive');
        Route::delete('/{role}', [RolesController::class, 'destroy'])->name('destroy');
    });
