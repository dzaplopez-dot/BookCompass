/**
 * Página de inicio de sesión.
 *
 * Permite entrar con correo/contraseña o con Google. Los errores del
 * servicio llegan traducidos al español vía `useAuth().error`.
 */
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Spinner } from '../components/common/Spinner';
import { useAuth } from '../hooks/useAuth';
import { isValidEmail } from '../utils/validation';

/** Clases Stitch de los campos con icono a la izquierda. */
const inputClasses = (hasError: boolean): string =>
  `w-full rounded-[10px] border bg-surface-container-lowest py-3 pl-10 pr-3 text-on-surface outline-none transition placeholder:text-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container ${
    hasError ? 'border-error' : 'border-outline-variant'
  }`;

/** Página pública de autenticación con correo y Google. */
export default function LoginPage() {
  const { login, loginWithGoogle, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  /** Envía el formulario tras validar el formato del correo. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    clearError();

    if (!isValidEmail(email)) {
      setValidationMessage('Introduce un correo electrónico válido.');
      return;
    }
    setValidationMessage(null);

    setSubmitting(true);
    try {
      await login({ email, password });
      navigate('/home', { replace: true });
    } catch {
      // El mensaje amigable ya quedó en `error` (contexto).
    } finally {
      setSubmitting(false);
    }
  }

  /** Inicia sesión con Google mediante popup. */
  async function handleGoogle(): Promise<void> {
    clearError();
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/home', { replace: true });
    } catch {
      // Mensaje gestionado por el contexto.
    } finally {
      setGoogleLoading(false);
    }
  }

  const bannerMessage = validationMessage ?? error;

  return (
    <main className="flex min-h-svh items-center justify-center bg-surface p-5 antialiased md:p-10">
      <section className="w-full max-w-[480px] rounded-[12px] bg-surface-container-lowest p-8 shadow-card md:p-12">
        <div className="mb-12 flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-container text-4xl text-white"
          >
            🧭
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-on-surface">
            Bienvenido de nuevo
          </h1>
          <p className="mt-2 text-base leading-relaxed text-on-surface-variant">
            Inicia sesión para continuar en BookCompass
          </p>
        </div>

        {bannerMessage ? (
          <p
            role="alert"
            className="mb-4 rounded-[10px] border border-error bg-error-container px-4 py-3 text-sm text-on-error-container"
          >
            {bannerMessage}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="relative">
            <label htmlFor="login-email" className="sr-only">
              Correo electrónico
            </label>
            <span
              aria-hidden="true"
              className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center leading-none text-outline"
            >
              mail
            </span>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClasses(Boolean(bannerMessage))}
              aria-invalid={Boolean(bannerMessage)}
              disabled={submitting || googleLoading}
            />
          </div>

          <div className="relative">
            <label htmlFor="login-password" className="sr-only">
              Contraseña
            </label>
            <span
              aria-hidden="true"
              className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center leading-none text-outline"
            >
              lock
            </span>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClasses(Boolean(bannerMessage))}
              aria-invalid={Boolean(bannerMessage)}
              disabled={submitting || googleLoading}
            />
          </div>

          <div className="flex items-center justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary-container transition hover:opacity-80"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={submitting || googleLoading}
            className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[12px] bg-primary-container py-3 text-lg font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Spinner size="sm" /> : null}
            {submitting ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="mt-6 flex items-center">
          <div className="flex-grow border-t border-outline-variant"></div>
          <span className="mx-4 text-xs text-on-surface-variant">o continuar con</span>
          <div className="flex-grow border-t border-outline-variant"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={submitting || googleLoading}
          className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-outline-variant py-3 text-sm font-medium text-on-surface transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleLoading ? (
            <Spinner size="sm" />
          ) : (
            <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65Z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.27-3.16.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19Z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
              />
            </svg>
          )}
          Iniciar con Google
        </button>

        <p className="mt-6 text-center text-base text-on-surface-variant">
          ¿No tienes una cuenta?{' '}
          <Link
            to="/register"
            className="font-semibold text-primary-container transition hover:opacity-80"
          >
            Regístrate
          </Link>
        </p>
      </section>
    </main>
  );
}
