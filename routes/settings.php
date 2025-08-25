<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', 'settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])
        ->middleware('can:settings.profile.view')
        ->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])
        ->middleware('can:settings.profile.update')
        ->name('profile.update');
    // Route disabled: users cannot delete their own account
    // Route::delete('settings/profile', [ProfileController::class, 'destroy'])
    //     ->middleware('can:settings.profile.delete')
    //     ->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])
        ->middleware('can:settings.password.update')
        ->name('password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('can:settings.password.update')
        ->name('password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->middleware('can:settings.appearance.view')
        ->name('appearance');
});
