<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * Track which test classes have already registered their routes.
     * Keyed by "<class>|<app-hash>" to handle app refreshes between tests.
     *
     * @var array<string,bool>
     */
    protected static array $routesRegisteredFor = [];

    protected function setUp(): void
    {
        parent::setUp();

        // Allow each test class to define its own routes via defineRoutes($router)
        $class = static::class;
        $appKey = $class.'|'.spl_object_hash(app());
        if (method_exists($this, 'defineRoutes') && ! isset(self::$routesRegisteredFor[$appKey])) {
            $this->defineRoutes(app('router'));
            // Refresh route caches/lookups and URL generator after dynamic route registration
            $routes = app('router')->getRoutes();
            $routes->refreshNameLookups();
            $routes->refreshActionLookups();
            app('url')->setRoutes($routes);
            self::$routesRegisteredFor[$appKey] = true;
        }
    }
}
