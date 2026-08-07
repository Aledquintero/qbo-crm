# Reporte de Estado del Proyecto QBO CRM

**Repositorio:** `Aledquintero/qbo-crm`
**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Recharts · Supabase (DB + Storage) · Drizzle ORM · Tesseract.js (OCR) · pdfjs
**Estado de ejecución:** Server local OK en http://localhost:3000 (HTTP 200)

---

## 1. Resumen general

El proyecto es un **panel CRM tipo SPA de una sola página**, con navegación lateral (Sidebar) que alterna entre **9 secciones**. Se renderiza todo en `app/page.tsx` mediante una única ruta `/` (sin rutas reales, usa `?section=` en querystring).

Existen **dos grupos de componentes de sección**:
- **`features/*`** → los que la app realmente usa (importados en `page.tsx`).
- **`components/dashboard/sections/*`** → copias duplicadas **obsoletas** (código muerto, no se importan). Deberían eliminarse.

---

## 2. Prueba del estado real de cada sección

| # | Sección | Estado | Botones/acciones | Funcional de verdad |
|---|---------|--------|------------------|---------------------|
| 1 | **Overview** (inicio) | **MOCK** | Ninguno. Solo 4 tarjetas + 3 gráficos | ❌ todos los números hardcodeados ($2.4M, 24.8%, 147, 892) |
| 2 | **Pipeline** | **MOCK** | ⋯ en tarjetas, "Add deal" (+) | ❌ **ningún botón tiene onClick**; el kanban no tiene drag-and-drop real (solo CSS) |
| 3 | **Proyectos / Deals** | **REAL** | Buscar, filtros estado, "+" Agregar, ⋯ (Editar/Eliminar), fila→detalle, paginación | ✅ CRUD Supabase verificado E2E · "More filters"/"Previous/Next" sin handler |
| 4 | **Contactos** | **REAL** | Buscar, filtros, "+" Agregar, ⋯ (Editar/Eliminar), fila→detalle, paginación real | ✅ CRUD Supabase verificado E2E · "More filters" sin handler |
| 5 | **ContactDetail** | **PARCIAL** | Editar, "Nota"/"Llamar", actividades, panel de proyectos | Parcial: editar y proyectos son reales; activities=timeline hardcodeado, quickActions "Nota/Llamar" **sin handler**, "Ver todos" sin handler |
| 6 | **Customers** | **MOCK** | filtrar tier, búsqueda, Add Customer, "Schedule"/"Email"/link | ❌ solo filtro local funciona; **"Add/Schedule/Email sellos" sin handler** |
| 7 | **Team** | **MOCK** | "⋯", Mail/Phone | ❌ **nada funcional** (datos de `data/team.ts`) |
| 8 | **Forecasting** | **MOCK** | Select timeframe, Refresh, "View mitigation" | ❌ Select no cambia gráfico; "Refresh"/"ver plan" sin handler |
| 9 | **Reports** | **MOCK** | View Report, "Generate New", Download | ❌ **todo sin handler**; reporte "Team Productivity" con estado "Generating..." fake |
| 10 | **Settings** | **MOCK** | Save Changes, "Change Avatar", inputs, switches, integraciones, security | ❌ **todof simulado con setTimeout**, NO persiste nada |

> `*` Antes de volver: ver sección "PERMISOS".

---

## 3. ✅ FASE 0 COMPLETADA — Backend operativo

**Verificación (7/ago/2026):** el dominio del proyecto Supabase estaba dando **NXDOMAIN de forma temporal** (fallo de DNS). Al reverificar:

```
Dominio: https://rwbsjjdtufmijvxztfgq.supabase.co  → resuelve (172.64.149.246)
REST /rest/v1 → 200 (con apikey)
auth /health  → 200
```

**Datos reales en DB:** 6 contactos, 6 proyectos, 2 cotizaciones (`quotes`), bucket de storage `project-files` existente y con subida anónima funcional (200).

**Prueba E2E del CRUD real** (igual que hace la app, con id tipo `CON2607..`):
| Operación | Resultado |
|-----------|-----------|
| INSERT contacto (id text) | ✅ 201 |
| SELECT (filtro) | ✅ dato leído |
| UPDATE | ✅ 204 |
| DELETE | ✅ 204 |
| Subida a storage `project-files` | ✅ 200 |

**Coincidencias validadas:** el esquema real usa `id` de tipo `text` (coincide con `generateId()` de la app) y no requiere default; las tablas `contacts`, `projects`, `payments`, `files`, `quotes`, `contracts`, `designs`, `project_files`, `project_photos`, `payment_receipts` existen y responden.

**Única discrepancia detectada:**
- La tabla **`quotations` no existe** en la DB (devuelve 404). Es **código huérfano**: `lib/api/quotations.ts` no es importado por ninguna feature. El esquema Drizzle la declara pero la app real usa `quotes`. **Acción:** eliminar el archivo huérfano o crear la tabla por coherencia (recomendado: eliminar el huérfano).

---

## 4. APIs disponibles y su estado

| Endpoint | Método | Qué hace | Estado |
|----------|--------|----------|--------|
| `/api/quotes/extract` | POST | Extrae numero/fecha/neto/iva/total de PDF (pdftotext→pdfjs→buffer) | ✔ Su presentación, no persiste |
| `/api/payments/extract` | POST | OCR (Tesseract spa) de comprobante pago | ✔ No persiste |
| `/api/quotes` | POST | Sube PDF + inserta en tabla `quotes` (upsert + rollback) | ✔ Su llegada a Supabase (by backend caído)**

