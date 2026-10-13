# Plan Mobile - Calidad iPhone / Android - QBO CRM

> Decisiones cerradas en cuestionario Q1-Q22. Fase 1: `Pipeline`, `Projects (deals)`, `Contacts`. Stack: Next 16 + React 19 + Tailwind v4 + shadcn new-york.

## 1. Visión y alcance

**Objetivo:** fricción mínima en celular sin perder funcionalidad desktop. Se permite rediseñar desktop para unificar. Target: Android + iOS (no solo iOS), web responsive premium + PWA base instalable.

**Fase 1 (calidad iPhone):**
- `features/Pipeline.tsx` - kanban → lista/cards swipeables
- `features/Projects.tsx` + `features/ProjectDetail.tsx` - tabla → cards + detalle fullscreen
- `features/Contacts.tsx` + `features/ContactDetail.tsx` - ídem + acciones Llamar/WhatsApp
- Shell global: `app/layout.tsx`, `app/page.tsx`, `components/Sidebar.tsx`, `components/Header.tsx`

**Fuera de Fase 1:**
- `Overview`, `Forecasting`, `Reports` - aún no desarrolladas, se resuelven luego. En mobile solo placeholder resumido.
- Push - fuera v1.
- Biometría - explícitamente no.
- Budget perf estricto - no. Rollout directo a prod (asumir riesgo, ver §9).

**Roles:** mixto (ventas campo una mano + admin). Mismos permisos `lib/auth/permissions.ts`, Sidebar filtra por `visibleSections`.

## 2. Principales desafíos

1. **SPA de 1 ruta:** `app/page.tsx:24-33,49-52` todo es `?section=` + `renderSection()`. No hay rutas reales, rompe deep-link, back-button, swipe-back iOS/Android.
2. **Sidebar desktop-only:** `components/Sidebar.tsx` es `fixed left-0 w-[260px]/[72px]`, sin drawer ni bottom-nav. En 360px tapa todo.
3. **Layout con margen fijo:** `app/page.tsx:137-183` usa `ml-[72px]/ml-[260px] + p-6`. En mobile debe ser `ml-0 + p-4 + pb-24` para tabbar.
4. **Tablas densas:** `components/ui/table.tsx` + listas en Projects/Contacts/Pipeline no son tocables con pulgar, requieren pinch-zoom.
5. **Modales centrados:** `components/ui/dialog.tsx` Radix centrado, no sirve en mobile. Ya existe `vaul@1.1.2` sin usar - oportunidad.
6. **Forms largos + OCR:** `features/Constructor.tsx` + `app/api/quotes/extract/route.ts` + `app/api/payments/extract/route.ts` + `react-hook-form+zod`. Subir PDF en mobile es fricción máxima.
7. **Header no mobile:** `components/Header.tsx` `h-16 sticky` con dropdown perfil + `PageEditor` admin, sin search ni acciones rápidas.
8. **Tema dark fijo:** `app/layout.tsx` `defaultTheme="dark" enableSystem=false`. Android/iOS esperan system.
9. **Búsqueda desktop:** `cmdk@1.0.4` es command-palette teclado, no search mobile. Decisión Q16: mantener simple (filtro por lista), no fullscreen+voz.
10. **Charts pesados:** `recharts@2.15.4` en Overview/Forecasting mata scroll/batería. Pospuesto por Q20, pero aislar desde ahora con lazy.
11. **Sin PWA:** sin `manifest`, `theme-color`, `viewport-fit=cover`, iconos, ni offline. Q10 pide PWA + offline lectura.
12. **Rollout directo:** Q22 directo a prod sin beta ni flags = riesgo de regresión desktop. Mitigar con QA manual mínimo.

## 3. Qué cambiar

### 3.1 Shell / Navegación (Q6, Q4)
- Crear `components/MobileNav.tsx`: bottom tabbar 4 + Más.
  - Tabs: Inicio (`overview`), Pipeline (`pipeline`), Proyectos (`deals`), Contactos (`contacts`) + sheet `Más` con `customers,team,settings`.
  - 56-64px alto + `pb-[env(safe-area-inset-bottom)]`, iconos Lucide 24px, label 11px, estado activo pill.
  - Ocultar en desktop `md:hidden`. Sidebar actual `hidden md:flex`.
- `app/page.tsx`: `ml-0 md:ml-[72px]/[260px]`, `main p-4 md:p-6 pb-28 md:pb-6`.
- `components/Header.tsx`: en mobile compacto: título + search-icon + avatar. Sacar `Personalizar` a `Más > Personalizar`.
- Migración futura: mover `?section=` a rutas reales `/pipeline`, `/proyectos/[id]`, `/contactos/[id]` para que back/swipe-back funcione. Fase 1 puede mantener `section` pero envolver con historial.

