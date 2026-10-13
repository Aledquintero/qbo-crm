# Auditoría QBO CRM — 2026-10-04

**Alcance:** `qbo-crm/qbo-crm-main` completo (App Router Next.js 16 + React 19 + Supabase + Drizzle).
**Método:** lectura directa de código + `tsc --noEmit` + `npm run lint` + smoke Playwright 9/9 ok + 4 revisiones paralelas (frontend, backend/datos, seguridad/config, calidad).
**Veredicto:** UI completa y smoke sin `pageerrors`, pero **no apta para producción**: auth/RBAC solo-cliente con passwords en plano y RLS abierto a `anon`, doble fuente de verdad Drizzle vs SQL manual, 3 rutas API sin auth ni límites, y 6+ secciones mock con botones muertos.

## Conteos verificados

| Check | Resultado |
|---|---|
| `npx tsc --noEmit` | 0 errores (pero `next.config.mjs:3` tiene `ignoreBuildErrors:true` que los ocultaría en build) |
| `npm run lint` | roto: `eslint` no instalado, sin `eslint.config.*` en raíz |
| Smoke Playwright `smoke_test.py` | 9/9 secciones ok, 0 pageerrors, consola solo DevTools + Vercel Analytics |
| `console.*` en fuente | ~40–45 (2 `log` en extract routes, resto `error` sin logger/Sentry) |
| `any` explícito | 5 en 2 archivos (`ProjectDetail.tsx:219,221,228`, `extract-utils.ts:28`) |
| `TODO` | 5, `FIXME/HACK/@ts-ignore` 0 |
| Tests / CI | 0 tests, 0 `.github/`, `README.md:1` solo `# qbo-crm` |
| Locks | `package-lock.json` + `pnpm-lock.yaml` coexistentes |

---

## P0 — Crítico (arreglar antes de exponer)

### 1. Auth en plano + sesión falsificable — `lib/auth/store.ts:17-27,71-111`
**Mal:** seed `qbomodular/admin123` hardcodeado, `password:string` plano (`types.ts:10`), `login()` compara `u.password !== password`, sesión = `{username,nombre,rol}` en `localStorage` (`getSession/setSession:71-87`). Editar `localStorage` escala a Admin. `persist():53-66` hace `upsert` de passwords planos a Supabase.
**Solución:**
1. Crear `app_users.password_hash` (bcrypt), nunca `password`. `supabase/auth-setup.sql` ya lo marca como TODO.
2. Mover login a Route Handler con `bcrypt.compare` + cookie `HttpOnly/Secure/SameSite` (o Supabase Auth / `jose` JWT con expiración 12h).
3. Eliminar seed de código; crear admin inicial por script con password generado + cambio obligatorio.
4. Añadir rate-limit (ej. 5 intentos / 15 min por IP) + validación `zod`.

### 2. RLS abierto total — `supabase/auth-setup.sql:13-15,28-30`, `supabase/pipeline-setup.sql:10-14`
**Mal:** `FOR ALL TO anon USING(true) WITH CHECK(true)` en `app_users`, `role_permissions` y tablas de negocio. Cualquiera lee/escribe passwords y permisos, bypassea todo el CRUD directo desde cliente (`lib/supabase.ts:1-6` + `lib/api/*`).
**Solución:**
```sql
-- ejemplo mínimo: solo lectura propia / escritura vía service_role
alter table app_users enable row level security;
drop policy "anon all app_users" on app_users;
create policy "no anon" on app_users for all to anon using (false) with check (false);
-- crear policies por authenticated + service_role en server; cliente usa @supabase/ssr con sesión
```
Mover todo `insert/update/delete` a Route Handlers con `service_role` + check de sesión/rol. Cliente solo `select` con RLS restringido.

### 3. RBAC solo-cliente — `lib/auth/permissions.ts:54-125`, `app/page.tsx:65-101`, `features/UsersAdmin.tsx:38-52`
**Mal:** `DEFAULT_VIEW/ACTIONS=allTrue`, `canView ?? true` fail-open, vistas/acciones en `localStorage`, gate `if(!session) return <AuthScreen/>` y `isAdmin=getSession()?.rol==="Admin"`. `resetPassword` vía `prompt()` plano. Todo bypasseable en DevTools.
**Solución:** validar rol en servidor (middleware + cada API + cada query). `loadView/loadActions` solo como caché UI, nunca como autorización. `UsersAdmin` exige `session Admin` verificada en servidor.

