/**
 * Componente raíz de Book Compass.
 *
 * Compone la aplicación en tres capas:
 * 1. `AuthProvider`: estado global de sesión (debe envolver al router para
 *    que las guardas de ruta puedan consultarlo).
 * 2. `BrowserRouter`: enrutado del lado cliente.
 * 3. `Routes`: rutas públicas (login/registro/recuperación) y privadas
 *    (`/home`), con redirección por defecto a `/login`.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PrivateRoute } from './components/common/PrivateRoute';
import { PublicRoute } from './components/common/PublicRoute';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { GenresProvider } from './context/GenresContext';
import BookDetailPage from './pages/BookDetailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import GenresOnboardingPage from './pages/GenresOnboardingPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import MapPage from './pages/MapPage';
import NearbyPage from './pages/NearbyPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';

/** Árbol de rutas de la aplicación. */
export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <GenresProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPasswordPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <PrivateRoute>
                    <GenresOnboardingPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/home"
                element={
                  <PrivateRoute>
                    <HomePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/books/:id"
                element={
                  <PrivateRoute>
                    <BookDetailPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/map"
                element={
                  <PrivateRoute>
                    <MapPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/cerca"
                element={
                  <PrivateRoute>
                    <NearbyPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/perfil"
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </GenresProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