### 3.2 PWA base (Q2, Q10)
- `app/layout.tsx`:
  ```tsx
  export const viewport = { width:'device-width', initialScale:1, viewportFit:'cover', themeColor:[{media:'(prefers-color-scheme: light)', color:'#ffffff'},{media:'(prefers-color-scheme: dark)', color:'#09090b'}] }
  ```
- `app/manifest.ts`: nombre QBO, `display:'standalone'`, iconos 192/512 maskable en `public/icons/`, `start_url:'/?source=pwa'`.
- `public/apple-touch-icon.png` + `apple-mobile-web-app-capable`.
- Offline lectura Fase 1.5: cache `GET /api/quotes` + lista contactos/proyectos en `localStorage`/IDB, badge `Sin conexión - solo lectura`, cola `crear nota/visita` con `navigator.onLine` + retry. Sin service-worker custom complejo, usar `next-pwa` o `serwist` mínimo.

### 3.3 Listas: tablas → cards (Q7)
- Nuevo `components/MobileCard.tsx` + `components/SwipeRow.tsx` (CSS touch, sin lib pesada):
  - Desktop `md:`: tabla actual.
  - Mobile: card 16px radius, título 16px semibold, subtítulo 13px muted, footer con CTA 44px.
- Acciones swipe (Q18): swipe-left revela Llamar / WhatsApp / Editar en Contacts, Mover etapa / Ver en Pipeline/Projects. Más botón `...` fallback (no todos descubren swipe).
- `pull-to-refresh`: implementar simple en Pipeline/Projects/Contacts (touch handler 60px threshold + spinner). 
- Búsqueda simple (Q16): `sticky top-16` input por lista, `inputMode="search"`, debounce 200ms, sin `cmdk` fullscreen, sin voz.

### 3.4 Filtros (Q17)
- Filtros actuales inline → `components/FilterSheet.tsx` con `vaul`:
  - Trigger `Filtros (n)` sticky, chips seleccionables 44px, footer `Limpiar | Aplicar` sticky.
  - Guardar 1 vista por defecto en `localStorage` ej. `qbo:filters:pipeline`.

### 3.5 Detalle fullscreen (Q9, Q18)
- `ProjectDetail.tsx`, `ContactDetail.tsx`: en mobile abrir como sheet fullscreen `vaul`:
  - Header con drag-handle + swipe-down cerrar + botón X 44px.
  - Contenido scroll, CTA sticky abajo `Llamar / Cotizar / Avanzar etapa` 48-56px.
  - Swipe-back: botón `< Volver` grande, no depender solo de gesto browser hasta migrar a rutas reales.

### 3.6 Formularios wizard + cámara (Q8, Q12)
- `Constructor.tsx` + creación proyecto/contacto/cotización:
  - Desktop: form largo actual.
  - Mobile: wizard 3-5 pasos con progress bar: 1 Datos → 2 Detalle → 3 Archivos/Foto → 4 Revisar.
  - Inputs: `font-size:16px` mínimo (evita auto-zoom iOS), `inputMode`/`autoComplete` correctos (`tel`, `email`, `decimal`), validación inline `zod` + error bajo campo, botón `Siguiente` sticky 52px, guardar borrador en `localStorage`.
  - Cámara: `<input type="file" accept="image/*" capture="environment">` para escanear ticket/factura → reutilizar `POST /api/quotes/extract` y `/api/payments/extract` (tesseract + pdfjs). Preview + `Reintentar`.
  - Firma: canvas fullscreen dedo en `contrato-gen.pdf` vía `pdf-lib@1.17.1`, trazo 3px, `Limpiar/Guardar`, exportar PNG incrustado.

### 3.7 Tema y densidad (Q15)
- `app/layout.tsx`: `ThemeProvider attribute="class" defaultTheme="system" enableSystem=true`.
- `app/globals.css`: tokens ya `oklch`, ajustar radios a 16-20px, spacing aireado, focus-ring visible 2px.
- Touch targets: mínimo 44x44px en botones/chips/tabs. `DM_Sans` con `text-[16px]` base mobile, `JetBrains_Mono` solo números.

### 3.8 Sesión (Q13)
- Persistente con `@supabase/ssr@0.12.0`, `onLogout` en `lib/auth/store.ts` se mantiene. No biometría.
- Avatar + `Cerrar sesión` accesible en `Más`, más indicador `Viendo como {previewRole}` ya existente.