### 4. API sin auth + `service_role` expuesta — `app/api/quotes/route.ts:5-8,10-28`
**Mal:** `createClient(URL, SERVICE_ROLE!)` a nivel módulo, sin check de sesión. Cualquiera con `project_id` sube a `project-files` y escribe en `quotes`. Además `JSON.parse(extractedJson):21` sin schema, `storagePath=${projectId}/quotes/${id}_${file.name}:23` sin sanitizar, sin límite tipo/tamaño.
**Solución:** exigir sesión + `canDo('quotes','create')`, validar con `zod` (file 10 MB max, PDF only, `project_id` existe), sanitizar `file.name` (`slug + ext whitelist`), validar `numero/fecha/neto/iva/total` antes de insert. Idem para `quotes/extract` y `payments/extract`.

### 5. Deriva esquema Drizzle vs DB real — `db/migrations/0000_*.sql`, `db/schema/*`, `supabase/*.sql`
**Mal:** migración crea `quotations(uuid)` huérfana; `quotes(text id, numero/neto/iva/total)` no tiene migración. Faltan migraciones para `quotes, customers, team, contracts, designs, payment_receipts, project_files, project_photos, stages`. Migración usa `uuid DEFAULT gen_random_uuid()` pero Drizzle usa `text PK (CON/PRY/QUO)`. `kind/stage_updated_at/estado` solo existen en `supabase/pipeline-setup.sql`, `INV→invoices` (`lib/api/id.ts:9`) no existe. `db/*` nunca importado (solo `supabase-js`), requiere `DATABASE_URL` inexistente.
**Solución:**
1. Decidir fuente única: Drizzle **o** SQL manual, no ambas.
2. Regenerar baseline: `drizzle-kit generate` desde `db/schema` real + `drizzle-kit migrate` en staging, o volcar DB real con `pg_dump --schema-only` y reconciliar.
3. Eliminar `quotations` de migraciones o crear tabla; alinear `uuid vs text`; añadir `kind/stage_updated_at/estado`; corregir `INV` y prefijos `CON` reusados en `customers/team` (`lib/api/customers.ts:80`, `lib/api/team.ts:75` usan tabla equivocada para el conteo).

---

## P1 — Alto

### 6. OCR/PDF frágil e inseguro
- `app/api/quotes/extract-utils.ts:15`: `execSync(pdftotext ...)` bloquea event loop + interpolación shell + binario ausente en Vercel. Fallback `buffer.toString("utf-8")` devuelve basura. Sin magic/size/timeout.
- `app/api/quotes/extract/route.ts:55-76`: `iva=total-neto` inventado, heurística `total`=mayor número `>1000`, `parseNumber` asume formato chileno, `folio` regex `(\d{4,})`, retorna `text.slice(0,2000)` (exfiltra PII). Sin auth/límite.
- `app/api/payments/extract/route.ts:36-58`: `Tesseract.recognize(buf,"spa")` sobre Buffer crudo (PDF≠imagen), sin timeout/tamaño, regex monto/autor ruidosos. Timeout serverless casi seguro.
**Solución:** cola/job con timeout (ej. 30 s), `pdfjs` solo + validación magic bytes + límite 10 MB/5 págs, `pdftotext` solo si está instalado vía `spawn` sin shell, OCR solo sobre imágenes (convertir PDF→PNG), devolver campos + score de confianza, nunca texto crudo. Mover a worker/Edge con límite de CPU.

### 7. Secciones 100% mock con botones muertos
- `Forecasting.tsx:40-88,399-406` + `data/forecasting.ts`: todo hardcodeado, `Refresh`/`View mitigation` sin `onClick`, `timeframe` no filtra, `setTimeout 800ms` fake, `$395K/+17%` literales.
- `Reports.tsx:32-64,218-253` + `data/reports.ts` (fechas `Jan 2024`): `View/Generate/Download` sin `onClick`, `Generating...` eterno, card `div cursor-pointer` no keyboard.
- `Settings.tsx:42-45,99-154`: `handleSave` fake `setTimeout 1500ms`, `Switch/Select` no controlados, `Update Password` muerto.
- `Customers/Team` parciales, `ContactSelector.tsx:5,16-18` usa mock `data/contacts` en memoria sin persistir.
**Solución:** conectar a Supabase o marcar explícito `DEMO` + `disabled + tooltip "Próximamente"`. Cada botón muerto: o se implementa o se deshabilita con `aria-disabled`. `Forecasting/Reports` con `fetch/loading/error/retry` reales; `Settings` persiste en `app_users`/preferencias.

### 8. Validación `zod` instalada pero sin usar (`package.json:68`)
**Mal:** 0 imports de `zod` en `lib/`/`app/api/`. `Partial<{...}>` directo a `.insert/.update` (`projects.ts:135-146`, `contacts.ts:75-84`, etc.).
**Solución:** schemas `zod` por entidad + en cada Route Handler y `lib/api` (whitelist de campos). Rechazar 400 con detalle.

