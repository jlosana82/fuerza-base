# Decisiones de arquitectura

## Identidad y autorización
Cada API obtiene la identidad en el servidor. El cliente nunca decide `user_id`. Sites mantiene el acceso privado del propietario; si se amplía en el futuro, los datos ya están separados por usuario. Ninguna ruta modifica datos sin identidad. La API de escritura rechaza solicitudes de origen cruzado.

## Almacenamiento
SQLite/D1 almacena entidades separadas. Los campos flexibles del dominio viven en JSON; las claves, propiedad, relaciones y orden viven en columnas. Todas las mutaciones usan batch transaccional y revisión optimista. Las sentencias adicionales se condicionan a la marca de operación para que una revisión rechazada no modifique ninguna entidad.

## Historial
Los nombres y parámetros del ejercicio se copian al iniciar la sesión. El historial permanece aunque se modifique o elimine la rutina. Los reinicios generan una nueva sesión y conservan la cancelada. Solo sesiones completadas alimentan recomendaciones y PR.

## Recomendaciones
Incremento cuando todas las series previstas llegan al máximo y mantienen como mínimo el RIR solicitado; un RIR superior al máximo también indica margen suficiente. Cargas distintas entre series no producen un incremento automático. Dos series con RIR 0 o muy por debajo del mínimo sugieren una reducción de un incremento. El usuario decide la carga final.

## Portabilidad
El repositorio D1 y las cabeceras de identidad de Sites son adaptadores. Modelo, validación, transición, progresión y gráficos son independientes de la plataforma.

## Series de rutina y de sesión (septiembre de 2026)

`RoutineExercise.targetSets` es el objetivo de la plantilla. Al iniciar se copia la configuración y se crean registros independientes con identificadores estables. Cada serie tiene `type` (`programmed`, `additional`, `warmup`) y `status` (`pending`, `completed`, `removed`). Añadir/eliminar/editar una serie solo modifica el ejercicio de la sesión; nunca escribe la plantilla. Una futura acción explícita para aplicar cambios a la rutina podrá usar `routineId`, `dayId` y `config.id` con comprobación de revisión.

El denominador del progreso es la suma de objetivos originales. Solo las programadas completadas suman al numerador. Las adicionales realizadas se muestran aparte, no reducen el porcentaje ni permiten superar el 100%. Eliminar una programada conserva el objetivo original: permite finalizar, pero no simula cumplimiento. Una serie eliminada conserva un registro interno marcado `removed` para no perder el objetivo original ni resucitar al adaptar datos antiguos. No aparece como realizada en el historial ni participa en cálculos.

La progresión compara únicamente las programadas realizadas con el objetivo completo de su snapshot. Si falta una, o ha cambiado el número de series en la plantilla actual, no recomienda aumento. Las adicionales sí cuentan en volumen/PR de trabajo, pero no condicionan doble progresión. Los calentamientos están soportados por el dominio, sin control de creación en UI, y quedan fuera de volumen de trabajo, PR, progreso y recomendaciones. El historial muestra todas las realizadas con sus tipos.

### Compatibilidad y persistencia

No se modifica ninguna migración SQL ya aplicada ni se reinicia la base de datos. El esquema existente guarda los campos nuevos en JSON. Al leer, `normalizeState` convierte el antiguo campo `sets` en `targetSets`, asigna tipo/estado a los registros previos y genera pendientes solo para sesiones antiguas aún activas. Mantiene IDs, cargas, repeticiones, RIR y fechas. Es idempotente. El repositorio conserva las filas originales en un WeakMap y escribe la adaptación junto con la siguiente operación autorizada en la misma transacción con control de revisión. Las sesiones finalizadas no reciben series ficticias realizadas.

Al reiniciar se conserva la sesión cancelada y se generan las programadas del snapshot original. Editar una serie completada no reinicia el descanso. Un cliente antiguo que intente guardar una serie desconocida recibe un error y debe recargar; nunca se inventan series para aceptar una escritura obsoleta.
