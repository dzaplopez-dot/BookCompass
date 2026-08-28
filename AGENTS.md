# AGENTS.md — Contexto del proyecto Book Compass

Instrucciones permanentes para sesiones de OpenCode en este repositorio.

## Proyecto

**Book Compass** — PWA de descubrimiento literario (Open Library API) con
autenticación y perfiles en Firebase. Usuario única: Daniela. Idioma de la UI,
comentarios y documentación: **español**.

## Reglas de trabajo (obligatorias)

1. **Plan antes que código**: presentar plan detallado y esperar aprobación
   explícita ("Acepto", "Continúa", "Sí") antes de escribir nada.
2. **Sin comandos sin autorización**: no ejecutar instalaciones ni operaciones
   destructivas sin confirmación previa.
3. **🚫 SIN TESTS AUTOMATIZADOS en esta etapa MVP**: nada de unit/integration/
   E2E ni frameworks de testing (decisión tomada el 2026-08-24). La calidad se
   valida con: pruebas manuales del usuario tras cada fase, checklist de flujos
   críticos en Notion y humo multi-navegador. Los tests se añadirán después del
   MVP si hay tracción. **No reinstalar ni recrear infraestructura de testing.**
4. Mantener siempre: **TypeScript estricto**, **JSDoc** en archivos/funciones,
   **SOLID** (una responsabilidad por archivo/módulo), código limpio.
5. Verificación de cada fase: `npm run format && npm run lint && npm run build`.

## Decisiones técnicas vigentes

- **Sin ports/adapters ni DI**: servicios como clases simples con un singleton
  exportado (`export const authService = new AuthService()`), usando el SDK de
  Firebase directamente. Errores envueltos con `normalizeError` (`utils/errors.ts`)
  → `AppError` con mensajes en español.
- **Stack**: Vite 8.2 · React 19.2 · TS 6.0 (`strict`) · Tailwind v4 vía
  `@tailwindcss/vite` · vite-plugin-pwa 1.3 · ESLint 10 flat + Prettier
  integrado · firebase 12.18 · react-router-dom 7.
- **Analítica local (opción A1)**: `services/analytics.service.ts` registra en
  `console.debug` + `localStorage` (clave `bookcompass_analytics`, máx. 100
  eventos). Firebase Analytics queda para después; solo cambiaría el interior
  de la clase.
- **Tokens de diseño** (`src/index.css`): `--color-paper #faf7f2`,
  `--color-ink #1c1917`, marca ámbar `brand-500 #d97706`, `--font-display`
  Georgia serif. Estilos mobile-first.
- **Imágenes de portada**: componente `components/books/BookCover.tsx` con
  `<picture>` (AVIF → WebP → JPEG), `loading="lazy"`, `decoding="async"` y
  dimensiones fijas (aspect-ratio 2/3, width/height) contra layout shift.
  Hoy Internet Archive solo sirve JPEG 180×273 px (`services/img`), así que
  WebP/AVIF llegan como `null`; la construcción de URLs está centralizada en
  `getCoverUrls()` (`types/archive-books.types.ts`) para apuntar a un futuro
  CDN/proxy propio sin romper el mapeo. Sin dependencias de conversión ni
  infraestructura de imágenes en esta fase (ver pendientes).
- **Firebase**: proyecto `bookcompass-e9bad`, región `us-central1`. Credenciales
  reales en `.env.local` (ignorado por git; plantilla en `.env.example`).
  Reglas Firestore: solo el dueño lee/escribe `users/{userId}`. El service
  worker de FCM (`public/firebase-messaging-sw.js`) recibe sus placeholders
  `__VITE_FIREBASE_*__` sustituidos en build por un plugin inline de
  `vite.config.ts`.

## Estructura clave

```
src/
├── config/       env.ts (validación fail-fast de VITE_FIREBASE_*), firebase.ts (singletons lazy)
├── context/      AuthContext.tsx + auth-context.ts (sesión, perfil, errores)
│                 FavoritesContext.tsx + favorites-context.ts (favoritos)
├── hooks/        useAuth.ts · useFavorites.ts (lanzan si se usan fuera de su provider)
├── services/     auth · firestore (CRUD genérico + perfiles) · messaging · analytics · favorites
├── components/books/  BookCard · BookCover (imagen responsiva) · SearchBar · FavoriteButton
├── components/common/  Spinner · PrivateRoute (/login si no hay sesión) · PublicRoute (/home si hay sesión)
├── pages/        LoginPage · RegisterPage · ForgotPasswordPage · HomePage · BookDetailPage
├── types/        dominio puro sin dependencias del SDK
└── utils/        errors.ts (AppError/normalizeError) · validation.ts (email/password)
```

