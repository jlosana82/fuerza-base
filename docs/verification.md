# Verificación

- TypeScript: compilación de tipos sin errores.
- Pruebas de dominio: crear/activar/duplicar rutinas, activación única, registrar series, serializar y recuperar sesión, descanso persistido, finalizar y avanzar de día, incrementar/mantener/reducir carga, PR, reiniciar/cancelar conservando historial, eliminar rutina sin perder sesiones, medidas y validación de rangos.
- Build de Worker y cliente: correcto.
- La prueba de navegador y la verificación del adaptador D1 se completan durante el despliegue inicial; resultados finales más abajo.

- SQLite real (node:sqlite): migración aplicada, carga inicial, 11 tablas, guardado y reconstrucción de series, aislamiento entre dos usuarios y rechazo de revisión obsoleta sin borrar series confirmadas.
- Navegador: el entorno local redirige al inicio de sesión de Sites, que no está disponible en esta vista previa; no se pudo completar QA visual ni clics de extremo a extremo. No se modificó la autenticación de producción para sortear esta limitación.
- WebMCP: soporte implementado con detección de disponibilidad; validación en navegador no disponible por la misma limitación.

## Actualización: series variables

Regresiones de dominio y repositorio superadas, más 24 escenarios SQL detallados en `docs/series-audit.md`. No hay migraciones SQL destructivas ni cambios a datos de producción durante las pruebas. Los casos de recarga descartan el estado y vuelven a consultar SQLite. La prueba de navegador real mantiene la limitación descrita arriba.
