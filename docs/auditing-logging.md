# Auditoría y Logging

Esta guía resume cómo se auditan eventos y cómo se propaga `X-Request-Id` a los logs.

## Auditoría (laravel-auditing)

- **Modelo**: `app/Models/User.php` implementa `OwenIt\Auditing\Contracts\Auditable` y usa el trait `Auditable`.
    - Excluye atributos sensibles en `$auditExclude` (`password`, `remember_token`).
    - Se anotan propiedades dinámicas para el auditor (`$auditEvent`, `$auditCustomOld`, `$auditCustomNew`, `$isCustomEvent`).
- **Eventos personalizados**: `app/Providers/AppServiceProvider.php` escucha `Login` y `Logout`:
    - Arma un `auditCustomNew` con:
        - `ip` (petición actual),
        - `user_agent` (recortado a 500 chars),
        - `guard` (p. ej. `web`).
    - Establece `auditEvent` = `login` o `logout`, marca `isCustomEvent = true` y dispara `OwenIt\Auditing\Events\AuditCustom`.
    - Restablece el estado temporal (`auditCustomOld`, `auditCustomNew`, `isCustomEvent`).
- **Tablas**: el paquete crea una tabla `audits` (ver migración correspondiente) donde persiste cada evento.
- **Recomendación para nuevos módulos**:
    - Modelos con cambios relevantes: aplicar el trait `Auditable` y definir `auditExclude` para evitar ruido/sensibles.
    - Eventos del dominio (importaciones, cierres, etc.): puedes replicar el patrón de `AppServiceProvider` para disparar auditorías personalizadas.
    - Para auditorías de acciones HTTP específicas, considera middleware de acción o listeners dedicados que armen `auditCustomNew` y emitan `AuditCustom`.

## Logging con Request ID

- **Middleware**: `app/Http/Middleware/RequestId.php` hace lo siguiente en cada request:
    - Lee `X-Request-Id` entrante o genera un UUID.
    - Lo guarda en `request` como atributo `request_id` y en el header de la respuesta `X-Request-Id`.
- **Monolog Tap**: `app/Logging/RequestIdTap.php` agrega un processor que inyecta `extra.request_id` en cada log si existe en la request.
- **Canales**: `config/logging.php`
    - Canal `stack` incluye `tap` => `App\Logging\RequestIdTap::class` para añadir el ID a todos los logs del stack.
    - En CI/local (por defecto), `LOG_STACK=stderr` envía logs al `stderr` (útil para contenedores y pipelines).

## Tests incluidos

- `tests/Feature/Infrastructure/RequestIdMiddlewareTest.php`:
    - Verifica que cualquier respuesta incluya `X-Request-Id`.
    - Verifica que se respete un `X-Request-Id` entrante.
- Auditoría: se generan auditorías de login/logout automáticamente al autenticar o cerrar sesión; puedes inspeccionar la tabla `audits` en entorno de desarrollo.

## Buenas prácticas

- Incluye siempre `request_id` en logs externos (Sentry, Papertrail, etc.) para correlación de eventos.
- Evita auditar campos sensibles y datos de alto volumen; usa `auditExclude` y normaliza `auditCustomNew`.
- Para flujos críticos, añade asserts en tests que verifiquen la creación de auditorías relevantes (ej. conteo en `audits`).