Rutas: `/login`, `/register`, `/forgot-password` (públicas) · `/home` (privada)
· `/books/:id` (privada, detalle de libro) · fallback → `/login`. Al
login/registro: upsert de perfil en Firestore + `lastLoginAt` + evento de
analítica. Favoritos en `users/{uid}/favorites` (ver «Pendiente manual»).

## Estado actual (2026-08-24)

- ✅ Fase 1 — Setup base (Vite+React+TS+Tailwind+PWA+ESLint/Prettier)
- ✅ Fase 2 — Firebase (auth/firestore/messaging + reglas + .env)
- ✅ Fase 3 — Autenticación completa (contexto, guardas, 4 páginas, App.tsx).
  Verificación format/lint/build en verde. **Prueba manual validada por la usuaria
  (25/08/2026): los 9 flujos aprobados. Fase cerrada.**
- ✅ Fase 4 — Internet Archive Books API (servicio + UI descubrimiento): `archive-books.service.ts`
  con rate-limit, reintentos 429/5xx y caché TTL; `rate-limiter.ts` cola serial
  reutilizable; SearchBar con debounce 450 ms; BookCard con portada; HomePage
  con grid, paginación "Cargar más" y estados. Formato/lint/build verdes.
  **Pendiente: prueba manual de la usuaria.**
- ✅ Fase 5 — Detalle de libro + Favoritos (código listo, en desarrollo):
  - Detalle: `types` (`BookDetail` + `mapArchiveDetail`), `getBookDetail()` en
    `archive-books.service.ts` (endpoint `metadata/{id}`), `pages/BookDetailPage.tsx`
    con ruta `/books/:id`, BookCard clicable.
  - Favoritos: `services/favorites.service.ts` (`users/{uid}/favorites`),
    `context/FavoritesContext.tsx` + `hooks/useFavorites.ts`, botón ★ en tarjeta
    y detalle, sección "Mis favoritos" en HomePage.
  - Formato/lint/build verdes. **Pendiente: aplicar regla Firestore de favoritos
    en Firebase Console + prueba manual.**
- 🗑️ Esta misma sesión se eliminó TODO el testing (16 archivos _.test._,
  bloque test de vite.config, scripts y devDeps vitest/jsdom/@testing-library).

## Pendiente manual (Firebase Console)

Las reglas de Firestore viven en Firebase Console (no versionadas aún en el repo).
Para que los favoritos funcionen, añadir a las reglas:

```js
match /users/{userId}/favorites/{favoriteId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## Siguientes pasos

1. ✅ **Notion**: documentación creada el 2026-08-24 dentro de la página
   «Internet Archive Books API» del workspace de Daniela. Raíz:
   https://app.notion.com/p/Book-Compass-3c7451930b5981e1a9a5f7ed8f52594b
   Contiene: Roadmap y fases · Decisiones técnicas · base de datos «Checklist
   de pruebas manuales» (9 flujos de F3 en estado Pendiente) · Guía de setup.
   **Mantener actualizada al cerrar cada fase.** El servidor MCP `notion`
   (@notionhq/notion-mcp-server) está configurado en la config global de
   OpenCode para sesiones nuevas; si no estuviera disponible, usar la API REST
   directa con el token de la integración `bookcompass-docs`.
2. **Fase 4 — Internet Archive Books API** (código listo, pendiente prueba manual):
   - `types/archive-books.types.ts` + `services/rate-limiter.ts` + `services/archive-books.service.ts`
   - `components/books/BookCard.tsx` + `components/books/BookCover.tsx` + `components/books/SearchBar.tsx`
   - `pages/HomePage.tsx` evolucionada con búsqueda, grid y paginación
   - Verificar: búsqueda funcional, portadas, caché, debounce, errores en español, "Cargar más".
3. **Fase 5 — Detalle de libro + Favoritos** (código listo, pendiente reglas + prueba manual):
   - Aplicar regla Firestore de favoritos en Firebase Console (ver «Pendiente manual»).
   - Verificar: clic en BookCard → detalle; ★ guardar/quitar; "Mis favoritos" en Home.
4. **Pendiente (futuro, fuera de MVP) — CDN/proxy propio de imágenes**:
   - Internet Archive solo sirve las portadas en JPEG 180×273. Para AVIF/WebP de
     alta resolución haría falta un backend/proxy que descargue y convierta.
     `BookCover` y `getCoverUrls()` ya están preparados: basta rellenar
     `coverUrlWebp`/`coverUrlAvif` y añadir un `<source>` en `<picture>`.
