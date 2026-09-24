# 🧭 Book Compass

PWA de descubrimiento literario con la API de **Internet Archive**, autenticación y perfiles en **Firebase**. Idioma de la UI y del código: **español**.

## Stack

- **Vite 8.2** · **React 19.2** · **TypeScript 6.0** (`strict`)
- **Tailwind CSS v4** (vía `@tailwindcss/vite`) + tipografías `Libre Caslon Text` / `Hanken Grotesk`
- **vite-plugin-pwa 1.3** (Workbox: precache + caché de portadas, API y teselas)
- **Firebase 12.18** (Auth · Firestore · Cloud Messaging) · **react-router-dom 7**
- **Leaflet** (mapa open-source, sin clave) · **ESLint 10** flat + **Prettier**

> 🚫 **Sin tests automatizados en esta etapa MVP** (decisión vigente): la calidad se valida con prueba manual + `npm run format && npm run lint && npm run build`.

## Decisiones vigentes

- Servicios como **clases simples con singleton exportado** (sin ports/adapters ni DI), usando el SDK de Firebase directamente. Errores con `normalizeError` → `AppError` en español.
- **Analítica local**: `console.debug` + `localStorage` (clave `bookcompass_analytics`, máx. 100 eventos).
- Portadas de 180×273 px (Internet Archive solo sirve JPEG); `getCoverUrls()` centraliza las URLs para un futuro CDN.

## Estructura (`src/`)

```
config/      env.ts (fail-fast de VITE_FIREBASE_*) · firebase.ts (singletons lazy)
context/     Auth · Favorites · Genres (+ auth-context.ts, etc.)
hooks/       useAuth · useFavorites · useGenres
services/    auth · firestore · messaging · analytics · favorites ·
             genres · book-markers · geocoder · archive-books · rate-limiter
components/  books/ (BookCard, BookCover, SearchBar, FavoriteButton)
             home/ (GenreSelector) · map/ (MapView reutilizable)
             common/ (Spinner, BottomNav, PrivateRoute, PublicRoute)
pages/       Login · Register · ForgotPassword · GenresOnboarding · Home ·
             BookDetail · Map · Nearby · Profile
types/       dominio puro (sin SDK) · utils/ errors (AppError) · validation
```

## Rutas

| Ruta                                                         | Acceso  |
| ------------------------------------------------------------ | ------- |
| `/login`, `/register`, `/forgot-password`                    | Pública |
| `/onboarding` (géneros 3–5)                                  | Privada |
| `/home` (buscar + recomendado + favoritos)                   | Privada |
| `/books/:id` (detalle)                                       | Privada |
| `/map` (mapa) · `/cerca` (mapa + recomendados por ubicación) | Privada |
| `/perfil` (perfil editable)                                  | Privada |

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # rellenar con VITE_FIREBASE_* del proyecto
npm run dev                  # http://localhost:5173/
```

## Reglas de Firestore (Firebase Console, no versionadas)

```js
match /users/{userId}/favorites/{favoriteId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
match /book_markers/{markerId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.resource.data.createdBy == request.auth.uid;
}
```

## Verificación

```bash
npm run format && npm run lint && npm run build
```
