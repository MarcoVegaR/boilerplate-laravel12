# Boilerplate Laravel 12 — React + TypeScript (Inertia)

Base inicial del proyecto con Laravel 12 y React + TypeScript (Inertia) lista para desarrollo local con Vite, autenticación básica y estructura mínima de páginas.

## Tabla de contenidos
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Uso rápido](#uso-rápido)
- [Configuración](#configuración)
- [Tema (shadcn/ui — Supabase)](#tema-shadcnui--supabase)
- [Estructura](#estructura)
- [Scripts útiles](#scripts-útiles)
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

# 2) Dependencias front-end
npm install
npm run build  # build inicial

# 3) Base de datos (PostgreSQL por defecto)
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
  - Pruebas: `phpunit.xml` usa SQLite en memoria (`DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`) por defecto.

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
  - `npm run lint` (ESLint) | `npm run format[:check]` (Prettier)
- PHP:
  - `php artisan migrate` | `php artisan db:seed`
  - `php artisan test` (o `vendor/bin/phpunit`)
  - `vendor/bin/pint` (formateo de PHP)

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
