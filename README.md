# Fuerza Base

Aplicación web personal de entrenamiento de fuerza, mobile-first, construida con React 19, TypeScript y Vinext. Preparada para separar datos de distintos usuarios. La publicación en Sites es privada y usa inicio de sesión con ChatGPT.

## Funcionalidades

- Biblioteca inicial de 21 ejercicios y ejercicios personalizados editables.
- Rutinas por días: crear, editar, duplicar, archivar, eliminar y activar una sola.
- Parámetros independientes por ejercicio: series, repeticiones, RIR, incremento, descanso, tipo y notas; reordenación de ejercicios.
- Rutina inicial Fuerza Base A/B, completamente editable.
- Sesiones con series individuales, RIR 0–5, controles de carga/reps y corrección de series guardadas.
- Recuperación de sesiones, reinicio y cancelación con conservación del historial.
- Descanso automático, pausa, +30 segundos y salto; persistido como marca temporal.
- Doble progresión, reducción sugerida y edición libre de las cargas.
- Historial con snapshots, PR por carga, repeticiones por carga, e1RM estimado y volumen.
- Peso y perímetros con fecha, edición y gráficos.
- Dashboard con próxima sesión, adherencia semanal, última sesión y datos reales, sin historial ficticio.
- Ajustes de kg/lb, tema oscuro/claro, semana, fechas, temporizador, RIR y objetivo semanal.

## Arquitectura

- `components/fitness`: interfaz y gráficos, componentes accesibles del catálogo incluido.
- `lib/domain/model.ts`: entidades e inicialización sin datos personales.
- `lib/domain/actions.ts`: validación Zod y transiciones de estado puras.
- `lib/domain/progression.ts`: recomendaciones, Epley, volumen y PR.
- `lib/server/repository.ts`: adaptador D1 con sentencias preparadas y transacciones.
- `app/api`: autenticación, validación de origen y acceso a datos por usuario.
- `app/chatgpt-auth.ts`: adaptador de identidad de Sites. Sustituible al migrar.
- `db/schema.ts` y `drizzle`: esquema y migraciones versionadas.
- `tests/run.mjs`: pruebas de dominio; `docs/verification.md`: verificación realizada.

## Datos

Once tablas: users, exercises, routines, workout_days, routine_exercises, workout_sessions, exercise_sessions, sets, body_measurements, personal_records, exercise_progressions. Las entidades tienen clave compuesta `(user_id,id)`, `parent_id`, posición y carga útil JSON tipada. La propiedad del usuario tiene FK; las relaciones entre entidades se validan en el dominio y se escriben atómicamente. Esta combinación conserva los registros separados sin duplicar todas las definiciones del dominio en SQL. Para consultas analíticas masivas se pueden promover campos JSON a columnas indexadas.

Las sesiones guardan snapshots de la configuración; editar o borrar una rutina no modifica el historial. Las sesiones reiniciadas o canceladas se conservan. Los PR y recomendaciones se recalculan y persisten con cada cambio pertinente.

El adaptador usa un número de revisión por usuario y una marca de operación: las escrituras de cada transacción solo se aplican si coinciden con esa revisión. Dos dispositivos no pueden sobrescribirse silenciosamente. Los conflictos piden revisar y guardar de nuevo. Las respuestas de datos no se cachean.

Todos los pesos se almacenan internamente en kg. La conversión a lb es de presentación y entrada. Para ejercicios de peso corporal se registra solo el lastre, el volumen refleja carga externa y no se calcula e1RM.

## Desarrollo

Node >=22.13 y el gestor pnpm fijado en package.json.

```sh
pnpm install --frozen-lockfile
pnpm run db:generate
pnpm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_nasty_masque.sql
pnpm dev
```

El entorno de desarrollo necesita cabeceras de identidad a través de un proxy local de confianza. Nunca configurar una identidad de prueba en producción. La vista previa supervisada de Sites aporta su infraestructura; el acceso de producción lo controla el dispatcher.

```sh
node tests/run.mjs
pnpm exec tsc --noEmit
```

No se guardan credenciales ni datos de entrenamiento en Git. `.openai/hosting.json` solo contiene identidad del Site y enlaces lógicos a recursos.

## Migración y despliegue fuera de Sites

La lógica de negocio no importa Cloudflare. Para migrar a PostgreSQL/Supabase/Firebase, implementar `load(userId)` y `save(userId,before,after)` con transacciones y revisión optimista equivalentes, sustituir `getChatGPTUser` por un proveedor de identidad y adaptar el despliegue del framework. El esquema, snapshots y unidades deben conservarse. El Worker actual utiliza HTTP, no sockets TCP.

## Límites de esta versión

Es una primera versión funcional, no una garantía de retención indefinida ni un servicio de backup. El registro de series requiere conexión y confirmación de guardado; los campos aún no confirmados pueden perderse al cerrar. Cada petición carga el historial de un usuario; para años de uso intensivo, añadir paginación y operaciones SQL específicas antes de crecer. No ofrece modo sin conexión, exportación de backups ni sincronización automática bidireccional con GitHub.

La duración mide tiempo transcurrido entre inicio y fin e incluye pausas fuera de la aplicación. Las sesiones incompletas pueden finalizarse tras confirmación. El e1RM es una estimación; la progresión no es asesoramiento individual ni sustituye ajustar la rutina al usuario.

## Roadmap

1. Base de datos, biblioteca y rutinas: implementado.
2. Sesiones, series, RIR y recuperación: implementado.
3. Historial, recomendaciones y PR: implementado.
4. Medidas, gráficos y dashboard: implementado.
5. Verificación y adaptación móvil: ver `docs/verification.md`.
6. Evolución: paginación, copias exportables, cola sin conexión y proveedor de identidad independiente.

El usuario ha autorizado publicar el código en el repositorio público GitHub. Los datos de entrenamiento permanecen en la base de datos privada del Site.

## Series programadas y adicionales

El editor permite configurar `targetSets` por ejercicio con botones −/+ o entrada numérica (1–100). Durante el entrenamiento, «Añadir serie» crea una adicional independiente; se pueden eliminar pendientes y realizadas (estas últimas con confirmación). Las operaciones no modifican la rutina. El historial y métricas solo consideran series realizadas, con adicionales identificadas. Los calentamientos están previstos en el modelo, sin UI de creación todavía.

El cumplimiento conserva el objetivo inicial de programadas; las extras aparecen aparte. Eliminar una programada no reduce artificialmente ese objetivo. Para subir la carga se exige completar las programadas del snapshot, sin que una extra al fallo lo impida. Ver decisiones y compatibilidad en `docs/architecture.md`.

Prueba completa de series y datos antiguos:

```sh
node tests/series.mjs
```