**Rutas sin API:** pagos (comprobantes, `payment_receipts`), subida de archivos (ficha/fotos/contrato/diseño) y todo lo que detecta `lib/api/*` se hace **directa** el cliente Supabase (signed URLs). No hay endpoints REST dedicados para payments/files de forma centralizada.

---

## 5. Tabla de datos (esquema DB)

12 tablas con Drizzle: `contacts`, `projects`, `payments`, `files`, `quotes`, `quotations`, `project_files`, `project_photos`, `contracts`, `designs`, `payment_receipts`, `comments`.

---

## 6. Funcionalidades que FALTAN (gap by sección)

**Crítico / **:
1. ~~Backend Supabase inaccesible~~ → **RESUELTO** (era DNS temporal). Backend + bucket + CRUD verificados. Pendiente: eliminar `lib/api/quotations.ts` huérfano (tabla no existe).
2. **Autenticación / login**: no hay login, usuario, sesiones ni control de acceso. Cualquier CRM necesita saber quién cambió cada cosa (auditoría).

**Alta **:
3. **CRUD de Customers** (`Customers` es solo maquetado estático).
4. **CRUD de Team (membresía)** (`Team` estático).
5. **Pipeline (kanban)**: drag-and-drop para mover stages y persist. Botones "+" y "⋯" funcionando.
6. **Overview ligado a datos reales**: métricas/gráficos deben venir de la DB y reaccionar al CRUD.

**Media**:
7. **Settings persistente**: que Save Changes guarde en DB (perfil, notificaciones, preferencias).
8. **Reports reales**: generar/descargar/ver (hoy todo es estático con "Generating..." fake).
9. **Forecasting real**: los Select (monthly/quarterly/annual) deben cambiar los datos y persistir; "Refresh" actualiza de DB.
10. **Notifications**: campana Bell (y sus SS) hasta vacía; panel de notificaciones.
11. **Activity timeline persistente** en ContactDetail/ProjectDetail (hoy hardcodeado): registrar notas/interacciones, "Ver detalles".
12. **Search global** del Header funcional (hoy no busca).
13. "More filters", "Previous/Next" de paginación de Deals/Projects con lógica real.
14. Eliminar el código muerto `components/dashboard/` (duplicado obsoleto).

**Baja / Mejoras UX**:
15. Rutas reales (`/pipeline`, `/contacts`, `/customers`, ...) en vez de SPA con querystring (mejor SEO + enlaces compartibles).
16. Importar/exportar datos; soft-delete; auditoría de cambios; permisos por rol (dueño/editor/vista).
17. Confirmaciones de borrado (hoy el menú ⋯ borra directo con "useEffect"?) junto con mensajes de "toast" (sonner está instalado).
18. Presupuestar que el texto del Header "QBO modular".

---

## 7. Plan de trabajo priorizado (recomendado)

### Fase 0 — Cimiento (bloquea todo) · ✅ COMPLETADA
- [x] Verificar/restablecer acceso a Supabase (REST + Storage bucket `project-files`) → **operativo**.
- [x] Prueba E2E del CRUD y subida de archivos → **funcional**.
- [x] Eliminar módulo huérfano `lib/api/quotations.ts` (tabla inexistente).

### Fase 1 — Base real del CRM — ✅ COMPLETADA (auth suspendida por ahora)
- [x] Conectar **Overview** a datos reales (métricas + gráficos desde Supabase).
- [x] **Pipeline**: drag-and-drop real que persiste cambios de stage.
- [x] **CRUD de Customers** (create/read/update/delete) — tabla `customers` creada en Supabase.
- [x] **CRUD de Team** (create/read/update/delete) — tabla `team` creada en Supabase.
- [ ] ~~Implementar login/registro~~ → **SUSPENDIDA**: un solo usuario por ahora; se añadirá al final cuando la app esté lista.

### Fase 2 — Cierre de funcionalidad — Media
- [ ] **Settings persistente** (Save real).
- [ ] **Reports**: generar y descargar desde datos reales.
- [ ] **Forecasting** real (datos por timeframe + refresh).
- [ ] **Actividades/Notas** persistentes por contacto y proyecto.
- [ ] **Notificaciones** (Bell) + **Search global**.

### Fase 3 — Hardening y UX — Mejora
- [ ] Enrutado real por sección (Next App Router), reemplazando SPA por querystring.
- [ ] Confirmación de borrados; toasts (sonner ya instalado); estados de carga/error.
- [ ] Tests (unit/component con Vitest; e2e con Playwright) para cada sección/botón.
- [ ] Eliminar `components/dashboard/` (código muerto) y consolidar tipy.
- [ ] CI en GitHub Actions (lint + build + tests) on push/PR.

---

### Resumen ejecutivo
- **App UI: completo y bien estructurado, 9 secciones.**
- **Funcionalidad real:** solo el CRUD de Contactos y Proyectos + detalle de proyecto usan la BD, pero **el backend Supabase está caído (NXDOMAIN)**, lo que de facto deja toda la persistencia en riesgo.
- **El resto (Overview, Pipeline, Customers, Team, Forecasting, Reports, Settings, búsqueda, notificaciones) es mock/placeholder.**
- **Falta lo esencial de un CRM de verdad:** autenticación, datos reales en dashboards, acciones de borrado/creación completas en todas las entidades, y persistencia en Settings/Reports/actividades.

**Prioridad nº 1: arreglar/acceder a Supabase.** Sin él, todo el CRUD "real" falla al crear o guardar.