### 9. Storage inseguro/frágil — `lib/api/storage.ts:5,44-77`, `app/api/quotes/route.ts:26-28`
**Mal:** bucket `project-files` sin migración de creación/policies; `upsert:true` permite overwrite; `file.name` sin sanitizar (`../`, unicode); `remove()` borra Storage antes que DB (si falla, pérdida); `getUrl` retorna `""` silencioso; path predecible; sin `contentType`/tamaño controlados.
**Solución:** crear bucket + policies por migración, `upsert:false`, sanitizar nombres (`nanoid + ext`), orden DB-primero o transacción (insert DB → upload → rollback), validar MIME/tamaño, `getUrl` con throw + fallback UI.

### 10. IDs con carrera — `lib/api/id.ts:16-35`
**Mal:** `count+like` + loop `select id` por candidato = 2+N roundtrips, duplicados en concurrencia.
**Solución:** secuencia Postgres (`nextval`) o `gen_random_uuid` / `nanoid` con `unique` + reintento, o `insert().select().single()`.

### 11. Sin paginación — `lib/api/*.ts`, `lib/api/overview.ts:276`
**Mal:** `select("*")` + `order` sin `.range/.limit`; `overview` agrega en JS. Full scan a memoria.
**Solución:** `.range(page*size,(page+1)*size-1)` + `count:exact`, agregaciones en SQL (`sum/count/group by`).

### 12. Next 16 + React 19 + config débil — `package.json:52,57-59`, `next.config.mjs:2-9`
**Mal:** `next 16.0.10` exige parche React 19; `radix 1.x/day-picker 9/recharts 2/vaul/cmdk` sin soporte oficial → hydration/ref breaks. `ignoreBuildErrors:true` oculta errores, sin `headers()` (CSP/HSTS/X-Frame), sin `poweredByHeader:false`.
**Solución:** fijar combo probado (o bajar a Next 15 estable), añadir `headers()` con CSP/HSTS, `poweredByHeader:false`, quitar `ignoreBuildErrors` (hoy `tsc` está en 0, quitarlo es seguro).

---

## P2 — Medio

### 13. Errores solo a consola, sin toast/retry/confirm
`Projects.tsx:125-188,481`, `Contacts.tsx:100-187`, `Customers.tsx:77-108`, `Team.tsx:163-198`, `Pipeline.tsx:189-247`, `ProjectDetail.tsx:131-520`, `Overview.tsx:52` (sin retry). Deletes sin confirm.
**Solución:** wrapper `try/catch → toast.error + log` (Sentry), `ConfirmDialog` en deletes, botón `Reintentar` en cada error (Pipeline ya lo tiene, replicar).

### 14. A11y teclado/SR
Filas `tr onClick` sin `role/tabIndex` (`Projects:336`, `Contacts:284`), menús `opacity-0 group-hover` invisibles a teclado/táctil (`ContactDetail:269-287`, `Team:64-69`, `ProjectDetail:592-613`), modales sin `role=dialog/aria-modal/Escape/focus-trap` (`Pipeline:633-652`), `div draggable+onClick` sin rol (`Pipeline:422-440`), inputs sin `label`, `aria-label` con hex (`Pipeline:528-537`), `mailto:undefined` (`Team:105-116`), uploads por `getElementById` en vez de `ref` (`ProjectDetail:395-481`).
**Solución:** botones reales + `aria-label/aria-pressed/aria-current`, `role=dialog` + trap + Escape, `ref` para inputs file, no ocultar acciones solo en hover.

### 15. Inconsistencias y fragilidad UI
`app/page.tsx:43-47` query `?section=` sin validar; `page.tsx:100` `return null` sin skeleton; `layout.tsx:40` `lang="en"` (app en español); fuentes `dmSans/jetbrainsMono` cargadas pero no aplicadas (`globals.css` usa `Geist`); `generator:'v0.app'` leftover; `ThemeProvider` duplicado; `formatCurrency` en `$k/$M` inglés; `use-toast.ts:9,90-101,182` auto-cierre ~16 min + reducer impuro + resuscripción; `use-mobile.ts` muerto; `cn` ok.
**Solución:** validar sección (fallback `overview`), `loading.tsx` + `error.tsx` + `Suspense`, `lang="es"`, limpiar fuentes/generator, unificar `ThemeProvider`, `Intl.NumberFormat('es-CL')`, reescribir `use-toast` (delay 5 s, reducer puro).

