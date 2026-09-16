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
