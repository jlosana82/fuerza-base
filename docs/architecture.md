# Fuerza Base

Aplicación personal de fuerza mobile-first.

## Arquitectura
React + TypeScript para UI; servicios de dominio independientes para progresión y métricas; repositorios para persistencia D1/SQLite con identificación de usuario. Adaptadores de Sites separados de dominio. Historial conserva snapshots y no depende de cambios posteriores en rutinas.

## Navegación
Inicio, Rutinas, Historial, Progreso, Ajustes.

## Entidades
User, Routine, WorkoutDay, Exercise, RoutineExercise, WorkoutSession, ExerciseSession, Set, BodyMeasurement, PersonalRecord, ExerciseProgression.

## Fases
1. Modelo, biblioteca y rutinas editables.
2. Sesiones, series, RIR, descanso y recuperación.
3. Historial, progresión y PR.
4. Medidas y gráficos.
5. Verificación y optimización móvil.

No se almacenan datos personales ni credenciales en el repositorio.