### 16. Contratos multi-creación — `lib/api/contracts.ts:18-27`
`create + fetchAll + Promise.all(remove viejos .catch(()=>{}))` traga errores y puede dejar multi-contrato.
**Solución:** constraint único parcial por proyecto + `upsert` transaccional, sin `catch(()=>{})`.

### 17. Env/higiene
`.env.local` con `NEXT_PUBLIC_*` (expuestas en bundle por diseño) + sin `.env.example` + `.gitignore:19-20` mínimo + `opencode.json:3-7` expone `project_ref`. Repo aún no es git.
**Solución:** crear `.env.example` (solo nombres), ampliar `.gitignore` (`.DS_Store,*.log,coverage/,.env*.local`), mover `project_ref` a env, `git init` + primer commit sin `.env.local`/`.next`.

### 18. `onSave` inconsistente — `Pipeline:316-324` (7 campos) vs `ProjectDetail:149-153` (3 campos)
Riesgo de pérdida por overwrite parcial.
**Solución:** patch con whitelist explícita + `updated_at`, nunca `update(objetoCompleto)`.

---

## P3 — Bajo

- `icon: React.ElementType` sin tipar (`Reports:38-50`, `Sidebar:29`) → usar `LucideIcon`; nav sin `aria-current`; label colapsado legible por SR.
- `tierColors: Record<string,string>` + fallback `?? Starter` oculta tiers inválidos (`Customers:39`).
- `draft {...contact}` sin sync si cambia prop (`ContactDetail:29`); `useEffect [..., initialContactId]` recarga todo (`Contacts:127`); `Team:30-38` `React.MouseEvent` sin import.
- `ProjectNotesBoard.tsx:8` exporta 2 boards (naming confuso); `StageEditorPanel.tsx` muerto (0 imports) + `onChange` por tecla sin debounce; `ContactSelector` dropdown sin `aria-expanded/role/listbox/Escape`.
- Doble modelo `data/deals.ts Project` vs Supabase + `OverviewActivity/PendingActivity/Performer` divergentes; persistencia dispersa en `localStorage` (`lib/fabricante.ts`, `lib/pipeline-stages.ts`, `permissions.ts`) sin wrapper testeable.
- `tsconfig:9 target ES6` obsoleto, `allowJs+skipLibCheck` neutralizan `strict`; sin `noUncheckedIndexedAccess`; `postcss/components.json/paths` ok.

---

## Flujo de trabajo end-to-end — auditoría + simplificación

**Flujo real hoy (verificado en código):**
`Contactos` (`Contacts.tsx` + `AddContactPanel`) → `Proyectos` (`Projects.tsx:456-483` crea con `contact_id` buscado por `eq("name")` exacto) → `Pipeline.tsx` (solo visual + drag cambia `stage`, `load()` con `Promise.allSettled(fetchProjects, fetchStages)`) → `ProjectDetail.tsx:131-141` (6 fetches paralelos: `payments/quotes/files/photos/contracts/designs`, `catch(()=>{})` silencioso) → `Cotización` (`handleAddFile("cotizacion"):177-196` → `POST /api/quotes/extract` → `QuoteApprovalModal` → `POST /api/quotes` → `handleApproveBudgets():287-327` genera `generateContractPdf()` + `createContract()` + `approveQuotes()` + resto a `pendiente`) → `Pagos` (`file-recibo:491-510` → `POST /api/payments/extract` OCR → `ReceiptApprovalModal` → `createPayment()` + `createPaymentReceipt()`) → `Customers/Team` CRUD aislado sin FK a `projects/contacts`.

**Fricciones (qué está mal):**
1. **Crear proyecto frágil** — `Projects.tsx:467-471` busca contacto por `name` exacto; homónimos/apellidos rompen el vínculo, `contact_id=""` huérfano. `AddProjectPanel` pide nombre + apellido separados y luego los vuelve a partir (`split(" ")`).
2. **Doble edición de proyecto** — `Pipeline:316-324` guarda 7 campos vs `ProjectDetail:149-153` guarda 3 (`company/direccion/stage`); overwrite parcial pierde `email/value/status/close_date/rep`.
3. **Cotización en 4 clics** — subir → modal revisión → guardar → seleccionar → aprobar/generar contrato. Si hay 1 sola cotización, el select sobra; si hay N, no hay diff de montos ni validación `neto+iva=total`.
4. **Contrato acoplado a aprobación** — `handleApproveBudgets` crea contrato + cambia estados en 3 writes sin transacción; si falla el 2º, queda contrato sin `aprobado`. `createContract` permite multi-contrato (`contracts.ts:18-27` con `catch(()=>{})`).
5. **Pagos en 2 writes** — `handleApproveReceipt():260-281` crea `payment` y luego `receipt`; si falla el 2º queda pago sin comprobante (solo `console.error`).
6. **6 tablas de archivos para lo mismo** — `project_files/project_photos/contracts/designs/quotes/payment_receipts` (+ `files` muerta) con la misma factory `createProjectStorage()` (`storage.ts:26-80`); `remove():68-72` borra Storage antes que DB (pérdida si falla DB); `upsert:true` sobrescribe; path predecible `${ownerId}/${folder}/${id}_${file.name}` sin sanitizar.
7. **IDs con N+1 y colisión** — `id.ts:9-35` `CON` reusado para `contacts/customers/team` (cuenta en tabla equivocada), `INV→invoices` inexistente, `count+like` + loop `select id` = carrera en concurrencia.
8. **Pipeline/Proyectos duplican fetch** — dos `fetchProjects()` sin caché/SWR, `overview.ts:273-288` agrega en JS sin transacción.

