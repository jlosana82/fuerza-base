# Auditoría del sistema de series

## Ejecutado

`node tests/series.mjs` ejecuta las regresiones originales, el adaptador SQL real sobre SQLite y 24 escenarios adicionales:

- Generación y finalización con 1, 3 y 5 series, y recomendación posterior.
- Añadir antes y después de completar las programadas.
- Eliminar pendiente y realizada, con confirmación obligatoria para esta última.
- Editar carga/repeticiones/RIR y conservar temporizador al editar.
- Guardar, descartar estado en memoria y reconstruir desde la base de datos.
- Finalizar con menos y con más series que las previstas.
- Historial con adicionales y plantilla intacta.
- Extra al fallo sin bloquear aumento tras completar las principales.
- Calentamientos fuera de volumen, PR, cumplimiento y recomendaciones.
- Lectura y adaptación de datos del modelo original; IDs y valores preservados.
- Eliminaciones que no reaparecen al recargar y conflictos entre dispositivos.
- Edición de plantilla durante la sesión y nueva configuración en la siguiente.

Las pruebas usan cuentas sintéticas en SQLite en memoria; no escriben datos del usuario. La recompilación TypeScript valida todas las llamadas de interfaz y API.

## Límite de verificación de interfaz

Las pruebas cubren el dominio y persistencia, no equivalen a cerrar y abrir un navegador real. La vista previa de esta aplicación privada redirige a un inicio de sesión de Sites no disponible allí, como se comprobó en la primera publicación. No se debilita la autenticación para superar esa limitación. La validación visual y de clics de extremo a extremo sigue pendiente.

## Siguiente auditoría (sin implementar cambios en esta entrega)

- Calentamientos: UI de clasificación y reglas de prellenado.
- Peso corporal y lastre: coherencia de carga 0, lastre y estimaciones; no sumar cuerpo a volumen externo.
- Unilaterales: distinguir carga por mano/lado, repeticiones por lado y total.
- Descarga sugerida: frecuencia de RIR 0, sesiones incompletas y cambios de rango.
- Reordenar ejercicios o sustituirlos solo en la sesión conservando snapshots y origen.
- Persistencia de campos todavía no confirmados y cola sin conexión.
