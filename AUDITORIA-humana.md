# QBO CRM — ¿Cómo está la app? (versión para todos)

**Fecha:** 4 oct 2026
**En una frase:** la app se ve completa y funciona en pantalla, pero por dentro tiene temas de seguridad y partes sin terminar que hay que arreglar antes de usarla con clientes reales.

> Este es el resumen simple. Los técnicos conservamos `AUDITORIA.md` con el detalle file:line para solucionarlo.

## El semáforo

- 🔴 **Seguridad (urgente):** cualquiera con un poco de maña podría entrar sin permiso, ver o borrar datos. Las contraseñas están guardadas sin cifrar y la base de datos está abierta.
- 🟡 **Funciones a medias:** hay secciones que se ven bien pero sus botones no hacen nada (Reportes, Pronósticos, Ajustes).
- 🟢 **Lo que sí funciona:** el menú, el login básico, Proyectos y Contactos guardan de verdad, y la prueba automática de las 9 pantallas pasó sin errores graves.

## Lo que está mal, en palabras simples

### 1. Las llaves están bajo el tapete 🔴
Hoy la app confía en lo que dice el navegador. Si alguien cambia un dato guardado en su propio computador, puede hacerse pasar por jefe.
**Solución:** poner la revisión de permisos en el servidor y cifrar contraseñas. Nada de esto lo ve el usuario, pero es lo primero.

### 2. La bodega está sin candado 🔴
La base de datos acepta órdenes de cualquier desconocido. Eso incluye leer contraseñas y borrar tablas.
**Solución:** poner candado (permisos por rol) y obligar a pasar por caja (el servidor) para escribir.

### 3. Hay puertas que no llevan a ninguna parte 🟡
En Reportes, Pronósticos y Ajustes hay botones de "Generar", "Descargar", "Refrescar", "Guardar" que hoy son de mentira: hacen una animación pero no guardan nada.
**Solución:** o se conectan de verdad, o se marcan como "Próximamente" para no confundir.

### 4. El plano no coincide con la construcción 🟡
Los planos de la base de datos (Drizzle) no coinciden con lo realmente construido (Supabase). Hay una tabla fantasma y tipos distintos. Hoy no se cae, pero cualquier cambio futuro puede romper todo.
**Solución:** unificar en un solo plano y ordenar la obra.

### 5. El lector de PDFs y fotos es adivino 🟡
Cuando subes una cotización o comprobante, la app intenta adivinar números y a veces inventa el IVA o lee mal el total. Con fotos borrosas se puede quedar pegada.
**Solución:** validarlo mejor, poner límites de tamaño y mostrar qué tan seguro está del dato.

### 6. Detalles que restan confianza 🟢
Borrar sin preguntar "¿seguro?", errores que solo salen en consola, tablas sin paginar, textos en inglés mezclados. No botan la app, pero se nota lo poco pulido.
**Solución:** mensajes claros, confirmar borrados, paginar y ordenar textos.

## Cómo es el trabajo hoy (y cómo dejarlo más fácil)

**Hoy haces así:** creas el contacto → creas el proyecto y lo atas al contacto → miras el tablero → entras al proyecto y subes ficha/fotos/diseño → subes la cotización en PDF, la revisas y la apruebas → se genera el contrato solo → subes comprobantes de pago.

**Lo que enreda:**
- Atar proyecto a contacto falla si hay dos personas con el mismo nombre.
- La cotización pide 4 clics cuando casi siempre es 1 solo PDF.
- Si algo falla a medias (ej. se crea el pago pero no sube el comprobante), queda cojo y nadie avisa.
- Los archivos viven en 6 cajones distintos que hacen lo mismo.

**Cómo lo simplificamos:**
1. Un solo botón "Nuevo proyecto" que crea contacto + proyecto + cotización de una vez.
2. Dentro del proyecto, una lista de 5 pasos con ✅: Datos → Cotización → Contrato (automático) → Pagos → Entrega.
3. Si hay 1 cotización: botón único "Aprobar y generar contrato". Si hay varias: tabla que compara y valida que neto+IVA cuadre.
4. Todo lo que sea "crear + subir archivo" se hace junto o no se hace (sin mitades).
5. Una sola carpeta de documentos con etiquetas, no 6.

## ¿Qué tenemos bueno para partir?
- Las 9 pantallas abren y no se caen (probado automáticamente).
- Proyectos y Contactos sí guardan en la base real.
- El código ordena bien las carpetas, es fácil de arreglar por partes.

## Plan en simple
1. **Cerrar con llave** (1-2 días): seguridad y permisos.
2. **Ordenar la bodega** (2-3 días): base de datos única y consistente.
3. **Terminar las piezas** (1-2 semanas): conectar Reportes, Pronósticos y Ajustes.
4. **Pulir** (1 semana): mensajes, confirmaciones, diseño y manual.

## Glosario de 30 segundos
- **Supabase:** donde viven los datos.
- **RLS:** el candado de la bodega.
- **Mock:** maqueta que se ve real pero no guarda nada.
- **Playwright:** robot que abre la app y hace clic para probar.

---
*¿Dudas? Pregunta por la sección que uses (ej. "¿qué pasa con Reportes?") y lo explicamos con foto.*