### 3.9 Gestos + haptics (Q18, Q19, Q14)
- Gestos v1: swipe-back (vía header back), swipe-actions, pull-refresh. No long-press.
- Haptics: `navigator.vibrate?.(10)` en éxito/swipe-apply, springs 200-250ms con `tw-animate-css`, respetar `prefers-reduced-motion`.
- Q14 = `No especial`: solo `safe-area` mínimo de tabbar/CTA, sin manejo landscape/teclado avanzado. Riesgo aceptado: tabbar puede quedar bajo teclado en forms - mitigar con CTA sticky sobre teclado usando `visualViewport`.

### 3.10 Desktop unificado (Q5)
- Se permite rediseñar desktop. Estrategia: mismos componentes con `md:` variants, no duplicar lógica. `components/ui/*` (button, sheet, tabs, sonner) se extienden, no se forkear.
- `Toaster` hoy `top-right`: en mobile `bottom-center` sobre tabbar (`sonner@1.7.4` soporta `position` responsive vía CSS).

## 4. Roadmap

**Sprint 0 - Shell (2-3 días):**
- [ ] `MobileNav.tsx` + `FilterSheet.tsx` + layout responsive `page.tsx`
- [ ] `viewport` + `manifest.ts` + iconos + `ThemeProvider system`
- [ ] Header mobile compacto

**Sprint 1 - Pipeline/Projects/Contacts (1-2 semanas):**
- [ ] Cards + SwipeRow + search sticky por lista
- [ ] Detalle fullscreen con CTA sticky
- [ ] Filtros sheet + vista guardada
- [ ] Gestos + pull-refresh + haptics

**Sprint 2 - Wizard + Cámara/Firma (1 semana):**
- [ ] Wizard Constructor/crear + borrador
- [ ] `capture=environment` → extract OCR existente
- [ ] Firma dedo → `contrato-gen.pdf`

**Sprint 3 - PWA offline lectura + pulido:**
- [ ] Cache listas + badge offline + cola notas
- [ ] `next/image` lazy, virtualizar si >100 items (`@tanstack/virtual` - añadir)
- [ ] Auditoría 360px, 390px (iPhone), Android 360dpi, una mano

**Pospuesto explícito:** Dashboard/Reports completos, push, biometría, budget LCP, beta con flags.

## 5. Archivos a tocar (orden)

1. `app/layout.tsx` - viewport, theme system, toaster responsive
2. `app/manifest.ts` (nuevo) + `public/icons/*`
3. `app/page.tsx:137-183` - `ml-0 md:ml-...`, `p-4 md:p-6`
4. `components/MobileNav.tsx` (nuevo), `components/Sidebar.tsx` → `hidden md:flex`
5. `components/Header.tsx` - compact mobile
6. `components/MobileCard.tsx`, `SwipeRow.tsx`, `FilterSheet.tsx` (nuevos)
7. `features/Pipeline.tsx`, `features/Projects.tsx`, `ProjectDetail.tsx`, `features/Contacts.tsx`, `ContactDetail.tsx`
8. `features/Constructor.tsx` - wizard wrapper mobile
9. `app/api/quotes/extract/route.ts`, `app/api/payments/extract/route.ts` - aceptar `image/*` mobile (ya lo hacen, solo validar tamaño <8MB)
10. `app/globals.css` - radios, 16px inputs, safe-area utilities

## 6. Riesgos por tus decisiones

- **Q22 Directo prod:** sin beta/flags, cualquier cambio en `page.tsx`/`Sidebar` rompe desktop. Mitigación mínima: `git tag pre-mobile`, QA checklist 15 min por sección, rollback inmediato.
- **Q21 Sin budget:** `recharts` + listas largas pueden sentirse lentas en Android gama media. Mitigación: lazy-load charts aunque no midas LCP.
- **Q14 No especial notch/teclado:** en iPhone con Dynamic Island y Android con gesture-bar puede haber overlap. Al menos mantener `safe-area` en tabbar/CTA (ya incluido).
- **Q16 Simple search:** en campo con 500+ contactos el filtro simple sin recientes puede ser lento. Mitigar con índice local + debounce.

## 7. Checklist aceptación Fase 1

- [ ] Pipeline/Projects/Contacts usables a una mano 360px sin zoom horizontal
- [ ] Bottom nav 4 + Más, CTA ≥48px, inputs 16px sin auto-zoom
- [ ] Cards con swipe Llamar/WhatsApp/Editar + fallback `...`
- [ ] Detalle fullscreen con CTA sticky y cerrar swipe-down/X
- [ ] Wizard 4 pasos con borrador + cámara → OCR + firma funciona en Android Chrome y iOS Safari
- [ ] PWA instalable, `standalone`, offline lectura con badge
- [ ] System light/dark correcto, sin regresión desktop `md:`