**Simplificación propuesta (menos pasos, misma info):**
1. **Un asistente único "Nuevo proyecto"**: contacto (select con búsqueda, crea si no existe, devuelve `id` real, no por nombre) + empresa/dirección + cotización PDF opcional. 1 modal, 1 `contact_id` real, 0 huérfanos.
2. **ProjectDetail en 5 pasos visibles con checklist**: `1 Datos → 2 Cotización → 3 Contrato (auto) → 4 Pagos → 5 Entrega (fotos/diseño)`. Si `quotesList.length===1`, botón único `Aprobar y generar contrato`; si N, tabla con diff + `neto+iva=total` validado antes de aprobar.
3. **Contrato transaccional**: constraint único parcial `UNIQUE(project_id) WHERE vigente` + `upsert`; aprobar = 1 función server que hace `insert contrato + update quotes` o rollback.
4. **Pagos atómicos**: 1 `createPaymentWithReceipt()` (si falla receipt, rollback payment); OCR solo como sugerencia editable, nunca bloqueante.
5. **Una tabla `project_documents(kind)`** en vez de 6: `kind=ficha|foto|diseno|cotizacion|contrato|recibo`, `upsert:false`, nombre sanitizado `nanoid+ext`, borrar DB-primero, `getUrl` con throw (no `""` silencioso).
6. **IDs sin carrera**: `nanoid`/uuid o secuencia Postgres + `unique`, prefijos únicos por tabla (`CUS/TEA`, no `CON` reutilizado; eliminar `INV` o crear `invoices`).
7. **Pipeline solo visual**: quita edición desde tarjeta; todo editar vive en `ProjectDetail`; un `fetchProjects()` con caché + `stage_updated_at` para `STALE_DAYS`.

## Plan de remediación (4 fases)

**Fase 0 — Cerrar P0 (1–2 días):** RLS `deny anon` + auth server + `password_hash` + `requireAdmin` en `UsersAdmin` y `POST /api/quotes`; quitar seed hardcodeado; regenerar `anon/service_role` keys si se expusieron.
**Fase 1 — Datos (2–3 días):** fuente única Drizzle o SQL, baseline migrado, alinear `uuid/text`, crear tablas faltantes, constraint contrato único, IDs sin carrera, paginación `.range()`.
**Fase 2 — Funcionalidad (1–2 sem):** `Forecasting/Reports/Settings` reales o `disabled+DEMO`, `Projects` paginación/sort, `Contacts` ya real como referencia, `zod` en API+lib, storage seguro, toasts/confirms/retry, `ContactSelector` a Supabase.
**Fase 3 — Hardening (1 sem):** `headers()` CSP/HSTS, quitar `ignoreBuildErrors`, `eslint + jsx-a11y + react-hooks` + `lint-staged`, `vitest` unit + `playwright` e2e, CI `lint/build/test`, `README` + `.env.example`, `npm audit/dependabot`, fijar un lock (`npm`), `lang=es`, `loading/error`, Sentry.

## Comandos útiles

```bash
npm.cmd run lint     # hoy roto: falta eslint
npx.cmd tsc --noEmit # hoy 0 errores
python "C:\Users\burus\AppData\Local\Temp\skills-use-A06LjO\webapp-testing\scripts\with_server.py" --server "npm.cmd run dev" --port 3000 -- python smoke_test.py
```

---
*Generado por auditoría estática + smoke Playwright. No se imprimen secretos (solo nombres de vars). Revisar `REPORTE.md` está obsoleto (habla de `components/dashboard/` y `quotations.ts` ya eliminados, y de Supabase caído ya resuelto).*
