<?php

declare(strict_types=1);

use App\Http\Controllers\UsersController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/users', [UsersController::class, 'index'])->name('users.index');
    Route::get('/users/create', [UsersController::class, 'create'])->name('users.create');
    Route::post('/users', [UsersController::class, 'store'])->name('users.store');
    Route::get('/users/export', [UsersController::class, 'export'])->name('users.export');
    Route::post('/users/bulk', [UsersController::class, 'bulk'])->name('users.bulk');
    Route::get('/users/selected', [UsersController::class, 'selected'])->name('users.selected');
    Route::get('/users/{user}', [UsersController::class, 'show'])->name('users.show');
    Route::get('/users/{user}/edit', [UsersController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}', [UsersController::class, 'update'])->name('users.update');
    Route::patch('/users/{user}/active', [UsersController::class, 'setActive'])->name('users.setActive');
    Route::delete('/users/{user}', [UsersController::class, 'destroy'])->name('users.destroy');
});
