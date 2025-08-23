# Boilerplate Laravel 12 — React + TypeScript (Inertia)

Base inicial del proyecto con Laravel 12 y React + TypeScript (Inertia) lista para desarrollo local con Vite, autenticación básica y estructura mínima de páginas.

## Tabla de contenidos

- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso rápido](#uso-rápido)
- [Configuración](#configuración)
- [Tema (shadcn/ui — Supabase)](#tema-shadcnui--supabase)
- [Convenciones (Commits y Ramas)](#convenciones-commits-y-ramas)
- [CI / Calidad](#ci--calidad)
- [Versionado y Releases](#versionado-y-releases)
- [Estructura](#estructura)
- [Scripts útiles](#scripts-útiles)
- [Checklist inicial](#checklist-inicial)
- [Roadmap / Estado](#roadmap--estado)
- [Contribuir](#contribuir)
- [Licencia](#licencia)
- [Seguridad](#seguridad)

## Requisitos

- PHP 8.2+ (testeado en 8.3)
- Composer 2.x
- Node.js 20+ y npm

## Instalación

```bash
# 1) Variables de entorno
cp .env.example .env
php artisan key:generate

# 2) Dependencias
composer install
npm install
# Primer setup: permisos de Husky (hooks)
chmod +x .husky/*

# 3) Build inicial de front
npm run build

# 4) Base de datos (PostgreSQL por defecto)
# Crear BD (usuario/clave: postgres). Usa tu puerto por defecto (5432)
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE boilerplate_laravel12"
php artisan migrate
# Si tu BD ya tenía tablas o hay conflictos:
# php artisan migrate:fresh --seed
```

## Uso rápido

```bash
# Entorno de desarrollo (Laravel + Vite + Queue + Logs)
composer run dev
```

- Laravel: http://127.0.0.1:8000 (por defecto).
- Vite: recarga en caliente automática con `laravel-vite-plugin`.
- Rutas base: ver `routes/web.php`, `routes/auth.php` y `routes/settings.php`.
    - `/` → página `welcome` (Inertia)
    - `/dashboard` (requiere autenticación)
    - Autenticación: `login`, recuperación/confirmación/verificación de email.
    - Registro: deshabilitado por política (provisión de usuarios solo por admin). Ver `routes/auth.php` para detalles.

## Configuración

- Archivo: `.env` (ver ejemplo en `.env.example`). Claves relevantes:
    - `APP_NAME`, `APP_URL`
    - `DB_CONNECTION=pgsql` (por defecto). Variables sugeridas:
        - `DB_HOST=127.0.0.1`
        - `DB_PORT=5432` (por defecto)
        - `DB_DATABASE=boilerplate_laravel12`
        - `DB_USERNAME=postgres`
        - `DB_PASSWORD=postgres`
    - ¿Prefieres SQLite para desarrollo rápido? Cambia a `DB_CONNECTION=sqlite` y crea la BD:
        ```bash
        touch database/database.sqlite
        ```
    - `SESSION_DRIVER=database` → crea la tabla de sesiones si usas este driver:
        ```bash
        php artisan session:table && php artisan migrate
        ```
    - `QUEUE_CONNECTION=database` (el script de desarrollo levanta `queue:listen`).
    - `MAIL_*` para correo. Por defecto `log`.
    - `VITE_APP_NAME` usado en el front.
    - Idiomas (ya configurado en este repo):
        - `APP_LOCALE=es`, `APP_FALLBACK_LOCALE=es`, `APP_FAKER_LOCALE=es_ES`

### Localización

- UI y validaciones están en español por defecto.
- Mensajes del backend usan helpers de localización. Para cadenas sueltas se utiliza `lang/es.json`.
    - Ej.: mensaje de recuperación: "A reset link will be sent if the account exists." → "Si la cuenta existe, se enviará un enlace de restablecimiento." (definido en `lang/es.json`).

## Tema (shadcn/ui — Supabase)

El tema Supabase de shadcn/ui ya viene preconfigurado en este proyecto.

- Tokens CSS definidos en `resources/css/app.css` bajo `:root` y `.dark`.
- Para ajustar la paleta, edita variables como `--background`, `--foreground`, `--primary`, etc. en ese archivo.
- `components.json` ya apunta a `resources/css/app.css`, por lo que no se requieren pasos adicionales.

## Convenciones (Commits y Ramas)

- Rama: `main` (flujo de una sola rama).
- Commits: [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/)
    - Tipos comunes: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `build`, `ci`, `chore`, `perf`, `revert`.
    - Ej.: `feat(auth): agrega 2FA por TOTP`.
- Hooks Git (Husky + lint-staged):
    - Pre-commit: ejecuta Pint/ESLint/Prettier en archivos staged.
    - Commit-msg: valida formato de commits con commitlint.
    - Tras `npm install`, Husky se instala automáticamente por `scripts.prepare`. Si es tu primer setup, asegúrate de dar permisos: `chmod +x .husky/*`.

## CI / Calidad

Workflows:

- `/.github/workflows/lint.yml`
    - Cache Composer/Node.
    - Pint (modo `--test`), Prettier check, ESLint (`lint:ci`), TypeScript (`typecheck`), PHPStan (`composer run analyse`).
- `/.github/workflows/tests.yml`
    - Cache Composer/Node.
    - Build de assets (`npm run build`).
    - PHPUnit con SQLite en memoria.

Notas:

- PHPStan/Larastan: `phpstan.neon.dist` incluye `vendor/larastan/larastan/extension.neon` (sin `rules.neon`).

## Versionado y Releases

- Versionado automático con `semantic-release` desde la rama `main`.
- Archivo: `release.config.js`.
- Workflow: `/.github/workflows/release.yml`.
- Genera `CHANGELOG.md` y crea GitHub Releases con notas, a partir de Conventional Commits.

## Estructura

```text
.
├── app/
│   └── Http/
│       ├── Controllers/
│       └── Requests/
├── resources/
│   ├── css/app.css
│   ├── js/app.tsx            # Entrada Inertia + React + TS
│   ├── js/ssr.jsx            # Entrada SSR (opcional)
│   ├── js/pages/
│   │   ├── welcome.tsx
│   │   ├── dashboard.tsx
│   │   ├── auth/*
│   │   └── settings/*        # profile, password, appearance
│   ├── js/layouts/*
│   ├── js/components/*
│   └── views/app.blade.php   # Layout Blade para Inertia
├── routes/
│   ├── web.php
│   ├── auth.php
│   └── settings.php
├── vite.config.js
├── package.json
├── composer.json
└── phpunit.xml
```

## Scripts útiles

- Back + Front en paralelo:
    - `composer run dev`
        - Internamente ejecuta: `php artisan serve`, `php artisan queue:listen`, `php artisan pail` (logs), `npm run dev` (Vite).
- Front-end:
    - `npm run dev` (Vite dev server)
    - `npm run build` (build de assets)
    - `npm run build:ssr` (CSR + SSR)
    - `npm run lint` (ESLint) | `npm run lint:ci` (ESLint sin fix) | `npm run format[:check]` (Prettier)
    - `npm run typecheck` (TypeScript sin emitir)
- PHP:
    - `php artisan migrate` | `php artisan db:seed`
    - `php artisan test` (o `vendor/bin/phpunit`)
    - `vendor/bin/pint` (formateo de PHP) | `composer run pint`
    - `composer run analyse` (PHPStan + Larastan)
- Releases:

    - `npm run release` (ejecuta semantic-release; normalmente lo hace CI al pushear a `main`).

- Verificación local (replica la CI antes de commitear):
    ```bash
    npm run lint:ci && npm run typecheck && npm run format:check \
      && composer run analyse && vendor/bin/pint -n --test \
      && npm run build && php artisan test -q
    ```

## Checklist inicial

- [ ] Ejecutar `composer install` y `npm install` (instala Husky hooks). Primer setup: `chmod +x .husky/*`.
- [ ] Configurar `.env` y ejecutar `php artisan key:generate`.
- [ ] `npm run build` inicial y `php artisan migrate`.
- [ ] Verificar que pre-commit formatea/lint y que commitlint valida mensajes.
- [ ] Ejecutar verificación local (one-liner de CI) y confirmar que todo pasa.
- [ ] Confirmar pipelines de CI (lint/tests) en push/PR a `main`.
- [ ] Hacer un commit convencional en `main` y verificar que `semantic-release` genera Release/CHANGELOG.

## Roadmap / Estado

- Estado: commit inicial con esqueleto funcional.
    - Autenticación básica (registro/login/reset/verify).
    - Dashboard protegido y páginas de Settings (perfil, contraseña, apariencia).
    - Vite + React + TypeScript + Inertia funcionando.
- Próximos pasos (sugeridos):
    - Documentación de despliegue (Docker/CI/CD).
    - Integraciones (p. ej. Spatie, MFA/2FA, auditoría) — por definir.
    - Changelog y versionado (SemVer + Keep a Changelog) — por definir.

## Contribuir

PRs bienvenidas. Próximamente: `CONTRIBUTING.md` y `CODE_OF_CONDUCT.md`.

## Licencia

MIT — ver [LICENSE](LICENSE).

## Seguridad

Si encuentras una vulnerabilidad, por favor abre un Issue privado (o un Security Advisory en GitHub cuando esté habilitado). No publiques detalles de explotación antes de un parche.
