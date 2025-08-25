<?php

namespace App\Providers;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request) {
            return [
                Limit::perMinute(5)->by($request->ip().'|'.$request->input('email')),
            ];
        });

        RateLimiter::for('password-email', function (Request $request) {
            return [
                Limit::perMinute(5)->by($request->ip().'|'.$request->input('email')),
            ];
        });

        RateLimiter::for('password-reset', function (Request $request) {
            return [
                Limit::perMinute(5)->by($request->ip().'|'.$request->input('email')),
            ];
        });

        // Audit login/logout events
        Event::listen(Login::class, function (Login $event) {
            /** @var \Illuminate\Contracts\Auth\Authenticatable $user */
            $user = $event->user;
            if ($user instanceof \App\Models\User) {
                $user->auditEvent = 'login';
                $user->auditCustomOld = [];
                $user->auditCustomNew = [
                    'ip' => request()->ip(),
                    'user_agent' => substr((string) request()->userAgent(), 0, 500),
                    'guard' => $event->guard,
                ];
                $user->isCustomEvent = true;
                event(new \OwenIt\Auditing\Events\AuditCustom($user));
                // Reset temporary audit state
                $user->auditCustomOld = $user->auditCustomNew = [];
                $user->isCustomEvent = false;
            }
        });

        Event::listen(Logout::class, function (Logout $event) {
            /** @var \Illuminate\Contracts\Auth\Authenticatable $user */
            $user = $event->user;
            if ($user instanceof \App\Models\User) {
                $user->auditEvent = 'logout';
                $user->auditCustomOld = [];
                $user->auditCustomNew = [
                    'ip' => request()->ip(),
                    'user_agent' => substr((string) request()->userAgent(), 0, 500),
                    'guard' => $event->guard,
                ];
                $user->isCustomEvent = true;
                event(new \OwenIt\Auditing\Events\AuditCustom($user));
                // Reset temporary audit state
                $user->auditCustomOld = $user->auditCustomNew = [];
                $user->isCustomEvent = false;
            }
        });
    }
}
